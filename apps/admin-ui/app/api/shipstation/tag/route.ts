import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { shipstationLogger } from "@/lib/debug"

const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY
const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET
const SHIPSTATION_BASE_URL = "https://ssapi.shipstation.com"

function getShipStationHeaders() {
  if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
    throw new Error("ShipStation API credentials not configured")
  }

  const credentials = Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64')

  return {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/json"
  }
}

// GET order by order number
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

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number required" },
        { status: 400 }
      )
    }

    // Find order in ShipStation
    const response = await fetch(
      `${SHIPSTATION_BASE_URL}/orders?orderNumber=${orderNumber}`,
      {
        headers: getShipStationHeaders()
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("ShipStation API error:", error)
      return NextResponse.json(
        { error: "Failed to fetch order from ShipStation" },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.orders || data.orders.length === 0) {
      return NextResponse.json(
        { error: "Order not found in ShipStation" },
        { status: 404 }
      )
    }

    return NextResponse.json(data.orders[0])
  } catch (error) {
    console.error("ShipStation fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch order", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Add tag to order
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { orderNumber, emailId, tag } = await request.json()

    if (!orderNumber || !tag) {
      return NextResponse.json(
        { error: "Order number and tag required" },
        { status: 400 }
      )
    }

    // Validate tag
    const validTags = ["HOLD", "PRIORITY", "URGENT", "REVIEW"]
    if (!validTags.includes(tag.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid tag. Must be one of: ${validTags.join(", ")}` },
        { status: 400 }
      )
    }

    // First, get the order from ShipStation
    const ordersResponse = await fetch(
      `${SHIPSTATION_BASE_URL}/orders?orderNumber=${orderNumber}`,
      {
        headers: getShipStationHeaders()
      }
    )

    if (!ordersResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch order from ShipStation" },
        { status: ordersResponse.status }
      )
    }

    const ordersData = await ordersResponse.json()

    if (!ordersData.orders || ordersData.orders.length === 0) {
      return NextResponse.json(
        { error: "Order not found in ShipStation" },
        { status: 404 }
      )
    }

    const order = ordersData.orders[0]
    const orderId = order.orderId

    // Add tag using ShipStation's addtag endpoint
    const tagResponse = await fetch(
      `${SHIPSTATION_BASE_URL}/orders/addtag`,
      {
        method: "POST",
        headers: getShipStationHeaders(),
        body: JSON.stringify({
          orderId: orderId,
          tagId: null, // We'll use tagName instead
          tagName: tag.toUpperCase()
        })
      }
    )

    if (!tagResponse.ok) {
      const error = await tagResponse.text()
      console.error("ShipStation tag error:", error)
      return NextResponse.json(
        { error: "Failed to add tag to order" },
        { status: tagResponse.status }
      )
    }

    // Update the email correspondence with ShipStation data
    if (emailId) {
      await prisma.emailCorrespondence.update({
        where: { id: emailId },
        data: {
          shipstationData: {
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            tagAdded: tag.toUpperCase(),
            tagAddedAt: new Date().toISOString(),
            tagAddedBy: session.user.email
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      orderId: orderId,
      orderNumber: orderNumber,
      tag: tag.toUpperCase(),
      message: `Successfully tagged order ${orderNumber} with ${tag.toUpperCase()}`
    })
  } catch (error) {
    console.error("Add tag error:", error)
    return NextResponse.json(
      { error: "Failed to add tag", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE - Remove tag from order
export async function DELETE(request: NextRequest) {
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
    const tag = searchParams.get("tag")

    if (!orderNumber || !tag) {
      return NextResponse.json(
        { error: "Order number and tag required" },
        { status: 400 }
      )
    }

    // Get order ID
    const ordersResponse = await fetch(
      `${SHIPSTATION_BASE_URL}/orders?orderNumber=${orderNumber}`,
      {
        headers: getShipStationHeaders()
      }
    )

    if (!ordersResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch order from ShipStation" },
        { status: ordersResponse.status }
      )
    }

    const ordersData = await ordersResponse.json()

    if (!ordersData.orders || ordersData.orders.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const orderId = ordersData.orders[0].orderId

    // Remove tag
    const tagResponse = await fetch(
      `${SHIPSTATION_BASE_URL}/orders/removetag`,
      {
        method: "POST",
        headers: getShipStationHeaders(),
        body: JSON.stringify({
          orderId: orderId,
          tagName: tag.toUpperCase()
        })
      }
    )

    if (!tagResponse.ok) {
      return NextResponse.json(
        { error: "Failed to remove tag from order" },
        { status: tagResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed tag ${tag.toUpperCase()} from order ${orderNumber}`
    })
  } catch (error) {
    console.error("Remove tag error:", error)
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    )
  }
}
