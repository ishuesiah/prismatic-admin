"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardContent, CardHeader } from "@prismatic/ui"
import { Upload, Loader2, Sparkles, Mail } from "lucide-react"
import { CsvUploader } from "@/components/email-responder/csv-uploader"
import { AiInstructionsPanel } from "@/components/email-responder/ai-instructions-panel"
import { EmailGroupCard } from "@/components/email-responder/email-group-card"
import { ResponseRulesPanel } from "@/components/email-responder/response-rules-panel"
import { toast } from "react-hot-toast"

interface EmailGroup {
  id: string
  name: string
  type: string
  emails: any[]
  isExpanded: boolean
  priority: number
}

const defaultResponseRules = [
  {
    id: "1",
    trigger: "product",
    condition: "elastics,charms,elastic bands",
    response: "I sincerely apologize for the delay with your order. We experienced an unexpected shortage of {{product_type}} and had to wait for our supplier to restock. The good news is that your order is now being prepared and will ship within 1-2 business days. We truly appreciate your patience and understanding.",
    priority: 1,
    isActive: true
  },
  {
    id: "2",
    trigger: "keyword",
    condition: "where.*order|order.*status|track.*order",
    response: "Let me check on your order status right away. {{order_status_details}} {{tracking_info}}",
    priority: 2,
    isActive: true
  }
]

export default function EmailResponderPage() {
  const [emails, setEmails] = useState<any[]>([])
  const [emailGroups, setEmailGroups] = useState<EmailGroup[]>([])
  const [customInstructions, setCustomInstructions] = useState("")
  const [responseRules, setResponseRules] = useState(defaultResponseRules)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Load existing email groups on mount
  useEffect(() => {
    loadEmailGroups()
  }, [])

  const loadEmailGroups = async () => {
    try {
      const response = await fetch("/api/email-responder/groups")
      if (response.ok) {
        const groups = await response.json()
        setEmailGroups(groups)
      }
    } catch (error) {
      console.error("Failed to load email groups:", error)
    }
  }

  const handleCsvUpload = async (parsedData: any[]) => {
    console.log("handleCsvUpload called with data:", parsedData)
    setIsLoading(true)
    try {
      // Upload emails to backend
      console.log("Sending data to /api/email-responder/upload")
      const response = await fetch("/api/email-responder/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parsedData })
      })

      console.log("Upload response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Upload failed. Response:", errorText)
        throw new Error(`Failed to upload emails: ${response.status}`)
      }

      const result = await response.json()
      console.log("Upload result:", result)
      
      // Group emails
      console.log("Grouping emails with IDs:", result.emailIds)
      const groupResponse = await fetch("/api/email-responder/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIds: result.emailIds })
      })

      console.log("Group response status:", groupResponse.status)
      
      if (!groupResponse.ok) {
        const errorText = await groupResponse.text()
        console.error("Grouping failed. Response:", errorText)
        throw new Error(`Failed to group emails: ${groupResponse.status}`)
      }

      const groups = await groupResponse.json()
      console.log("Grouped emails:", groups)
      
      // Set the groups with isExpanded property
      const expandedGroups = groups.map((group: EmailGroup) => ({
        ...group,
        isExpanded: group.type === "PRIORITY" || group.type === "ORDER_STATUS" || group.type === "WHOLESALE"
      }))
      
      setEmailGroups(expandedGroups)
      setEmails(result.emails)
      
      // Also reload from database to ensure consistency
      setTimeout(loadEmailGroups, 500)
      
      toast.success(`Successfully uploaded ${parsedData.length} emails`)
    } catch (error) {
      console.error("Upload error details:", error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to upload CSV")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateResponses = async (groupId?: string) => {
    setIsGenerating(true)
    try {
      const targetEmails = groupId 
        ? emailGroups.find(g => g.id === groupId)?.emails || []
        : emails

      const response = await fetch("/api/email-responder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: targetEmails,
          customInstructions,
          responseRules
        })
      })

      if (!response.ok) {
        throw new Error("Failed to generate responses")
      }

      const result = await response.json()
      
      // Reload groups to show updated responses
      await loadEmailGroups()
      
      toast.success(`Generated responses for ${result.count} emails`)
    } catch (error) {
      console.error("Generation error:", error)
      toast.error("Failed to generate responses")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleGroup = (groupId: string) => {
    setEmailGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="w-8 h-8" />
          Bulk Email Responder
        </h1>
      </div>

      {/* CSV Upload Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Commslayer CSV
          </h2>
        </CardHeader>
        <CardContent>
          <CsvUploader onUpload={handleCsvUpload} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* AI Instructions Panel */}
      <AiInstructionsPanel
        value={customInstructions}
        onChange={setCustomInstructions}
      />

      {/* Response Rules Configuration */}
      <ResponseRulesPanel
        rules={responseRules}
        onChange={setResponseRules}
      />

      {/* Generate All Responses Button */}
      {emails.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => handleGenerateResponses()}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate All Responses
              </>
            )}
          </Button>
        </div>
      )}

      {/* Email Groups */}
      {emailGroups.length > 0 && (
        <div className="space-y-4">
          {/* Priority Messages */}
          {emailGroups
            .filter(g => g.type === "PRIORITY")
            .map(group => (
              <EmailGroupCard
                key={group.id}
                group={group}
                isExpanded={group.isExpanded}
                onToggle={() => handleToggleGroup(group.id)}
                onGenerateResponses={() => handleGenerateResponses(group.id)}
                customInstructions={customInstructions}
                responseRules={responseRules}
              />
            ))}

          {/* Order Status Messages */}
          {emailGroups
            .filter(g => g.type === "ORDER_STATUS")
            .map(group => (
              <EmailGroupCard
                key={group.id}
                group={group}
                isExpanded={group.isExpanded}
                onToggle={() => handleToggleGroup(group.id)}
                onGenerateResponses={() => handleGenerateResponses(group.id)}
                customInstructions={customInstructions}
                responseRules={responseRules}
              />
            ))}

          {/* Wholesale Inquiries */}
          {emailGroups
            .filter(g => g.type === "WHOLESALE")
            .map(group => (
              <EmailGroupCard
                key={group.id}
                group={group}
                isExpanded={group.isExpanded}
                onToggle={() => handleToggleGroup(group.id)}
                onGenerateResponses={() => handleGenerateResponses(group.id)}
                customInstructions={customInstructions}
                responseRules={responseRules}
              />
            ))}

          {/* No Action Needed */}
          {emailGroups
            .filter(g => g.type === "NO_ACTION")
            .map(group => (
              <EmailGroupCard
                key={group.id}
                group={group}
                isExpanded={false}
                onToggle={() => handleToggleGroup(group.id)}
                onGenerateResponses={() => handleGenerateResponses(group.id)}
                customInstructions={customInstructions}
                responseRules={responseRules}
              />
            ))}

          {/* Other */}
          {emailGroups
            .filter(g => g.type === "OTHER")
            .map(group => (
              <EmailGroupCard
                key={group.id}
                group={group}
                isExpanded={group.isExpanded}
                onToggle={() => handleToggleGroup(group.id)}
                onGenerateResponses={() => handleGenerateResponses(group.id)}
                customInstructions={customInstructions}
                responseRules={responseRules}
              />
            ))}
        </div>
      )}

      {/* Empty State */}
      {emails.length === 0 && emailGroups.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No emails uploaded yet</p>
            <p>Upload a CSV file from Commslayer to get started</p>
          </div>
        </Card>
      )}
    </div>
  )
}
