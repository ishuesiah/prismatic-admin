"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, Button } from "@prismatic/ui"
import { Settings, ChevronDown, ChevronUp, Plus, X, AlertCircle } from "lucide-react"

interface ResponseRule {
  id: string
  trigger: string
  condition: string
  response: string
  priority: number
  isActive: boolean
}

interface ResponseRulesPanelProps {
  rules: ResponseRule[]
  onChange: (rules: ResponseRule[]) => void
}

export function ResponseRulesPanel({ rules, onChange }: ResponseRulesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingRule, setEditingRule] = useState<string | null>(null)

  const addNewRule = () => {
    const newRule: ResponseRule = {
      id: `rule_${Date.now()}`,
      trigger: "keyword",
      condition: "",
      response: "",
      priority: rules.length + 1,
      isActive: true
    }
    onChange([...rules, newRule])
    setEditingRule(newRule.id)
  }

  const updateRule = (id: string, field: keyof ResponseRule, value: any) => {
    onChange(
      rules.map(rule =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    )
  }

  const removeRule = (id: string) => {
    onChange(rules.filter(rule => rule.id !== id))
  }

  const toggleRuleActive = (id: string) => {
    onChange(
      rules.map(rule =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
      )
    )
  }

  return (
    <Card className="border-gray-200">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Settings className="w-5 h-5 text-gray-600" />
            Advanced Response Rules
            <span className="text-sm font-normal text-gray-500">
              ({rules.filter(r => r.isActive).length} active)
            </span>
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">How Response Rules Work:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Product:</strong> Matches product names in orders (e.g., "elastics,charms")</li>
                  <li><strong>Keyword:</strong> Uses regex patterns to match message content</li>
                  <li><strong>Order Status:</strong> Matches based on order fulfillment status</li>
                  <li>Use placeholders like {"{{customer_name}}"}, {"{{order_number}}"}, {"{{product_type}}"}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${
                  rule.isActive ? "bg-white" : "bg-gray-50 opacity-60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Trigger Type
                        </label>
                        <select
                          value={rule.trigger}
                          onChange={(e) => updateRule(rule.id, "trigger", e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="keyword">Keyword</option>
                          <option value="product">Product Type</option>
                          <option value="order_status">Order Status</option>
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Condition (comma-separated for multiple)
                        </label>
                        <input
                          type="text"
                          value={rule.condition}
                          onChange={(e) => updateRule(rule.id, "condition", e.target.value)}
                          placeholder={
                            rule.trigger === "product" 
                              ? "e.g., elastics,charms,bands"
                              : rule.trigger === "keyword"
                              ? "e.g., where.*order|track.*package"
                              : "e.g., unfulfilled,pending"
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRuleActive(rule.id)}
                        className="text-xs"
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Response Template
                    </label>
                    <textarea
                      value={rule.response}
                      onChange={(e) => updateRule(rule.id, "response", e.target.value)}
                      placeholder="Enter the response template with placeholders..."
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-medium text-gray-700">
                        Priority:
                      </label>
                      <input
                        type="number"
                        value={rule.priority}
                        onChange={(e) => updateRule(rule.id, "priority", parseInt(e.target.value))}
                        min="1"
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      (Lower number = higher priority)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={addNewRule}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Rule
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
