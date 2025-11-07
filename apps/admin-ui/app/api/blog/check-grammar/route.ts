import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

interface GrammarError {
  type: "spelling" | "grammar" | "punctuation"
  text: string
  suggestion: string
  position: { start: number, end: number }
  explanation: string
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

    const { text } = await request.json()

    if (!text || text.length < 10) {
      return NextResponse.json(
        { errors: [] },
        { status: 200 }
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

    // Create prompt for Claude
    const prompt = `You are a spell checker and grammar checker. Find ALL spelling errors and grammar mistakes.

Text to analyze:
"${text}"

Check for:
1. ANY misspelled words (like "kindli" should be "kindly", "organizaten" should be "organization")
2. Grammar errors (wrong verb forms, subject-verb disagreement)
3. Missing apostrophes in contractions (doesn't, can't, won't)
4. Wrong word usage (their/there/they're, your/you're)

DO NOT flag style preferences like:
- Date formats (November 4th, 2026 is fine)
- Oxford commas
- Sentence structure preferences
- Informal but correct language

For each error found, return it in this exact JSON format:
[
  {
    "type": "spelling",
    "text": "kindli",
    "suggestion": "kindly",
    "explanation": "Misspelled word"
  }
]

IMPORTANT: Check EVERY word carefully for spelling. If a word is not in the dictionary and is not a proper noun or technical term, flag it as a spelling error.

If there are no errors, return: []`

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    // Parse Claude's response
    const responseText = message.content[0].type === "text" 
      ? message.content[0].text 
      : "[]"

    // Extract JSON from response
    let errors: GrammarError[] = []
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsedErrors = JSON.parse(jsonMatch[0])
        
        // Add position information for each error
        errors = parsedErrors.map((error: any) => {
          const position = findTextPosition(text, error.text)
          return {
            type: error.type || "grammar",
            text: error.text,
            suggestion: error.suggestion || error.text,
            position: position,
            explanation: error.explanation || "Error detected"
          }
        }).filter((error: any) => error.position.start !== -1)
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
    }

    return NextResponse.json({ errors })
  } catch (error) {
    console.error("Error checking grammar:", error)
    
    let errorMessage = "Failed to check grammar"
    let errorDetails = ""
    
    if (error instanceof Error) {
      // Log the full error for debugging
      console.error("Full error:", error.message)
      
      if (error.message.includes("401") || error.message.includes("authentication")) {
        errorMessage = "Invalid API key. Please check your CLAUDE_API_KEY in .env.local"
      } else if (error.message.includes("429")) {
        errorMessage = "Rate limit exceeded. Please try again later."
      } else if (error.message.includes("model")) {
        errorMessage = "Model error. The specified Claude model may not be available."
        errorDetails = "Try using 'claude-3-haiku-20240307' instead"
      } else {
        // Include the actual error message for debugging
        errorMessage = `Grammar check failed: ${error.message.substring(0, 100)}`
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails 
      },
      { status: 500 }
    )
  }
}

// Helper function to find text position
function findTextPosition(fullText: string, searchText: string): { start: number, end: number } {
  const index = fullText.indexOf(searchText)
  if (index === -1) {
    return { start: -1, end: -1 }
  }
  return {
    start: index,
    end: index + searchText.length
  }
}
