"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@prismatic/ui"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import Papa from "papaparse"
import { toast } from "react-hot-toast"

interface CsvUploaderProps {
  onUpload: (data: any[]) => void | Promise<void>
  isLoading?: boolean
}

export function CsvUploader({ onUpload, isLoading }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isParsing, setIsParsing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (csvFile && csvFile.type === "text/csv") {
      setFile(csvFile)
      setIsParsing(true)
      
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Map CSV columns to our expected format
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
            messageText: row["Message text"] || "",
            // Additional fields we might need
            firstResponseTime: row["First response time (s)"] || "",
            resolutionTime: row["Resolution time (s)"] || "",
            numberOfAgentMessages: row["Number of agent messages"] || "",
            numberOfCustomerMessages: row["Number of customer messages"] || ""
          }))
          
          setPreview(mappedData.slice(0, 5)) // Show first 5 rows as preview
          setIsParsing(false)
        },
        error: (error) => {
          console.error("CSV parsing error:", error)
          toast.error("Failed to parse CSV file")
          setIsParsing(false)
          setFile(null)
        }
      })
    } else {
      toast.error("Please upload a CSV file")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isLoading || isParsing
  })

  const handleUpload = async () => {
    console.log("Upload button clicked")
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    console.log("Starting to parse file:", file.name)
    setIsParsing(true)
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log("Parse complete. Results:", results)
          
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
          
          console.log("Mapped data:", mappedData)
          
          // Filter out empty rows - only require customer email (message text can be in other rows)
          const validData = mappedData.filter(row => 
            row.customerEmail || row.messageText
          )
          
          console.log("Valid data count:", validData.length)
          console.log("Sample valid row:", validData[0])

          if (validData.length === 0) {
            toast.error("No valid email data found in CSV")
            setIsParsing(false)
            return
          }

          try {
            console.log("Calling onUpload with data")
            await onUpload(validData)
            setFile(null)
            setPreview([])
            toast.success("CSV uploaded successfully!")
          } catch (uploadError) {
            console.error("Upload error:", uploadError)
            toast.error("Failed to upload data")
          } finally {
            setIsParsing(false)
          }
        },
        error: (error) => {
          console.error("CSV parsing error:", error)
          toast.error("Failed to parse CSV file")
          setIsParsing(false)
        }
      })
    } catch (err) {
      console.error("Unexpected error:", err)
      toast.error("An unexpected error occurred")
      setIsParsing(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview([])
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-gray-400"
            }
            ${(isLoading || isParsing) ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the CSV file here...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-2">
                Drag and drop your Commslayer CSV file here
              </p>
              <p className="text-sm text-gray-500">
                or click to select a file
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{file.name}</span>
              <span className="text-sm text-gray-500">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              disabled={isLoading || isParsing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-600">Preview (first 5 rows):</p>
              <div className="overflow-x-auto">
                <table className="text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Email</th>
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Subject</th>
                      <th className="border p-2 text-left">Message (truncated)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border p-2">{row.customerEmail}</td>
                        <td className="border p-2">{row.customerName}</td>
                        <td className="border p-2">{row.subject}</td>
                        <td className="border p-2">
                          {row.messageText?.substring(0, 50)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={clearFile}
              disabled={isLoading || isParsing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isLoading || isParsing}
            >
              {isLoading || isParsing ? (
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
        </div>
      )}
    </div>
  )
}
