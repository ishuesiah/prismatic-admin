import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Placeholder Shopify API integration
// Replace with actual Shopify API calls when credentials are available

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

    // Placeholder response - replace with actual Shopify API call
    // const shopifyUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2024-01/orders.json?name=${orderNumber}`
    // const response = await fetch(shopifyUrl, {
    //   headers: {
    //     'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!,
    //   }
    // })
    
    // Mock data for development
    const mockOrderData = {
      orderNumber: orderNumber,
      customer: {
        email: "customer@example.com",
        name: "John Doe"
      },
      items: [
        {
          title: "Elastic Bands - Pack of 100",
          quantity: 2,
          sku: "ELASTIC-100",
          price: 15.99,
          hasStockIssue: true // Flag for items with stock issues
        },
        {
          title: "Hair Charms - Set of 20",
          quantity: 1,
          sku: "CHARM-20",
          price: 9.99,
          hasStockIssue: true
        }
      ],
      fulfillment: {
        status: "pending",
        tracking: null
      },
      totalAmount: 41.97,
      createdAt: new Date().toISOString(),
      note: "Customer inquiring about order status"
    }

    return NextResponse.json(mockOrderData)
  } catch (error) {
    console.error("Shopify API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch order data from Shopify" },
      { status: 500 }
    )
  }
}
