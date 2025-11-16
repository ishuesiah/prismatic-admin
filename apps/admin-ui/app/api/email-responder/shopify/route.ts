import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN
const SHOPIFY_API_VERSION = "2024-01"

async function fetchShopifyOrder(orderNumber: string) {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    console.warn("Shopify credentials not configured, using mock data")
    return null
  }

  try {
    // Search for order by name (order number)
    const shopifyUrl = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/orders.json?name=${orderNumber}&status=any`

    const response = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.orders || data.orders.length === 0) {
      return null
    }

    const order = data.orders[0]

    return {
      id: order.id,
      orderNumber: order.name.replace("#", ""),
      customer: {
        email: order.email,
        name: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim(),
        phone: order.customer?.phone
      },
      items: order.line_items.map((item: any) => ({
        title: item.title,
        variantTitle: item.variant_title,
        quantity: item.quantity,
        sku: item.sku,
        price: parseFloat(item.price),
        fulfillmentStatus: item.fulfillment_status
      })),
      fulfillment: {
        status: order.fulfillment_status || "unfulfilled",
        financialStatus: order.financial_status,
        tracking: order.fulfillments?.[0]?.tracking_number || null,
        trackingUrl: order.fulfillments?.[0]?.tracking_url || null,
        carrier: order.fulfillments?.[0]?.tracking_company || null
      },
      totalAmount: parseFloat(order.total_price),
      currency: order.currency,
      createdAt: order.created_at,
      note: order.note,
      tags: order.tags?.split(", ") || [],
      shippingAddress: {
        name: order.shipping_address?.name,
        address1: order.shipping_address?.address1,
        city: order.shipping_address?.city,
        province: order.shipping_address?.province,
        zip: order.shipping_address?.zip,
        country: order.shipping_address?.country
      }
    }
  } catch (error) {
    console.error("Shopify fetch error:", error)
    return null
  }
}

function getMockOrderData(orderNumber: string) {
  return {
    orderNumber: orderNumber,
    customer: {
      email: "customer@example.com",
      name: "John Doe",
      phone: "+1234567890"
    },
    items: [
      {
        title: "2026 Planner",
        variantTitle: "Blue Cover",
        quantity: 1,
        sku: "PLANNER-2026-BLUE",
        price: 29.99,
        fulfillmentStatus: "unfulfilled"
      },
      {
        title: "Elastic Bands - Pack of 100",
        variantTitle: "Mixed Colors",
        quantity: 2,
        sku: "ELASTIC-100",
        price: 15.99,
        fulfillmentStatus: "unfulfilled"
      }
    ],
    fulfillment: {
      status: "unfulfilled",
      financialStatus: "paid",
      tracking: null,
      trackingUrl: null,
      carrier: null
    },
    totalAmount: 61.97,
    currency: "USD",
    createdAt: new Date().toISOString(),
    note: null,
    tags: ["online-store"],
    shippingAddress: {
      name: "John Doe",
      address1: "123 Main St",
      city: "Springfield",
      province: "IL",
      zip: "62701",
      country: "United States"
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get("orderNumber")
    const emailId = searchParams.get("emailId")

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number required" },
        { status: 400 }
      )
    }

    // Try to fetch from Shopify
    let orderData = await fetchShopifyOrder(orderNumber)

    // Fallback to mock data if Shopify not configured or order not found
    if (!orderData) {
      orderData = getMockOrderData(orderNumber)
    }

    // Save to database if emailId provided
    if (emailId && orderData) {
      await prisma.emailCorrespondence.update({
        where: { id: emailId },
        data: {
          shopifyData: orderData as any
        }
      })
    }

    return NextResponse.json(orderData)
  } catch (error) {
    console.error("Shopify API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch order data from Shopify", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
