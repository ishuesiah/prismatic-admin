"use client"

import { useState } from "react"
import { Button } from "@prismatic/ui"
import { Upload, Loader2 } from "lucide-react"
import Papa from "papaparse"

// Sample CSV data
const SAMPLE_CSV = `Ticket id,Conversation id,Conversation url,Labels,Inbox,Created by an agent,Subject,Creation date,Closed date,Assignee,Customer email,Customer name,First response time (s),Resolution time (s),Number of agent messages,Number of customer messages,Message id,Message timestamp,Sender type,Sender name,Message text
27581632,64055,https://app.commslayer.com/app/accounts/457/inbox/1037/conversations/64055,,hello,FALSE,Order Status Inquiry,2025-11-15 18:23:55 UTC,,,john.doe@example.com,John Doe,,,0,2,,,,,Hi I purchased a new planner for 2026 along with some elastic bands and I haven't received it yet. Order #48292
27581633,64056,https://app.commslayer.com/app/accounts/457/inbox/1037/conversations/64056,,hello,FALSE,Damaged Item,2025-11-15 18:30:00 UTC,,,jane.smith@example.com,Jane Smith,,,0,2,,,,,My order arrived but the planner cover is damaged. Can I get a replacement?
27581634,64057,https://app.commslayer.com/app/accounts/457/inbox/1037/conversations/64057,,hello,FALSE,Wholesale Inquiry,2025-11-15 18:45:00 UTC,,,business@company.com,Business Owner,,,0,2,,,,,I'm interested in purchasing your products wholesale for my store. Can you provide pricing?
27581635,64058,https://app.commslayer.com/app/accounts/457/inbox/1037/conversations/64058,,hello,FALSE,Thank You,2025-11-15 19:00:00 UTC,,,happy@customer.com,Happy Customer,,,0,2,,,,,Just wanted to say thank you for the quick delivery!
27581636,64059,https://app.commslayer.com/app/accounts/457/inbox/1037/conversations/64059,,hello,FALSE,Where is my order,2025-11-15 19:15:00 UTC,,,waiting@email.com,Waiting Person,,,0,2,,,,,Where is my order? I ordered elastics and charms last week`

export default function TestCsvDirectPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleTestCsvParsing = () => {
    addLog("Starting CSV parsing test...")
    setIsParsing(true)
    
    try {
      Papa.parse(SAMPLE_CSV, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          addLog(`Parse complete. Found ${results.data.length} rows`)
          
          const mappedData = results.data.map((row: any) => ({
            ticketId: row["Ticket id"] || "",
            conversationId: row["Conversation id"] || "",
            customerEmail: row["Customer email"] || "",
            customerName: row["Customer name"] || "",
            messageText: row["Message text"] || "",
            subject: row["Subject"] || ""
          }))
          
          addLog(`Mapped ${mappedData.length} rows`)
          
          // Filter valid data
          const validData = mappedData.filter(row => 
            row.customerEmail && row.messageText
          )
          
          addLog(`Valid rows (with email and message): ${validData.length}`)
          setParsedData(validData)
          
          // Log sample data
          if (validData.length > 0) {
            addLog("SUCCESS: Data parsed successfully!")
            addLog(`First row: ${JSON.stringify(validData[0], null, 2)}`)
          }
          
          setIsParsing(false)
        },
        error: (error: any) => {
          addLog(`ERROR: Parse failed - ${error.message}`)
          setIsParsing(false)
        }
      })
    } catch (err) {
      addLog(`ERROR: Unexpected error - ${err}`)
      setIsParsing(false)
    }
  }

  const simulateUploadFlow = async () => {
    addLog("Simulating upload flow...")
    
    if (parsedData.length === 0) {
      addLog("ERROR: No parsed data available. Parse CSV first!")
      return
    }

    addLog("Calling API endpoint /api/email-responder/upload")
    
    try {
      const response = await fetch("/api/email-responder/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parsedData })
      })

      addLog(`API response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        addLog(`ERROR: Upload failed - ${errorText}`)
        return
      }

      const result = await response.json()
      addLog(`SUCCESS: Upload complete - ${JSON.stringify(result)}`)
      
    } catch (error) {
      addLog(`ERROR: API call failed - ${error}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CSV Upload Direct Test</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800 mb-4">
            This test page uses hardcoded CSV data to test the parsing and upload functionality directly.
          </p>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleTestCsvParsing}
            disabled={isParsing}
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Test CSV Parsing
              </>
            )}
          </Button>

          <Button
            onClick={simulateUploadFlow}
            disabled={parsedData.length === 0}
            variant="outline"
          >
            Simulate Upload to API
          </Button>
        </div>

        {/* Parsed Data Display */}
        {parsedData.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium mb-2">Parsed Data ({parsedData.length} rows):</p>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-1 text-left">Email</th>
                    <th className="border p-1 text-left">Name</th>
                    <th className="border p-1 text-left">Subject</th>
                    <th className="border p-1 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border p-1">{row.customerEmail}</td>
                      <td className="border p-1">{row.customerName}</td>
                      <td className="border p-1">{row.subject}</td>
                      <td className="border p-1">
                        {row.messageText?.substring(0, 50)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Debug Console */}
        <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-xs max-h-96 overflow-y-auto">
          <p className="font-bold mb-2">Debug Console:</p>
          {logs.length === 0 ? (
            <p className="text-gray-500">Click 'Test CSV Parsing' to begin.</p>
          ) : (
            logs.map((log, idx) => (
              <div 
                key={idx} 
                className={
                  log.includes("ERROR") ? "text-red-400" : 
                  log.includes("SUCCESS") ? "text-green-400" : ""
                }
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
