"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, Button, Badge } from "@prismatic/ui"
import { ChevronDown, ChevronRight, Mail, AlertCircle, Package, Users, Check, Sparkles } from "lucide-react"
import { EmailItem } from "./email-item"

interface Email {
  id: string
  fromEmail: string
  fromName?: string
  subject?: string
  messageText: string
  autoResponse?: string
  orderNumber?: string
  needsAction: boolean
  isEdited: boolean
  shopifyData?: any
  shipstationData?: any
}

interface EmailGroupProps {
  group: {
    id: string
    name: string
    type: string
    emails: Email[]
  }
  isExpanded: boolean
  onToggle: () => void
  onGenerateResponses: () => void
  customInstructions: string
  responseRules: any[]
  selectedEmails?: Set<string>
  onToggleEmailSelection?: (emailId: string) => void
  onSelectAllInGroup?: (groupEmails: any[]) => void
  onUpdate?: () => void
}

const getGroupIcon = (type: string) => {
  switch (type) {
    case "PRIORITY":
      return <AlertCircle className="w-5 h-5 text-red-500" />
    case "ORDER_STATUS":
      return <Package className="w-5 h-5 text-blue-500" />
    case "WHOLESALE":
      return <Users className="w-5 h-5 text-purple-500" />
    case "NO_ACTION":
      return <Check className="w-5 h-5 text-green-500" />
    default:
      return <Mail className="w-5 h-5 text-gray-500" />
  }
}

const getGroupColor = (type: string) => {
  switch (type) {
    case "PRIORITY":
      return "border-red-200 bg-red-50"
    case "ORDER_STATUS":
      return "border-blue-200 bg-blue-50"
    case "WHOLESALE":
      return "border-purple-200 bg-purple-50"
    case "NO_ACTION":
      return "border-green-200 bg-green-50"
    default:
      return "border-gray-200 bg-gray-50"
  }
}

export function EmailGroupCard({
  group,
  isExpanded,
  onToggle,
  onGenerateResponses,
  customInstructions,
  responseRules,
  selectedEmails,
  onToggleEmailSelection,
  onSelectAllInGroup,
  onUpdate
}: EmailGroupProps) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<Record<string, "saving" | "saved" | null>>({})
  const [showAll, setShowAll] = useState(false)
  
  const needsActionCount = group.emails.filter(e => e.needsAction).length
  
  // Sort emails by creation date (most recent first) and limit to 5 unless "Show All" is clicked
  const sortedEmails = [...group.emails].sort((a: any, b: any) => {
    const dateA = new Date(a.creationDate || 0).getTime()
    const dateB = new Date(b.creationDate || 0).getTime()
    return dateB - dateA // Most recent first
  })
  
  const displayedEmails = showAll ? sortedEmails : sortedEmails.slice(0, 5)
  const hasMoreEmails = sortedEmails.length > 5

  const handleResponseChange = async (emailId: string, newResponse: string) => {
    setAutoSaveStatus(prev => ({ ...prev, [emailId]: "saving" }))
    
    try {
      const response = await fetch("/api/email-responder/save-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId,
          response: newResponse
        })
      })

      if (response.ok) {
        setAutoSaveStatus(prev => ({ ...prev, [emailId]: "saved" }))
        setTimeout(() => {
          setAutoSaveStatus(prev => ({ ...prev, [emailId]: null }))
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to save response:", error)
    }
  }

  const handleFetchOrderDetails = async (orderNumber: string) => {
    try {
      const [shopifyResponse, shipstationResponse] = await Promise.all([
        fetch(`/api/email-responder/shopify?orderNumber=${orderNumber}`),
        fetch(`/api/email-responder/shipstation?orderNumber=${orderNumber}`)
      ])

      const shopifyData = await shopifyResponse.json()
      const shipstationData = await shipstationResponse.json()

      return { shopifyData, shipstationData }
    } catch (error) {
      console.error("Failed to fetch order details:", error)
      return null
    }
  }

  return (
    <Card className={`${getGroupColor(group.type)} transition-all duration-200`}>
      <CardHeader 
        className="cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
            {getGroupIcon(group.type)}
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <Badge variant="secondary" className="ml-2">
              {group.emails.length} {group.emails.length === 1 ? "email" : "emails"}
            </Badge>
            {needsActionCount > 0 && (
              <Badge variant="destructive">
                {needsActionCount} need response
              </Badge>
            )}
          </div>
          
          {group.type !== "NO_ACTION" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onGenerateResponses()
              }}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Responses
            </Button>
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {group.emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No emails in this group
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedEmails.map(email => (
                  <EmailItem
                    key={email.id}
                    email={email}
                    onResponseChange={(newResponse: string) => handleResponseChange(email.id, newResponse)}
                    onFetchOrderDetails={handleFetchOrderDetails}
                    autoSaveStatus={autoSaveStatus[email.id]}
                  />
                ))}
              </div>
              
              {hasMoreEmails && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? (
                      <>Show Less ({displayedEmails.length - 5} hidden)</>
                    ) : (
                      <>Show All ({sortedEmails.length - 5} more)</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
