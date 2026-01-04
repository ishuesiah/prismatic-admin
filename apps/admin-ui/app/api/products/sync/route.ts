import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Shopify metafield configuration
const SHOPIFY_METAFIELD_NAMESPACE = "hemlock_oak"
const SHOPIFY_METAFIELDS = {
  pick_number: { key: "pick_number", type: "single_line_text_field" },
  location_code: { key: "location_code", type: "single_line_text_field" },
  category: { key: "category", type: "single_line_text_field" }
}

// ShipStation custom field configuration
const SHIPSTATION_CUSTOM_FIELDS = {
  pick_number: "customField1",
  location_code: "customField2",
  category: "customField3"
}

interface SyncResult {
  productId: string
  success: boolean
  error?: string
}

async function syncToShopify(product: any): Promise<SyncResult> {
  const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL
  const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN

  if (!shopifyStoreUrl || !shopifyAccessToken) {
    return {
      productId: product.id,
      success: false,
      error: "Shopify credentials not configured"
    }
  }

  if (!product.shopifyProductId) {
    return {
      productId: product.id,
      success: false,
      error: "No Shopify Product ID linked"
    }
  }

  try {
    // Build metafields array
    const metafields = []

    if (product.pickNumber) {
      metafields.push({
        namespace: SHOPIFY_METAFIELD_NAMESPACE,
        key: SHOPIFY_METAFIELDS.pick_number.key,
        value: product.pickNumber,
        type: SHOPIFY_METAFIELDS.pick_number.type
      })
    }

    if (product.locationCode) {
      metafields.push({
        namespace: SHOPIFY_METAFIELD_NAMESPACE,
        key: SHOPIFY_METAFIELDS.location_code.key,
        value: product.locationCode,
        type: SHOPIFY_METAFIELDS.location_code.type
      })
    }

    if (product.category) {
      metafields.push({
        namespace: SHOPIFY_METAFIELD_NAMESPACE,
        key: SHOPIFY_METAFIELDS.category.key,
        value: product.category,
        type: SHOPIFY_METAFIELDS.category.type
      })
    }

    // Use Shopify GraphQL API to update product metafields
    const graphqlQuery = {
      query: `
        mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              metafields(first: 10, namespace: "${SHOPIFY_METAFIELD_NAMESPACE}") {
                edges {
                  node {
                    key
                    value
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          id: `gid://shopify/Product/${product.shopifyProductId}`,
          metafields
        }
      }
    }

    const response = await fetch(
      `https://${shopifyStoreUrl}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": shopifyAccessToken
        },
        body: JSON.stringify(graphqlQuery)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    if (result.data?.productUpdate?.userErrors?.length > 0) {
      const errors = result.data.productUpdate.userErrors
        .map((e: any) => e.message)
        .join(", ")
      throw new Error(errors)
    }

    return { productId: product.id, success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return {
      productId: product.id,
      success: false,
      error: errorMessage
    }
  }
}

async function syncToShipStation(product: any): Promise<SyncResult> {
  const apiKey = process.env.SHIPSTATION_API_KEY
  const apiSecret = process.env.SHIPSTATION_API_SECRET

  if (!apiKey || !apiSecret) {
    return {
      productId: product.id,
      success: false,
      error: "ShipStation credentials not configured"
    }
  }

  if (!product.shipstationProductId) {
    return {
      productId: product.id,
      success: false,
      error: "No ShipStation Product ID linked"
    }
  }

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

    // Get the existing product first
    const getResponse = await fetch(
      `https://ssapi.shipstation.com/products/${product.shipstationProductId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        }
      }
    )

    if (!getResponse.ok) {
      if (getResponse.status === 404) {
        throw new Error("Product not found in ShipStation")
      }
      throw new Error(`ShipStation API error: ${getResponse.status}`)
    }

    const existingProduct = await getResponse.json()

    // Update with custom fields
    const updateData = {
      ...existingProduct,
      customsDescription: product.name,
      // ShipStation uses customField1, customField2, customField3
      customField1: product.pickNumber || existingProduct.customField1 || "",
      customField2: product.locationCode || existingProduct.customField2 || "",
      customField3: product.category || existingProduct.customField3 || ""
    }

    const updateResponse = await fetch(
      `https://ssapi.shipstation.com/products/${product.shipstationProductId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      throw new Error(`ShipStation update failed: ${updateResponse.status} - ${errorText}`)
    }

    return { productId: product.id, success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return {
      productId: product.id,
      success: false,
      error: errorMessage
    }
  }
}

// POST /api/products/sync - Sync products to external systems
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { platform, productIds } = await request.json()

    if (!platform || !["shopify", "shipstation"].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform. Use 'shopify' or 'shipstation'" },
        { status: 400 }
      )
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs required" },
        { status: 400 }
      )
    }

    // Get products to sync
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    })

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No products found" },
        { status: 404 }
      )
    }

    // Sync products
    const results: SyncResult[] = []

    for (const product of products) {
      let result: SyncResult

      if (platform === "shopify") {
        result = await syncToShopify(product)
      } else {
        result = await syncToShipStation(product)
      }

      results.push(result)

      // Log the sync attempt
      await prisma.productSyncLog.create({
        data: {
          productId: product.id,
          platform: platform.toUpperCase() as "SHOPIFY" | "SHIPSTATION",
          action: result.success ? "push" : "error",
          success: result.success,
          errorMessage: result.error || null,
          details: {
            timestamp: new Date().toISOString(),
            fields: ["pickNumber", "locationCode", "category"]
          }
        }
      })

      // Update product sync status
      const updateData: any = {}
      if (platform === "shopify") {
        updateData.lastShopifySync = result.success ? new Date() : undefined
        updateData.shopifySyncError = result.error || null
      } else {
        updateData.lastShipstationSync = result.success ? new Date() : undefined
        updateData.shipstationSyncError = result.error || null
      }

      await prisma.product.update({
        where: { id: product.id },
        data: updateData
      })
    }

    const synced = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      synced,
      failed,
      results: results.map(r => ({
        productId: r.productId,
        success: r.success,
        error: r.error
      }))
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync products" },
      { status: 500 }
    )
  }
}
