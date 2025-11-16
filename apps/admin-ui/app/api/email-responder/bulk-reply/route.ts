import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { bulkReplyLogger } from "@/lib/debug"

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

// Send bulk replies via Gmail
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { emailIds, customMessage } = await request.json()

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json(
        { error: "Email IDs array required" },
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

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "No emails found" },
        { status: 404 }
      )
    }

    // Check if Gmail access token is available
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id!,
        provider: "google"
      }
    })

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "Gmail not connected. Please sign in with Google to send emails." },
        { status: 403 }
      )
    }

    const accessToken = account.access_token

    // Send replies
    const results = []
    const errors = []

    for (const email of emails) {
      try {
        // Use custom message if provided, otherwise use autoResponse
        const messageBody = customMessage || email.autoResponse

        if (!messageBody) {
          errors.push({
            emailId: email.id,
            error: "No response available for this email"
          })
          continue
        }

        // Create email message in RFC 2822 format
        const emailMessage = [
          `To: ${email.fromEmail}`,
          `Subject: Re: ${email.subject}`,
          `In-Reply-To: ${email.conversationId}`,
          `References: ${email.conversationId}`,
          "",
          messageBody
        ].join("\r\n")

        // Encode message in base64url
        const encodedMessage = Buffer.from(emailMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")

        // Send via Gmail API
        const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            raw: encodedMessage
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || "Failed to send email")
        }

        const sentMessage = await response.json()

        // Update database
        await prisma.emailCorrespondence.update({
          where: { id: email.id },
          data: {
            needsAction: false,
            updatedAt: new Date()
          }
        })

        results.push({
          emailId: email.id,
          messageId: sentMessage.id,
          to: email.fromEmail,
          subject: email.subject,
          success: true
        })
      } catch (error) {
        console.error(`Failed to send email ${email.id}:`, error)
        errors.push({
          emailId: email.id,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    })
  } catch (error) {
    console.error("Bulk reply error:", error)
    return NextResponse.json(
      { error: "Failed to send bulk replies", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
