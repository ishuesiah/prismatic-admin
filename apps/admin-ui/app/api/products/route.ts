import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/products - List products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const sortBy = searchParams.get("sortBy") || "updatedAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { pickNumber: { contains: search, mode: "insensitive" } },
        { locationCode: { contains: search, mode: "insensitive" } }
      ]
    }

    if (category && category !== "ALL") {
      where.category = category
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    // Validate sort field
    const validSortFields = ["sku", "name", "updatedAt", "createdAt", "category", "status"]
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "updatedAt"

    // Get products with count
    const [products, total, activeCount, needsSyncCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [orderByField]: sortOrder === "asc" ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.product.count({
        where: {
          ...where,
          OR: [
            { lastShopifySync: null, shopifyProductId: { not: null } },
            { lastShipstationSync: null, shipstationProductId: { not: null } },
            { shopifySyncError: { not: null } },
            { shipstationSyncError: { not: null } }
          ]
        }
      })
    ])

    return NextResponse.json({
      products,
      stats: {
        total,
        active: activeCount,
        needsSync: needsSyncCount
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Products list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      sku,
      name,
      pickNumber,
      locationCode,
      shopifyProductId,
      shopifyVariantId,
      shipstationProductId,
      category,
      status,
      notes
    } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      )
    }

    // Generate SKU if not provided
    let finalSku = sku?.trim()
    if (!finalSku) {
      // Generate a SKU based on category and timestamp
      const prefix = category?.substring(0, 3).toUpperCase() || "PRD"
      const timestamp = Date.now().toString(36).toUpperCase()
      finalSku = `HO-${prefix}-${timestamp}`
    }

    // Check for duplicate SKU
    const existingSku = await prisma.product.findUnique({
      where: { sku: finalSku }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: `SKU "${finalSku}" already exists` },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        sku: finalSku,
        name: name.trim(),
        pickNumber: pickNumber?.trim() || null,
        locationCode: locationCode?.trim() || null,
        shopifyProductId: shopifyProductId?.trim() || null,
        shopifyVariantId: shopifyVariantId?.trim() || null,
        shipstationProductId: shipstationProductId?.trim() || null,
        category: category || "ACCESSORY",
        status: status || "DRAFT",
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Product create error:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}
