"use client"

import { useState } from "react"
import { Button } from "@prismatic/ui"
import { Card } from "@prismatic/ui"
import { Sparkles, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface SEOAnalyzerProps {
  title: string
  content: any
  excerpt: string
  seo: {
    metaTitle: string
    metaDescription: string
  }
}

interface SEOScore {
  score: number
  feedback: string[]
  suggestions: string[]
  strengths: string[]
}

export default function SEOAnalyzer({ title, content, excerpt, seo }: SEOAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SEOScore | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function analyzeSEO() {
    setAnalyzing(true)
    setError(null)
    try {
      const response = await fetch("/api/blog/analyze-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          seo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error from API
        const errorMsg = data.error || "Failed to analyze SEO"
        const errorDetails = data.details || ""
        const fullError = data.fullError || ""
        
        setError(`${errorMsg}\n\n${errorDetails}\n\nTechnical details: ${fullError}`)
        console.error("SEO Analysis Error:", data)
        return
      }

      setAnalysis(data)
    } catch (error) {
      console.error("Error analyzing SEO:", error)
      setError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-8 w-8 text-green-600" />
    if (score >= 60) return <AlertCircle className="h-8 w-8 text-yellow-600" />
    return <XCircle className="h-8 w-8 text-red-600" />
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI SEO Analysis</h3>
        <Button
          onClick={analyzeSEO}
          disabled={analyzing || !title}
          size="sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {analyzing ? "Analyzing..." : "Analyze SEO"}
        </Button>
      </div>

      {!analysis && !analyzing && !error && (
        <p className="text-sm text-gray-500">
          Click "Analyze SEO" to get AI-powered insights on your content's SEO quality.
        </p>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-1">Error</h4>
              <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">
                {error}
              </pre>
            </div>
          </div>
          <Button
            onClick={analyzeSEO}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      )}

      {analyzing && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Analyzing with Claude AI...</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Score */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            {getScoreIcon(analysis.score)}
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                {analysis.score}/100
              </div>
              <div className="text-sm text-gray-600">SEO Score</div>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback */}
          {analysis.feedback.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Areas to Improve
              </h4>
              <ul className="space-y-2">
                {analysis.feedback.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Suggestions
              </h4>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
