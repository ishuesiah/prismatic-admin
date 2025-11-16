import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

interface ResponseRule {
  id: string
  trigger: string
  condition: string
  response: string
  priority: number
  isActive: boolean
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

    const { emails, customInstructions, responseRules } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "Invalid email data" },
        { status: 400 }
      )
    }

    // Check if Claude API key is configured
    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: "Claude API key not configured" },
        { status: 500 }
      )
    }

    // Initialize Claude AI client
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    })

    // Build system prompt with custom instructions and rules
    const systemPrompt = buildSystemPrompt(customInstructions, responseRules)

    // Process emails in batches to avoid token limits
    const batchSize = 5
    const batches = []
    
    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize))
    }

    let allResponses = []

    for (const batch of batches) {
      const userPrompt = buildUserPrompt(batch, responseRules)
      
      try {
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        })

        const responseText = message.content[0].type === "text" 
          ? message.content[0].text 
          : "[]"

        // Parse the AI response
        let parsedResponses = []
        try {
          parsedResponses = JSON.parse(responseText)
        } catch (parseError) {
          console.error("Failed to parse AI response:", parseError)
          // Try to extract JSON from response
          const jsonMatch = responseText.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            parsedResponses = JSON.parse(jsonMatch[0])
          }
        }

        // Save responses to database
        for (let i = 0; i < batch.length && i < parsedResponses.length; i++) {
          const email = batch[i]
          const response = parsedResponses[i]
          
          if (email.id) {
            await prisma.emailCorrespondence.update({
              where: { id: email.id },
              data: {
                autoResponse: response.response,
                needsAction: response.needsAction !== false
              }
            })
            
            allResponses.push({
              emailId: email.id,
              response: response.response
            })
          }
        }
      } catch (aiError) {
        console.error("AI generation error for batch:", aiError)
      }
    }

    return NextResponse.json({
      success: true,
      count: allResponses.length,
      responses: allResponses
    })
  } catch (error) {
    console.error("Generate error:", error)
    return NextResponse.json(
      { error: "Failed to generate responses" },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(customInstructions?: string, rules?: ResponseRule[]): string {
  let prompt = `You are an expert customer service representative helping to respond to customer emails.

${customInstructions ? `CUSTOM INSTRUCTIONS:\n${customInstructions}\n` : ''}

IMPORTANT GUIDELINES:
1. Extract customer names from emails when available and use them
2. Identify order numbers (formats: #12345, Order 12345, or just 12345)
3. Be empathetic and professional
4. Keep responses concise but helpful
5. Acknowledge specific concerns mentioned in the email
6. For product stock issues (elastics, charms), use appropriate explanations
7. Always maintain a helpful and solution-oriented tone

`

  if (rules && rules.length > 0) {
    const activeRules = rules.filter(r => r.isActive).sort((a, b) => a.priority - b.priority)
    if (activeRules.length > 0) {
      prompt += `\nSPECIAL RESPONSE RULES (apply these when conditions match):\n`
      activeRules.forEach(rule => {
        prompt += `- If ${rule.trigger} matches "${rule.condition}": ${rule.response}\n`
      })
    }
  }

  prompt += `
OUTPUT FORMAT:
Return a JSON array where each element corresponds to an email with this structure:
[
  {
    "response": "The personalized response text",
    "needsAction": true/false (false for thank you messages or confirmations)
  }
]`

  return prompt
}

function buildUserPrompt(emails: any[], rules?: ResponseRule[]): string {
  let prompt = `Generate personalized customer service responses for these emails:\n\n`
  
  emails.forEach((email, index) => {
    prompt += `EMAIL ${index + 1}:\n`
    prompt += `From: ${email.fromEmail || 'Unknown'}`
    if (email.fromName) prompt += ` (${email.fromName})`
    prompt += `\n`
    if (email.subject) prompt += `Subject: ${email.subject}\n`
    if (email.orderNumber) prompt += `Order Number: ${email.orderNumber}\n`
    prompt += `Message: ${email.messageText || 'No message'}\n`
    
    // Check for rule matches
    if (rules && rules.length > 0) {
      const matchedRules = findMatchingRules(email, rules)
      if (matchedRules.length > 0) {
        prompt += `Matching Rules: ${matchedRules.map(r => r.trigger).join(', ')}\n`
      }
    }
    
    prompt += `\n---\n\n`
  })
  
  prompt += `\nGenerate appropriate responses for each email. For "thank you" messages or confirmations, set needsAction to false.`
  
  return prompt
}

function findMatchingRules(email: any, rules: ResponseRule[]): ResponseRule[] {
  const matches: ResponseRule[] = []
  const messageText = (email.messageText || '').toLowerCase()
  const activeRules = rules.filter(r => r.isActive).sort((a, b) => a.priority - b.priority)
  
  for (const rule of activeRules) {
    let isMatch = false
    
    if (rule.trigger === 'keyword') {
      // Try regex match
      try {
        const regex = new RegExp(rule.condition, 'i')
        isMatch = regex.test(messageText)
      } catch {
        // Fallback to simple includes
        const keywords = rule.condition.split(',').map(k => k.trim())
        isMatch = keywords.some(keyword => messageText.includes(keyword.toLowerCase()))
      }
    } else if (rule.trigger === 'product') {
      const products = rule.condition.split(',').map(p => p.trim().toLowerCase())
      isMatch = products.some(product => messageText.includes(product))
    } else if (rule.trigger === 'order_status' && email.orderNumber) {
      isMatch = true // Apply order status rules when order number exists
    }
    
    if (isMatch) {
      matches.push(rule)
    }
  }
  
  return matches
}
