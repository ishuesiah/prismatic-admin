"use client"

import { useState, useEffect } from "react"
import { X, Download, Trash2, RefreshCw, Terminal, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@prismatic/ui"

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success' | 'debug'
  category: string
  message: string
  data?: any
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadLogs()
    const interval = setInterval(loadLogs, 2000) // Refresh every 2 seconds
    return () => clearInterval(interval)
  }, [])

  const loadLogs = () => {
    try {
      const stored = localStorage.getItem('debug_logs')
      if (stored) {
        const parsed = JSON.parse(stored)
        setLogs(parsed.reverse()) // Most recent first
      }
    } catch (e) {
      console.error("Failed to load debug logs:", e)
    }
  }

  const clearLogs = () => {
    localStorage.removeItem('debug_logs')
    setLogs([])
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `debug-logs-${new Date().toISOString()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const toggleExpand = (index: number) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== "all" && log.level !== filterLevel) return false
    if (filterCategory !== "all" && log.category !== filterCategory) return false
    return true
  })

  const categories = Array.from(new Set(logs.map(l => l.category)))

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-600 bg-yellow-50'
      case 'success': return 'text-green-600 bg-green-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      case 'debug': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getLevelEmoji = (level: string) => {
    switch (level) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      case 'success': return '✅'
      case 'info': return 'ℹ️'
      case 'debug': return '🔍'
      default: return '📝'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 z-50 flex items-center gap-2"
        title="Open Debug Panel"
      >
        <Terminal className="w-5 h-5" />
        {logs.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
            {logs.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-2/3 lg:w-1/2 h-96 bg-white border-t-2 border-gray-300 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5" />
          <h3 className="font-semibold">Debug Console</h3>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
            {filteredLogs.length} logs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadLogs}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={exportLogs}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            onClick={clearLogs}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-gray-800 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-100 px-4 py-2 flex gap-3 border-b">
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="all">All Levels</option>
          <option value="error">❌ Errors</option>
          <option value="warn">⚠️ Warnings</option>
          <option value="success">✅ Success</option>
          <option value="info">ℹ️ Info</option>
          <option value="debug">🔍 Debug</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs bg-gray-50">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No logs to display
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`border rounded p-2 ${getLevelColor(log.level)} cursor-pointer hover:shadow-sm`}
              onClick={() => log.data && toggleExpand(index)}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0">{getLevelEmoji(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-semibold">[{log.category}]</span>
                    <span className="flex-1 truncate">{log.message}</span>
                    {log.data && (
                      <button className="flex-shrink-0">
                        {expandedLogs.has(index) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  {log.data && expandedLogs.has(index) && (
                    <pre className="mt-2 p-2 bg-white rounded text-[10px] overflow-x-auto border">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 border-t flex gap-4">
        <span>❌ {logs.filter(l => l.level === 'error').length} errors</span>
        <span>⚠️ {logs.filter(l => l.level === 'warn').length} warnings</span>
        <span>✅ {logs.filter(l => l.level === 'success').length} success</span>
        <span>ℹ️ {logs.filter(l => l.level === 'info').length} info</span>
        <span>🔍 {logs.filter(l => l.level === 'debug').length} debug</span>
      </div>
    </div>
  )
}
