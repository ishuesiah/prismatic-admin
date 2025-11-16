"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, Button } from "@prismatic/ui"
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react"

interface AiInstructionsPanelProps {
  value: string
  onChange: (value: string) => void
}

const templateSuggestions = {
  friendly: `Use a warm, friendly, and conversational tone. 
Address customers by their first name when available.
Show empathy and understanding for their concerns.
Use phrases like "I'd be happy to help" and "Thank you for reaching out".
Keep responses concise but personable.`,
  
  professional: `Maintain a professional and courteous tone.
Use formal greetings and closings.
Be clear and direct in your responses.
Focus on solutions and next steps.
Acknowledge the customer's time and patience.`,
  
  apologetic: `Express sincere apologies for any inconvenience.
Take responsibility without blaming.
Acknowledge the customer's frustration.
Offer clear solutions and compensation when appropriate.
Use phrases like "I sincerely apologize" and "I understand your frustration".`,
  
  brand: `Our brand voice is friendly, helpful, and authentic.
We're a small business that cares deeply about our customers.
Mention our handmade products and attention to detail when relevant.
Emphasize our 30-day satisfaction guarantee.
Sign off with "The [Your Brand] Team".`
}

export function AiInstructionsPanel({ value, onChange }: AiInstructionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Response Instructions
          </h3>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Instructions for Claude AI
            </label>
            <textarea
              placeholder="Give Claude specific instructions for tone and voice...
Examples:
- Use a warm, empathetic tone
- Be concise but friendly
- Acknowledge frustration when appropriate
- Include specific product knowledge: 'Our elastics are handmade...'
- Always mention our 30-day guarantee"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Quick Templates:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange(templateSuggestions.friendly)}
                className="text-xs"
              >
                😊 Friendly
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange(templateSuggestions.professional)}
                className="text-xs"
              >
                💼 Professional
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange(templateSuggestions.apologetic)}
                className="text-xs"
              >
                🙏 Apologetic
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange(templateSuggestions.brand)}
                className="text-xs"
              >
                ✨ Brand Voice
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange("")}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>💡 Tip:</strong> These instructions will be applied to all generated responses. 
              You can also edit individual responses after generation.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
