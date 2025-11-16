"use client"

import { useEffect, useState } from "react"
import { CollapsibleCard } from "@prismatic/ui"
import { cn } from "@prismatic/ui"

interface ReadabilityStatsProps {
  content: any
}

interface Stats {
  wordCount: number
  sentenceCount: number
  readabilityGrade: number
  readabilityLevel: string
  complexSentences: number
  veryComplexSentences: number
  adverbCount: number
  passiveVoiceCount: number
}

export default function ReadabilityStats({ content }: ReadabilityStatsProps) {
  const [stats, setStats] = useState<Stats>({
    wordCount: 0,
    sentenceCount: 0,
    readabilityGrade: 0,
    readabilityLevel: "N/A",
    complexSentences: 0,
    veryComplexSentences: 0,
    adverbCount: 0,
    passiveVoiceCount: 0,
  })

  useEffect(() => {
    calculateStats()
  }, [content])

  function calculateStats() {
    // Extract text from TipTap content
    let text = ""
    if (content && content.content) {
      const extractText = (node: any): string => {
        if (node.text) return node.text
        if (node.content) {
          return node.content.map(extractText).join(" ")
        }
        return ""
      }
      text = content.content.map(extractText).join(" ")
    }

    if (!text.trim()) {
      setStats({
        wordCount: 0,
        sentenceCount: 0,
        readabilityGrade: 0,
        readabilityLevel: "N/A",
        complexSentences: 0,
        veryComplexSentences: 0,
        adverbCount: 0,
        passiveVoiceCount: 0,
      })
      return
    }

    // Calculate word count
    const words = text.match(/\b\w+\b/g) || []
    const wordCount = words.length

    // Calculate sentence count
    const sentences = text.match(/[.!?]+/g) || []
    const sentenceCount = sentences.length || 1

    // Calculate average words per sentence
    const avgWordsPerSentence = wordCount / sentenceCount

    // Simple readability grade (Flesch-Kincaid-like)
    const syllableCount = countSyllables(text)
    const avgSyllablesPerWord = syllableCount / wordCount
    
    // Simplified readability formula
    const readabilityScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    const readabilityGrade = Math.max(1, Math.min(18, Math.round(0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59)))

    // Determine readability level
    let readabilityLevel = "Good"
    if (readabilityGrade >= 12) readabilityLevel = "Very Hard"
    else if (readabilityGrade >= 10) readabilityLevel = "Hard"
    else if (readabilityGrade >= 8) readabilityLevel = "Fairly Hard"
    else if (readabilityGrade >= 6) readabilityLevel = "Good"
    else readabilityLevel = "Very Good"

    // Count complex sentences (>20 words)
    const sentencesArray = text.split(/[.!?]+/).filter(s => s.trim())
    let complexSentences = 0
    let veryComplexSentences = 0
    
    sentencesArray.forEach(sentence => {
      const sentenceWords = sentence.match(/\b\w+\b/g) || []
      if (sentenceWords.length > 30) veryComplexSentences++
      else if (sentenceWords.length > 20) complexSentences++
    })

    // Count adverbs (words ending in -ly)
    const adverbs = words.filter(word => word.toLowerCase().endsWith('ly'))
    const adverbCount = adverbs.length

    // Count passive voice (simplified - look for "was/were/is/are" + past participle)
    const passiveVoicePatterns = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi
    const passiveMatches = text.match(passiveVoicePatterns) || []
    const passiveVoiceCount = passiveMatches.length

    setStats({
      wordCount,
      sentenceCount,
      readabilityGrade,
      readabilityLevel,
      complexSentences,
      veryComplexSentences,
      adverbCount,
      passiveVoiceCount,
    })
  }

  function countSyllables(text: string): number {
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    return words.reduce((total, word) => {
      // Simple syllable counting
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
      word = word.replace(/^y/, '')
      const matches = word.match(/[aeiouy]{1,2}/g)
      return total + (matches ? matches.length : 1)
    }, 0)
  }

  function getGradeColor(grade: number): string {
    if (grade >= 12) return "text-red-600"
    if (grade >= 10) return "text-orange-600"
    if (grade >= 8) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <CollapsibleCard title="Readability" defaultExpanded={true}>
      {/* Readability Grade */}
      <div className="mb-6">
        <div className={cn("text-4xl font-bold", getGradeColor(stats.readabilityGrade))}>
          Grade {stats.readabilityGrade}
        </div>
        <div className="text-sm text-gray-600 mt-1">{stats.readabilityLevel}</div>
      </div>

      {/* Word Count */}
      <div className="mb-4">
        <div className="text-sm text-gray-600">Words</div>
        <div className="text-2xl font-semibold">{stats.wordCount}</div>
      </div>

      {/* Sentences */}
      <div className="mb-4">
        <div className="text-sm text-gray-600">Sentences</div>
        <div className="text-xl font-semibold">{stats.sentenceCount}</div>
      </div>

      {/* Issues */}
      <div className="mt-6 space-y-2 text-sm">
        {stats.veryComplexSentences > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>
              <strong>{stats.veryComplexSentences}</strong> very hard to read {stats.veryComplexSentences === 1 ? 'sentence' : 'sentences'}
            </span>
          </div>
        )}
        
        {stats.complexSentences > 0 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>
              <strong>{stats.complexSentences}</strong> hard to read {stats.complexSentences === 1 ? 'sentence' : 'sentences'}
            </span>
          </div>
        )}

        {stats.adverbCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>
              <strong>{stats.adverbCount}</strong> {stats.adverbCount === 1 ? 'adverb' : 'adverbs'}
            </span>
          </div>
        )}

        {stats.passiveVoiceCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>
              <strong>{stats.passiveVoiceCount}</strong> passive voice {stats.passiveVoiceCount === 1 ? 'use' : 'uses'}
            </span>
          </div>
        )}
      </div>

      {stats.wordCount === 0 && (
        <div className="text-sm text-gray-500 italic mt-4">
          Start writing to see readability statistics
        </div>
      )}
    </CollapsibleCard>
  )
}
