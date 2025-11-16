import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GroupType } from "@prisma/client"

interface EmailWithGrouping {
  id: string
  messageText: string
  subject: string
  fromEmail: string
  orderNumber: string | null
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

    const { emailIds } = await request.json()

    if (!emailIds || !Array.isArray(emailIds)) {
      return NextResponse.json(
        { error: "Invalid email IDs" },
        { status: 400 }
      )
    }

    // Fetch emails from database
    const emails = await prisma.emailCorrespondence.findMany({
      where: {
        id: { in: emailIds },
        userId: session.user.id
      }
    })

    // First, consolidate emails by conversation ID
    const conversations = consolidateByConversation(emails)
    
    // Then group conversations by type
    const groupedEmails = await groupEmailsByType(conversations)

    // Create or update groups in database
    const groups = await Promise.all(
      Object.entries(groupedEmails).map(async ([type, emailList]) => {
        // Find or create group
        let group = await prisma.emailGroup.findFirst({
          where: {
            type: type as GroupType,
            userId: session.user.id
          }
        })

        if (!group) {
          group = await prisma.emailGroup.create({
            data: {
              name: getGroupName(type as GroupType),
              description: getGroupDescription(type as GroupType),
              type: type as GroupType,
              priority: getGroupPriority(type as GroupType),
              isExpanded: type === "PRIORITY", // Auto-expand priority emails
              userId: session.user.id
            }
          })
        }

        // Update emails to belong to this group
        await prisma.emailCorrespondence.updateMany({
          where: {
            id: { in: emailList.map(e => e.id) }
          },
          data: {
            groupId: group.id
          }
        })

        // Return group with emails
        return {
          ...group,
          emails: emailList
        }
      })
    )

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Grouping error:", error)
    return NextResponse.json(
      { error: "Failed to group emails" },
      { status: 500 }
    )
  }
}

function consolidateByConversation(emails: any[]): any[] {
  // Emails are already grouped by Ticket ID in the upload phase
  // Just return them as-is since each email already represents a full conversation thread
  return emails
}

async function groupEmailsByType(emails: any[]): Promise<Record<string, any[]>> {
  const groups: Record<string, any[]> = {
    PRIORITY: [],
    ORDER_STATUS: [],
    WHOLESALE: [],
    NO_ACTION: [],
    OTHER: []
  }

  for (const email of emails) {
    const messageText = email.messageText.toLowerCase()
    const subject = (email.subject || "").toLowerCase()
    
    // Priority: Damaged items, wrong items, refunds
    if (
      messageText.includes("damage") ||
      messageText.includes("broken") ||
      messageText.includes("wrong item") ||
      messageText.includes("incorrect") ||
      messageText.includes("refund") ||
      messageText.includes("return")
    ) {
      groups.PRIORITY.push(email)
    }
    // Wholesale inquiries
    else if (
      messageText.includes("wholesale") ||
      messageText.includes("bulk") ||
      messageText.includes("resell") ||
      messageText.includes("distributor") ||
      messageText.includes("business")
    ) {
      groups.WHOLESALE.push(email)
    }
    // Order status inquiries
    else if (
      messageText.includes("where") ||
      messageText.includes("track") ||
      messageText.includes("status") ||
      messageText.includes("order") ||
      messageText.includes("ship") ||
      email.orderNumber
    ) {
      groups.ORDER_STATUS.push(email)
    }
    // No action needed (thank you messages, confirmations)
    else if (
      messageText.includes("thank you") ||
      messageText.includes("thanks") ||
      messageText.includes("received") ||
      messageText.includes("perfect") ||
      messageText.includes("great") ||
      messageText.length < 50
    ) {
      groups.NO_ACTION.push(email)
    }
    // Everything else
    else {
      groups.OTHER.push(email)
    }
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, emails]) => emails.length > 0)
  )
}

function getGroupName(type: GroupType): string {
  const names: Record<GroupType, string> = {
    PRIORITY: "🚨 Priority Messages (Damaged/Wrong Items)",
    ORDER_STATUS: "📦 Order Status Messages",
    WHOLESALE: "👥 Wholesale Inquiries",
    NO_ACTION: "✅ No Action Needed",
    OTHER: "📧 Other Messages"
  }
  return names[type] || "Other"
}

function getGroupDescription(type: GroupType): string {
  const descriptions: Record<GroupType, string> = {
    PRIORITY: "Urgent issues requiring immediate attention",
    ORDER_STATUS: "Questions about order status and tracking",
    WHOLESALE: "Business and wholesale inquiries",
    NO_ACTION: "Messages that don't require a response",
    OTHER: "General inquiries and other messages"
  }
  return descriptions[type] || ""
}

function getGroupPriority(type: GroupType): number {
  const priorities: Record<GroupType, number> = {
    PRIORITY: 1,
    ORDER_STATUS: 2,
    WHOLESALE: 3,
    OTHER: 4,
    NO_ACTION: 5
  }
  return priorities[type] || 99
}

// GET endpoint to fetch existing groups
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const groups = await prisma.emailGroup.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        emails: true
      },
      orderBy: {
        priority: 'asc'
      }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Fetch groups error:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    )
  }
}
