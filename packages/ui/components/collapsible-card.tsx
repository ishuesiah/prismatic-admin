"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "../lib/utils"

interface CollapsibleCardProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
  headerContent?: React.ReactNode
}

export function CollapsibleCard({
  title,
  children,
  defaultExpanded = true,
  className,
  headerContent
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          {headerContent && <div className="mr-2">{headerContent}</div>}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  )
}
