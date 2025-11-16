"use client"

import { useState, useEffect } from "react"
import { X, Send, Package, Tag, MessageSquare, User, Calendar, Mail } from "lucide-react"
import toast from "react-hot-toast"

interface EmailModalProps {
  email: any
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    name: string | null
    email: string
    picture: string | null
  }
}

export function EmailModal({ email, isOpen, onClose, onUpdate }: EmailModalProps) {
  const [activeTab, setActiveTab] = useState<"email" | "order" | "comments">("email")
  const [orderData, setOrderData] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [sendingTag, setSendingTag] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && email) {
      fetchComments()
      if (email.orderNumber) {
        fetchOrderData()
      }
    }
  }, [isOpen, email])

  const fetchOrderData = async () => {
    if (!email.orderNumber) return

    setLoadingOrder(true)
    try {
      const response = await fetch(`/api/email-responder/shopify?orderNumber=${email.orderNumber}&emailId=${email.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrderData(data)
      }
    } catch (error) {
      console.error("Failed to fetch order:", error)
    } finally {
      setLoadingOrder(false)
    }
  }

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/email-responder/comments?emailId=${email.id}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch("/api/email-responder/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id,
          content: newComment,
          isInternal: true
        })
      })

      if (response.ok) {
        setNewComment("")
        await fetchComments()
        toast.success("Comment added")
      } else {
        toast.error("Failed to add comment")
      }
    } catch (error) {
      toast.error("Failed to add comment")
    }
  }

  const addShipStationTag = async (tag: string) => {
    if (!email.orderNumber) {
      toast.error("No order number found")
      return
    }

    setSendingTag(tag)
    try {
      const response = await fetch("/api/shipstation/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: email.orderNumber,
          emailId: email.id,
          tag
        })
      })

      if (response.ok) {
        toast.success(`Tagged order as ${tag}`)
        onUpdate?.()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to tag order")
      }
    } catch (error) {
      toast.error("Failed to tag order")
    } finally {
      setSendingTag(null)
    }
  }

  if (!isOpen || !email) return null

  const aiInsights = email.aiInsights || {}

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{email.subject}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {email.fromEmail}
              </div>
              {email.fromName && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {email.fromName}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(email.creationDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AI Insights */}
        {aiInsights.urgency && (
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">AI Insights:</span>
              <span className={`px-2 py-1 rounded ${
                aiInsights.urgency >= 7 ? "bg-red-100 text-red-700" :
                aiInsights.urgency >= 4 ? "bg-yellow-100 text-yellow-700" :
                "bg-green-100 text-green-700"
              }`}>
                Urgency: {aiInsights.urgency}/10
              </span>
              <span className="text-gray-600">Sentiment: {aiInsights.sentiment}</span>
              <span className="text-gray-600">Tone: {aiInsights.suggestedTone}</span>
            </div>
            {aiInsights.keyIssues?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {aiInsights.keyIssues.map((issue: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {issue}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b">
          <button
            onClick={() => setActiveTab("email")}
            className={`px-4 py-2 font-medium ${
              activeTab === "email"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Email
          </button>
          {email.orderNumber && (
            <button
              onClick={() => setActiveTab("order")}
              className={`px-4 py-2 font-medium flex items-center gap-2 ${
                activeTab === "order"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Package className="w-4 h-4" />
              Order #{email.orderNumber}
            </button>
          )}
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === "comments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Comments ({comments.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "email" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Message</h3>
                <div className="bg-gray-50 rounded p-4 whitespace-pre-wrap">
                  {email.messageText}
                </div>
              </div>

              {email.autoResponse && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">AI Response</h3>
                  <div className="bg-blue-50 rounded p-4 whitespace-pre-wrap">
                    {email.autoResponse}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "order" && (
            <div className="space-y-4">
              {loadingOrder ? (
                <div className="text-center py-8 text-gray-500">Loading order data...</div>
              ) : orderData ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="font-medium text-gray-700">Customer</h3>
                      <p className="text-gray-900">{orderData.customer?.name}</p>
                      <p className="text-sm text-gray-600">{orderData.customer?.email}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Status</h3>
                      <p className="capitalize text-gray-900">{orderData.fulfillment?.status}</p>
                      {orderData.fulfillment?.tracking && (
                        <p className="text-sm text-gray-600">Tracking: {orderData.fulfillment.tracking}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-medium text-gray-700 mb-2">Items</h3>
                    <div className="space-y-2">
                      {orderData.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.variantTitle && <p className="text-sm text-gray-600">{item.variantTitle}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.price} x {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addShipStationTag("HOLD")}
                      disabled={!!sendingTag}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Tag className="w-4 h-4" />
                      {sendingTag === "HOLD" ? "Tagging..." : "Tag as HOLD"}
                    </button>
                    <button
                      onClick={() => addShipStationTag("PRIORITY")}
                      disabled={!!sendingTag}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Tag className="w-4 h-4" />
                      {sendingTag === "PRIORITY" ? "Tagging..." : "Tag as PRIORITY"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No order data available</div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-4">
              {loadingComments ? (
                <div className="text-center py-8 text-gray-500">Loading comments...</div>
              ) : (
                <>
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No comments yet</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded p-4">
                          <div className="flex items-start gap-3">
                            {comment.user.picture ? (
                              <img src={comment.user.picture} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                                {comment.user.name?.[0] || comment.user.email[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comment.user.name || comment.user.email}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment for your team..."
                      className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Add Comment
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
