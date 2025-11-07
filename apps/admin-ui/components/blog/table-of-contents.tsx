"use client"

import { useEffect, useState } from "react"
import { cn } from "@prismatic/ui"

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: any
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    // Extract headings from TipTap content
    const extractedHeadings: Heading[] = []
    
    if (content && content.content) {
      content.content.forEach((node: any, index: number) => {
        if (node.type === "heading" && node.content) {
          const text = node.content
            .map((c: any) => c.text || "")
            .join("")
          
          if (text) {
            const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
            extractedHeadings.push({
              id,
              text,
              level: node.attrs.level,
            })
          }
        }
      })
    }
    
    setHeadings(extractedHeadings)
  }, [content])

  const scrollToHeading = (id: string) => {
    setActiveId(id)
    
    // Try to find the heading element
    const element = document.getElementById(id)
    if (element) {
      // Check if element is inside a scrollable container
      const scrollableParent = element.closest('.prose')
      
      if (scrollableParent) {
        // Scroll within the editor container
        const elementTop = element.offsetTop
        const containerTop = scrollableParent.scrollTop
        const offset = 100 // Add some offset from top
        
        scrollableParent.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        })
      } else {
        // Fallback to regular scroll
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      
      // Also try to scroll the main page
      window.setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }

  if (headings.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Add headings to your content to see table of contents
      </div>
    )
  }

  return (
    <nav className="space-y-1">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Table of Contents
      </h3>
      {headings.map((heading) => (
        <button
          key={heading.id}
          onClick={() => scrollToHeading(heading.id)}
          className={cn(
            "block w-full text-left text-sm transition-colors",
            "hover:text-blue-600",
            activeId === heading.id
              ? "text-blue-600 font-medium"
              : "text-gray-600",
            heading.level === 1 && "font-medium",
            heading.level === 2 && "pl-3",
            heading.level === 3 && "pl-6"
          )}
        >
          {heading.text}
        </button>
      ))}
    </nav>
  )
}
