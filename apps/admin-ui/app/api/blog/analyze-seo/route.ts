import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { title, content, excerpt, seo } = await request.json()

    // Check if Claude API key is configured
    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: "Claude API key not configured. Please add CLAUDE_API_KEY to your .env.local file." },
        { status: 500 }
      )
    }

    // Initialize Claude AI client
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    })

    // Extract text content from TipTap JSON
    let textContent = ""
    if (content && content.content) {
      const extractText = (node: any): string => {
        if (node.text) return node.text
        if (node.content) {
          return node.content.map(extractText).join(" ")
        }
        return ""
      }
      textContent = content.content.map(extractText).join("\n")
    }

    // Count words
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length

    // Create prompt for Claude
    const prompt = `You are an SEO expert. Analyze the following blog post and provide a comprehensive SEO evaluation.

Blog Post Details:
Title: "${title}"
Meta Title: "${seo.metaTitle || title}"
Meta Description: "${seo.metaDescription || excerpt || ""}"
Excerpt: "${excerpt || ""}"
Word Count: ${wordCount}

Content:
${textContent.substring(0, 3000)}

Please analyze this blog post and provide:
1. An SEO score out of 100
2. A list of strengths (what's good about the SEO)
3. A list of areas that need improvement
4. Specific, actionable suggestions to improve SEO

Consider factors like:
- Title optimization (length, keywords, engagement)
- Meta description quality
- Content length and depth
- Heading structure
- Keyword usage and density
- Readability
- Content structure and organization

Format your response as a JSON object with this structure:
{
  "score": <number 0-100>,
  "strengths": ["strength 1", "strength 2", ...],
  "feedback": ["issue 1", "issue 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}`

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
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
      : ""

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response")
    }

    const analysis = JSON.parse(jsonMatch[0])

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Error analyzing SEO:", error)
    
    // More detailed error handling
    let errorMessage = "Failed to analyze SEO"
    let errorDetails = "Make sure your Claude API key is valid and you have credits available."
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for common Anthropic API errors
      if (error.message.includes("401")) {
        errorDetails = "Invalid API key. Please check your CLAUDE_API_KEY in .env.local"
      } else if (error.message.includes("429")) {
        errorDetails = "Rate limit exceeded. Please try again in a moment."
      } else if (error.message.includes("insufficient")) {
        errorDetails = "Insufficient credits in your Claude account. Please add credits at console.anthropic.com"
      } else if (error.message.includes("model")) {
        errorDetails = "Model error. The Claude model might not be available."
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        fullError: error instanceof Error ? error.toString() : String(error)
      },
      { status: 500 }
    )
  }
}
