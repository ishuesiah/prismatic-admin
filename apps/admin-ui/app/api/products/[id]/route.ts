import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        syncLogs: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
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

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check for duplicate SKU (if SKU changed)
    if (sku && sku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku }
      })

      if (duplicateSku) {
        return NextResponse.json(
          { error: `SKU "${sku}" already exists` },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        sku: sku?.trim() || existing.sku,
        name: name.trim(),
        pickNumber: pickNumber?.trim() || null,
        locationCode: locationCode?.trim() || null,
        shopifyProductId: shopifyProductId?.trim() || null,
        shopifyVariantId: shopifyVariantId?.trim() || null,
        shipstationProductId: shipstationProductId?.trim() || null,
        category: category || existing.category,
        status: status || existing.status,
        notes: notes?.trim() || null
      },
      include: {
        syncLogs: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product update error:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Delete product (cascade will delete sync logs)
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
