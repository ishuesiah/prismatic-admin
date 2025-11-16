import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  internalDate?: string
  payload?: {
    headers?: Array<{ name: string; value: string }>
    parts?: Array<{ mimeType: string; body?: { data?: string } }>
    body?: { data?: string }
  }
}

function extractHeader(message: GmailMessage, headerName: string): string | null {
  const headers = message.payload?.headers || []
  const header = headers.find((h) => h.name.toLowerCase() === headerName.toLowerCase())
  return header?.value || null
}

function decodeBase64(data: string | undefined): string {
  if (!data) return ""
  try {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
  } catch (error) {
    console.error("Failed to decode base64:", error)
    return ""
  }
}

function extractMessageBody(message: GmailMessage): string {
  const payload = message.payload

  if (!payload) return message.snippet || ""

  // Check if body is directly in payload
  if (payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  // Check parts for text/plain or text/html
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data)
      }
    }
    // Fallback to first part with data
    for (const part of payload.parts) {
      if (part.body?.data) {
        return decodeBase64(part.body.data)
      }
    }
  }

  return message.snippet || ""
}

function extractOrderNumber(text: string): string | null {
  const patterns = [
    /#(\d{4,})/,
    /order\s*#?\s*(\d{4,})/i,
    /\b(\d{5,6})\b/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { maxResults = 50, query = "in:inbox -from:me" } = await request.json()

    // Get Gmail access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id!,
        provider: "google"
      }
    })

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "Gmail not connected. Please sign in with Google." },
        { status: 403 }
      )
    }

    const accessToken = account.access_token

    console.log(`🔄 Syncing Gmail inbox for ${session.user.email}...`)

    // Get message IDs
    const listResponse = await fetch(
      `${GMAIL_API_BASE}/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    if (!listResponse.ok) {
      const error = await listResponse.json()
      console.error("Gmail API error:", error)
      return NextResponse.json(
        { error: "Failed to fetch messages from Gmail", details: error },
        { status: listResponse.status }
      )
    }

    const listData = await listResponse.json()
    const messageIds = listData.messages || []

    if (messageIds.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "No new messages to sync"
      })
    }

    console.log(`📬 Found ${messageIds.length} messages to sync`)

    // Fetch full message details
    const messages: GmailMessage[] = []
    for (const { id } of messageIds.slice(0, maxResults)) {
      const messageResponse = await fetch(`${GMAIL_API_BASE}/messages/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (messageResponse.ok) {
        const message = await messageResponse.json()
        messages.push(message)
      }
    }

    // Process and save messages
    let syncedCount = 0
    let skippedCount = 0

    for (const message of messages) {
      try {
        const from = extractHeader(message, "From") || ""
        const subject = extractHeader(message, "Subject") || "No Subject"
        const messageBody = extractMessageBody(message)
        const date = message.internalDate
          ? new Date(parseInt(message.internalDate))
          : new Date()

        // Extract email address from "Name <email@example.com>" format
        const emailMatch = from.match(/<(.+?)>/) || from.match(/([^\s]+@[^\s]+)/)
        const fromEmail = emailMatch ? emailMatch[1] : from

        // Extract name
        const nameMatch = from.match(/^([^<]+)</)
        const fromName = nameMatch ? nameMatch[1].trim().replace(/"/g, "") : null

        // Check if message already exists
        const existing = await prisma.emailCorrespondence.findFirst({
          where: {
            conversationId: message.threadId,
            userId: session.user.id
          }
        })

        if (existing) {
          skippedCount++
          continue
        }

        // Extract order number
        const orderNumber = extractOrderNumber(messageBody + " " + subject)

        // Save to database
        await prisma.emailCorrespondence.create({
          data: {
            ticketId: message.id,
            conversationId: message.threadId,
            subject,
            fromEmail,
            fromName,
            messageText: messageBody,
            labels: message.labelIds || [],
            creationDate: date,
            needsAction: true,
            orderNumber,
            userId: session.user.id!
          }
        })

        syncedCount++
      } catch (error) {
        console.error(`Failed to process message ${message.id}:`, error)
      }
    }

    console.log(`✅ Synced ${syncedCount} new messages, skipped ${skippedCount} existing`)

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      skipped: skippedCount,
      total: messages.length
    })
  } catch (error) {
    console.error("Gmail sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync Gmail", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// GET sync status
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if Gmail is connected
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id!,
        provider: "google"
      }
    })

    const isConnected = !!account?.access_token

    // Get last sync time (most recent email creation date)
    const lastEmail = await prisma.emailCorrespondence.findFirst({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      isConnected,
      lastSync: lastEmail?.createdAt || null,
      userEmail: session.user.email
    })
  } catch (error) {
    console.error("Get sync status error:", error)
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    )
  }
}
