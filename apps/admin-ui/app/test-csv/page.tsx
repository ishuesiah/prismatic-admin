"use client"

import { useState } from "react"
import { Button } from "@prismatic/ui"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import Papa from "papaparse"

export default function TestCsvPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    addLog("File input changed")
    const selectedFile = event.target.files?.[0]
    
    if (!selectedFile) {
      addLog("No file selected")
      return
    }

    addLog(`File selected: ${selectedFile.name}, type: ${selectedFile.type}, size: ${selectedFile.size} bytes`)
    setFile(selectedFile)
    
    // Preview the file
    setIsParsing(true)
    addLog("Starting to parse file for preview...")
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        addLog(`Parse complete. Found ${results.data.length} rows`)
        addLog(`Column headers: ${Object.keys(results.data[0] || {}).join(", ")}`)
        
        const mappedData = results.data.map((row: any) => ({
          ticketId: row["Ticket id"] || "",
          customerEmail: row["Customer email"] || "",
          customerName: row["Customer name"] || "",
          messageText: row["Message text"] || "",
          subject: row["Subject"] || ""
        }))
        
        setPreview(mappedData.slice(0, 5))
        setIsParsing(false)
      },
      error: (error) => {
        addLog(`Parse error: ${error.message}`)
        setIsParsing(false)
      }
    })
  }

  const handleUpload = () => {
    addLog("Upload button clicked")
    
    if (!file) {
      addLog("ERROR: No file selected")
      return
    }

    setIsParsing(true)
    addLog(`Parsing file: ${file.name}`)
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          addLog(`Parse complete. ${results.data.length} rows found`)
          
          const validData = results.data.filter((row: any) => 
            row["Customer email"] && row["Message text"]
          )
          
          addLog(`Valid rows (with email and message): ${validData.length}`)
          
          if (validData.length === 0) {
            addLog("ERROR: No valid data found")
            setIsParsing(false)
            return
          }

          addLog("SUCCESS: Data parsed successfully!")
          addLog(`Sample data: ${JSON.stringify(validData[0], null, 2)}`)
          setIsParsing(false)
        },
        error: (error) => {
          addLog(`ERROR: Parse failed - ${error.message}`)
          setIsParsing(false)
        }
      })
    } catch (err) {
      addLog(`ERROR: Unexpected error - ${err}`)
      setIsParsing(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CSV Upload Test Page</h1>
      
      <div className="space-y-4">
        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {/* File Info */}
        {file && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{file.name}</span>
              <span className="text-sm text-gray-500">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            
            {/* Preview */}
            {preview.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-1 text-left">Email</th>
                        <th className="border p-1 text-left">Name</th>
                        <th className="border p-1 text-left">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx}>
                          <td className="border p-1">{row.customerEmail}</td>
                          <td className="border p-1">{row.customerName}</td>
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

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={isParsing}
              className="mt-4"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        )}

        {/* Debug Logs */}
        <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-xs">
          <p className="font-bold mb-2">Debug Console:</p>
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Select a file to begin.</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={log.includes("ERROR") ? "text-red-400" : ""}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
