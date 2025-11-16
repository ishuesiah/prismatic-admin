"use client"

import { useState, useEffect } from "react"
import { Button } from "@prismatic/ui"
import { Copy, Package, User, Mail, Save, Check, Loader2, Maximize2, MessageSquare, AlertCircle, Tag } from "lucide-react"
import { toast } from "react-hot-toast"
import { EmailModal } from "./email-modal"

interface EmailItemProps {
  email: {
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
    aiInsights?: {
      urgency: number
      sentiment: string
      keyIssues: string[]
      suggestedTone: string
      similarityTags: string[]
    }
  }
  onResponseChange: (response: string) => void
  onFetchOrderDetails: (orderNumber: string) => Promise<any>
  autoSaveStatus?: "saving" | "saved" | null
  onUpdate?: () => void
}

export function EmailItem({
  email,
  onResponseChange,
  onFetchOrderDetails,
  autoSaveStatus,
  onUpdate
}: EmailItemProps) {
  const [response, setResponse] = useState(email.autoResponse || "")
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setResponse(email.autoResponse || "")
  }, [email.autoResponse])

  const handleResponseChange = (newValue: string) => {
    setResponse(newValue)
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // Set new timer for auto-save (500ms delay)
    const timer = setTimeout(() => {
      onResponseChange(newValue)
    }, 500)
    
    setDebounceTimer(timer)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response)
      toast.success("Response copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const fetchOrderInfo = async () => {
    if (!email.orderNumber) {
      toast.error("No order number found in this email")
      return
    }

    setIsLoadingOrder(true)
    try {
      const details = await onFetchOrderDetails(email.orderNumber)
      setOrderDetails(details)
    } catch (error) {
      toast.error("Failed to fetch order details")
    } finally {
      setIsLoadingOrder(false)
    }
  }

  const aiInsights = email.aiInsights
  const urgencyColor =
    aiInsights && aiInsights.urgency >= 7
      ? "border-red-300 bg-red-50"
      : aiInsights && aiInsights.urgency >= 4
      ? "border-yellow-300 bg-yellow-50"
      : "border-gray-200"

  return (
    <>
      <div className={`bg-white rounded-lg border overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-shadow ${urgencyColor}`}>
        {/* Email Header - Compact */}
        <div className="bg-gray-100 px-3 py-2 border-b">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Mail className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="font-medium text-xs truncate">
                {email.fromEmail}
              </span>
              {aiInsights && aiInsights.urgency >= 7 && (
                <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" title={`Urgency: ${aiInsights.urgency}/10`} />
              )}
            </div>
            <div className="flex items-center gap-2">
              {email.orderNumber && (
                <span className="text-xs font-medium text-blue-600 flex-shrink-0">
                  #{email.orderNumber}
                </span>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-gray-500 hover:text-gray-700"
                title="Open details"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {email.fromName && (
            <div className="text-xs text-gray-600 truncate">
              {email.fromName}
            </div>
          )}
          {aiInsights && aiInsights.keyIssues && aiInsights.keyIssues.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {aiInsights.keyIssues.slice(0, 2).map((issue, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">
                  {issue}
                </span>
              ))}
              {aiInsights.keyIssues.length > 2 && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                  +{aiInsights.keyIssues.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

      {/* Email Message - Scrollable */}
      <div className="p-3 bg-gray-50 flex-1 overflow-y-auto max-h-64">
        <div className="text-xs text-gray-700 whitespace-pre-wrap">
          {email.messageText}
        </div>
        
        {email.orderNumber && (
          <Button
            size="sm"
            variant="outline"
            onClick={fetchOrderInfo}
            disabled={isLoadingOrder}
            className="mt-2 text-xs h-6"
          >
            {isLoadingOrder ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Package className="w-3 h-3" />
            )}
            <span className="ml-1">View Order</span>
          </Button>
        )}
        
        {/* Order Details (if loaded) */}
        {orderDetails && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="font-medium text-blue-900 mb-1">Order Details:</div>
            {orderDetails.shopifyData?.items && (
              <div className="space-y-1">
                {orderDetails.shopifyData.items.slice(0, 2).map((item: any, idx: number) => (
                  <div key={idx} className="text-gray-700">
                    • {item.title} (×{item.quantity})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Section - Compact */}
      <div className="p-3 border-t bg-white">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">
              Response
            </label>
            {autoSaveStatus && (
              <div className="flex items-center gap-1">
                {autoSaveStatus === "saving" ? (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                ) : (
                  <Check className="w-3 h-3 text-green-600" />
                )}
              </div>
            )}
          </div>
          
          <textarea
            value={response}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="AI response..."
            rows={3}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          
          <div className="flex justify-between items-center">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="gap-1 text-xs h-6 px-2"
            >
              <Copy className="w-3 h-3" />
              Copy
            </Button>
            
            <div className="text-xs text-gray-500">
              {response.length} chars
            </div>
          </div>
        </div>
      </div>
    </div>

      <EmailModal
        email={email}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
      />
    </>
  )
}
