"use client"

import { useState } from "react"
import { Button } from "@prismatic/ui"
import Papa from "papaparse"

export default function TestCSVDebug() {
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const testParsing = () => {
    if (!file) {
      setError("No file selected")
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Raw results:", results)
        
        // Check how ticketId appears in the data
        const firstRow = results.data[0] as any
        console.log("First row keys:", Object.keys(firstRow))
        console.log("First row:", firstRow)
        
        // Show ticket ID grouping
        let currentTicketId = null
        let ticketGroups: any[] = []
        let currentGroup: any = null
        
        for (const row of results.data as any[]) {
          const ticketId = row["Ticket id"] || row["ticketId"] || ""
          
          if (ticketId && ticketId.trim()) {
            // New ticket
            if (currentGroup) {
              ticketGroups.push(currentGroup)
            }
            currentGroup = {
              ticketId: ticketId,
              subject: row["Subject"],
              customerEmail: row["Customer email"],
              customerName: row["Customer name"],
              messages: [row["Message text"] || ""]
            }
          } else if (currentGroup) {
            // Part of current ticket
            const messageText = row["Message text"] || ""
            if (messageText) {
              currentGroup.messages.push(messageText)
            }
          }
        }
        
        // Don't forget last group
        if (currentGroup) {
          ticketGroups.push(currentGroup)
        }
        
        console.log("Ticket groups:", ticketGroups)
        
        setResults({
          totalRows: results.data.length,
          ticketGroups: ticketGroups,
          firstFewRows: results.data.slice(0, 10)
        })
        setError("")
      },
      error: (err) => {
        setError(`Parse error: ${err.message}`)
        setResults(null)
      }
    })
  }

  const testUpload = async () => {
    if (!file) {
      setError("No file selected")
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const mappedData = results.data.map((row: any) => ({
          ticketId: row["Ticket id"] || "",
          conversationId: row["Conversation id"] || "",
          conversationUrl: row["Conversation url"] || "",
          labels: row["Labels"] || "",
          inbox: row["Inbox"] || "",
          subject: row["Subject"] || "",
          creationDate: row["Creation date"] || "",
          closedDate: row["Closed date"] || "",
          assignee: row["Assignee"] || "",
          customerEmail: row["Customer email"] || "",
          customerName: row["Customer name"] || "",
          messageText: row["Message text"] || ""
        }))

        console.log("Sending to API:", mappedData)
        
        try {
          // We'll make this call without authentication to see what happens
          const response = await fetch("/api/email-responder/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ emails: mappedData })
          })

          const data = await response.json()
          console.log("Response:", data)
          
          if (response.ok) {
            setResults(data)
            setError("")
          } else {
            setError(`API Error: ${JSON.stringify(data)}`)
          }
        } catch (err: any) {
          setError(`Upload error: ${err.message}`)
        }
      }
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">CSV Upload Debug</h1>
      
      <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mb-4"
        />
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={testParsing}>Test Parsing Only</Button>
        <Button onClick={testUpload}>Test Upload to API</Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {results && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Results:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  )
}
