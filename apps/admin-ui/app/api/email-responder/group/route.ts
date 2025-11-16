import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GroupType } from "@prisma/client"
import Anthropic from "@anthropic-ai/sdk"
import { aiLogger } from "@/lib/debug"

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

interface EmailWithGrouping {
  id: string
  messageText: string
  subject: string
  fromEmail: string
  fromName: string | null
  orderNumber: string | null
}

interface AIGroupingResult {
  emailId: string
  category: GroupType
  urgency: number
  sentiment: string
  extractedName: string | null
  extractedOrderNumber: string | null
  keyIssues: string[]
  suggestedTone: string
  similarityTags: string[]
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
  console.log(`🤖 AI-powered grouping for ${emails.length} emails...`)

  // Process emails in batches for AI analysis
  const BATCH_SIZE = 15
  const allResults: AIGroupingResult[] = []

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE)
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(emails.length / BATCH_SIZE)}...`)

    const batchResults = await analyzeEmailsWithAI(batch)
    allResults.push(...batchResults)
  }

  // Update database with extracted data and AI insights
  await Promise.all(
    allResults.map(async (result) => {
      await prisma.emailCorrespondence.update({
        where: { id: result.emailId },
        data: {
          fromName: result.extractedName || undefined,
          orderNumber: result.extractedOrderNumber || undefined,
          aiInsights: {
            urgency: result.urgency,
            sentiment: result.sentiment,
            keyIssues: result.keyIssues,
            suggestedTone: result.suggestedTone,
            similarityTags: result.similarityTags
          }
        }
      })
    })
  )

  // Group emails by category
  const groups: Record<string, any[]> = {
    PRIORITY: [],
    ORDER_STATUS: [],
    WHOLESALE: [],
    NO_ACTION: [],
    OTHER: []
  }

  for (const result of allResults) {
    const email = emails.find(e => e.id === result.emailId)
    if (email) {
      // Enhance email object with AI insights
      email.aiInsights = {
        urgency: result.urgency,
        sentiment: result.sentiment,
        keyIssues: result.keyIssues,
        suggestedTone: result.suggestedTone,
        similarityTags: result.similarityTags
      }
      groups[result.category].push(email)
    }
  }

  // Further cluster similar emails within each group
  for (const [category, emailList] of Object.entries(groups)) {
    if (emailList.length > 1) {
      groups[category] = clusterSimilarEmails(emailList)
    }
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, emails]) => emails.length > 0)
  )
}

async function analyzeEmailsWithAI(emails: any[]): Promise<AIGroupingResult[]> {
  const emailSummaries = emails.map(email => ({
    id: email.id,
    subject: email.subject,
    from: email.fromEmail,
    name: email.fromName,
    message: email.messageText.substring(0, 1000), // Limit to 1000 chars for efficiency
    existingOrderNumber: email.orderNumber
  }))

  const prompt = `You are an intelligent customer service email analyzer. Analyze these customer emails and provide categorization and insights.

For each email, determine:
1. **category**: One of: PRIORITY (damaged/wrong items/urgent issues), ORDER_STATUS (tracking/shipping questions), WHOLESALE (business inquiries), NO_ACTION (thank you/positive feedback), OTHER
2. **urgency**: Rate 1-10 (10 = extremely urgent)
3. **sentiment**: positive, neutral, negative, or frustrated
4. **extractedName**: The customer's full name (from signature or context, not email address)
5. **extractedOrderNumber**: Any order number mentioned (look for patterns like #12345, Order 12345, order number 12345, etc.)
6. **keyIssues**: Array of main issues/topics (e.g., ["damaged planner", "missing refund"])
7. **suggestedTone**: How to respond (apologetic, informative, friendly, professional)
8. **similarityTags**: Tags for grouping similar emails (e.g., ["2026-planner", "damaged-cover", "elastic-bands"])

IMPORTANT:
- Look for order numbers in various formats (#12345, Order #12345, order 12345, etc.)
- Extract customer names from email signatures, "Thanks, [Name]", or context
- Be smart about categorization - "not damaged" should NOT be PRIORITY
- Group similar product issues together with meaningful tags

Emails to analyze:
${JSON.stringify(emailSummaries, null, 2)}

Respond with a JSON array of results, one per email, in the same order:
[
  {
    "emailId": "email_id_here",
    "category": "PRIORITY",
    "urgency": 8,
    "sentiment": "frustrated",
    "extractedName": "John Doe",
    "extractedOrderNumber": "12345",
    "keyIssues": ["damaged item", "refund requested"],
    "suggestedTone": "apologetic",
    "similarityTags": ["damaged-planner", "2026-planner"]
  }
]`

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type === "text") {
      // Extract JSON from the response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0])
        console.log(`✅ AI analyzed ${results.length} emails successfully`)
        return results
      }
    }

    throw new Error("Failed to parse AI response")
  } catch (error) {
    console.error("AI analysis error:", error)
    // Fallback to basic grouping
    return emails.map(email => ({
      emailId: email.id,
      category: "OTHER" as GroupType,
      urgency: 5,
      sentiment: "neutral",
      extractedName: email.fromName,
      extractedOrderNumber: email.orderNumber,
      keyIssues: [],
      suggestedTone: "friendly",
      similarityTags: []
    }))
  }
}

function clusterSimilarEmails(emails: any[]): any[] {
  // Group emails by similarity tags
  const clusters: Map<string, any[]> = new Map()

  for (const email of emails) {
    const tags = email.aiInsights?.similarityTags || []
    const clusterKey = tags.sort().join(",") || "unclustered"

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, [])
    }
    clusters.get(clusterKey)!.push(email)
  }

  // Sort emails within each cluster by urgency
  const sortedEmails: any[] = []
  for (const cluster of clusters.values()) {
    cluster.sort((a, b) => (b.aiInsights?.urgency || 0) - (a.aiInsights?.urgency || 0))
    sortedEmails.push(...cluster)
  }

  return sortedEmails
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
