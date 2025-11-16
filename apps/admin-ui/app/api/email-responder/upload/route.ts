import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Smart spam/system email filter - be selective, don't filter real customer emails
function isSpamOrSystemEmail(email: any): boolean {
  const subject = (email.Subject || email.subject || "").toLowerCase()
  const fromEmail = (email["Customer email"] || email.customerEmail || "").toLowerCase()
  const messageText = (email["Message text"] || email.messageText || "").toLowerCase()
  
  // Only filter obvious system/spam emails
  const blockedSenders = [
    "noreply@",
    "no-reply@",
    "@linkedin.com",
    "@facebookmail.com",
    "flow@shopify.com",
    "@judge.me",
    "@klaviyo.com",
    "pkginfo@ups.com",
    "@chitchats.com",
    "@canva.com"
  ]
  
  // Check if sender is blocked
  if (blockedSenders.some(blocked => fromEmail.includes(blocked))) {
    return true
  }
  
  // Review notifications
  if (subject.includes("left a") && subject.includes("star review")) {
    return true
  }
  
  // Shopify/system notifications
  if (subject.includes("is low in stock") || 
      subject.includes("shopify apps") ||
      subject.includes("automatic reply") ||
      subject.includes("out of office")) {
    return true
  }
  
  // Don't filter if it has a real customer email and some message
  if (fromEmail && fromEmail.includes("@") && !fromEmail.includes("noreply")) {
    return false
  }
  
  return true
}

// Group CSV rows by Ticket ID (rows without ticket ID belong to previous ticket)
function groupByTicketId(emails: any[]): any[] {
  const grouped: any[] = []
  let currentTicket: any = null
  
  for (const email of emails) {
    // Map CSV fields properly
    const ticketId = email["Ticket id"] || email.ticketId || ""
    const conversationId = email["Conversation id"] || email.conversationId || ""
    const customerEmail = email["Customer email"] || email.customerEmail || ""
    const customerName = email["Customer name"] || email.customerName || ""
    const subject = email["Subject"] || email.subject || ""
    const messageText = email["Message text"] || email.messageText || ""
    const labels = email["Labels"] || email.labels || ""
    const creationDate = email["Creation date"] || email.creationDate || ""
    const senderType = email["Sender type"] || email.senderType || ""
    const senderName = email["Sender name"] || email.senderName || ""
    
    // Build email object with proper fields
    const emailObj = {
      ticketId,
      conversationId, 
      customerEmail,
      customerName,
      subject,
      messageText,
      labels,
      creationDate,
      senderType,
      senderName
    }
    
    // Skip spam/system emails (but only if it's a ticket header with real email)
    if (ticketId && ticketId.trim() && isSpamOrSystemEmail(emailObj)) {
      console.log(`Filtered spam/system email: ${subject} from ${customerEmail}`)
      continue
    }
    
    // Skip system messages ONLY for thread messages (rows without ticket ID)
    // Don't filter the ticket header row (first row with ticket ID) even if it has no sender type
    if (!ticketId && isSystemMessage(emailObj)) {
      console.log(`Filtered system message: "${messageText.substring(0, 50)}..." from ${senderName || 'unknown'}`)
      continue
    }
    
    // If this row has a Ticket ID, it's a new conversation
    if (ticketId && ticketId.trim()) {
      // Save the previous ticket if it exists
      if (currentTicket) {
        grouped.push(currentTicket)
      }
      
      // Start new ticket
      currentTicket = {
        ticketId: ticketId,
        conversationId: conversationId || ticketId,
        conversationUrl: email["Conversation url"] || email.conversationUrl || "",
        subject: subject || "No Subject",
        customerEmail: customerEmail,
        customerName: customerName,
        creationDate: creationDate,
        closedDate: email["Closed date"] || email.closedDate || "",
        assignee: email["Assignee"] || email.assignee || "",
        labels: labels,
        inbox: email["Inbox"] || email.inbox || "",
        messages: []
      }
      
      // Add message if it exists and is from customer (first row often has no message)
      if (messageText && messageText.trim()) {
        console.log(`[TICKET HEADER] Checking message. SenderType: "${senderType}", SenderName: "${senderName}", Message: "${messageText.substring(0, 50)}..."`)
        // Add message unless we're sure it's NOT a customer message
        if (senderType === "Contact" || (!senderType && !isSystemMessage(emailObj))) {
          currentTicket.messages.push(messageText)
          console.log(`[ADDED] Message added to ticket ${ticketId}`)
        } else {
          console.log(`[SKIPPED] Not adding message - sender type is "${senderType}"`)
        }
      }
    } else if (currentTicket && messageText && messageText.trim()) {
      // This row belongs to the current ticket (part of thread)
      console.log(`[THREAD MSG] Checking message for ticket ${currentTicket.ticketId}. SenderType: "${senderType}", SenderName: "${senderName}", Message: "${messageText.substring(0, 50)}..."`)
      // Add message unless we're sure it's NOT a customer message
      // If senderType is empty, check if it's a system message pattern
      if (senderType === "Contact" || (!senderType && !isSystemMessage(emailObj))) {
        currentTicket.messages.push(messageText)
        console.log(`[ADDED] Thread message added to ticket ${currentTicket.ticketId}`)
      } else {
        console.log(`[SKIPPED] Not adding thread message - sender type is "${senderType}" or is system message`)
      }
    }
  }
  
  // Don't forget the last ticket
  if (currentTicket) {
    grouped.push(currentTicket)
  }
  
  // Filter out tickets with no actual customer messages
  const validTickets = grouped.filter(ticket => {
    return ticket.messages && ticket.messages.length > 0
  })
  
  console.log(`Filtered out ${grouped.length - validTickets.length} tickets with no customer messages`)
  
  return validTickets
}

// Filter out system messages, AI responses, and automation
function isSystemMessage(email: any): boolean {
  const messageText = (email.messageText || "").toLowerCase()
  const senderType = email.senderType || ""
  const senderName = email.senderName || ""
  
  // If sender type is explicitly set to something other than Contact, filter it
  if (senderType && senderType !== "" && senderType !== "Contact") {
    console.log(`Filtering non-Contact sender type: ${senderType}`)
    return true
  }
  
  // If sender type is empty but sender name indicates system, filter it
  if (!senderType || senderType === "") {
    // Check if it's a known system sender name
    if (senderName === "AIAgent" || senderName === "H&O Team" || senderName === "Automation System") {
      console.log(`Filtering system sender: ${senderName}`)
      return true
    }
    
    // Check for system message patterns in the text
    const systemPatterns = [
      "auto-labels added",
      "ai agent was removed",
      "ai agent processing summary",
      "conversation was marked",
      "conversation was snoozed",
      "automation system added"
    ]
    
    if (systemPatterns.some(pattern => messageText.includes(pattern))) {
      console.log(`Filtering system pattern message: "${messageText.substring(0, 50)}..."`)
      return true
    }
  }
  
  // Default: don't filter (assume it might be a customer message)
  return false
}

// Extract order numbers from message text
function extractOrderNumber(text: string): string | null {
  const patterns = [
    /#(\d{4,})/,           // #12345
    /order\s*#?\s*(\d{4,})/i,  // Order #12345 or Order 12345
    /\b(\d{5,6})\b/         // Just numbers (5-6 digits)
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

    const { emails } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "Invalid email data" },
        { status: 400 }
      )
    }

    console.log(`Processing ${emails.length} CSV rows...`)
    
    // Clear existing data for this user before uploading new CSV
    console.log(`Clearing existing email data for user ${session.user.id}...`)
    await prisma.emailCorrespondence.deleteMany({
      where: { userId: session.user.id }
    })
    await prisma.emailGroup.deleteMany({
      where: { userId: session.user.id }
    })
    console.log(`Existing data cleared.`)
    
    // Group by Ticket ID and filter spam
    const groupedEmails = groupByTicketId(emails)
    
    console.log(`After grouping and filtering: ${groupedEmails.length} valid conversations`)

    // Process in batches to avoid memory issues with large datasets
    const BATCH_SIZE = 50
    const savedEmails = []
    
    for (let i = 0; i < groupedEmails.length; i += BATCH_SIZE) {
      const batch = groupedEmails.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(groupedEmails.length / BATCH_SIZE)}...`)
      
      const batchResults = await Promise.all(
        batch.map(async (ticket: any) => {
          try {
            // Combine all messages in the thread
            const fullMessageThread = ticket.messages
              .filter((msg: string) => msg && msg.trim())
              .join("\n\n---\n\n")
            
            const orderNumber = extractOrderNumber(fullMessageThread + " " + ticket.subject)
            
            return await prisma.emailCorrespondence.create({
              data: {
                ticketId: ticket.ticketId,
                conversationId: ticket.conversationId,
                conversationUrl: ticket.conversationUrl || null,
                subject: ticket.subject || "No Subject",
                fromEmail: ticket.customerEmail || "",
                fromName: ticket.customerName || null,
                messageText: fullMessageThread || ticket.subject || "No message",
                labels: ticket.labels ? ticket.labels.split(",").map((l: string) => l.trim()) : [],
                inbox: ticket.inbox || null,
                creationDate: ticket.creationDate ? new Date(ticket.creationDate) : new Date(),
                closedDate: ticket.closedDate ? new Date(ticket.closedDate) : null,
                assignee: ticket.assignee || null,
                orderNumber: orderNumber,
                needsAction: true,
                userId: session.user.id
              }
            })
          } catch (error) {
            console.error(`Error saving ticket ${ticket.ticketId}:`, error)
            return null
          }
        })
      )
      
      savedEmails.push(...batchResults.filter(e => e !== null))
    }

    console.log(`Successfully saved ${savedEmails.length} conversations`)

    return NextResponse.json({
      success: true,
      count: savedEmails.length,
      filtered: emails.length - groupedEmails.length,
      emailIds: savedEmails.map(e => e.id),
      emails: savedEmails
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload emails", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
