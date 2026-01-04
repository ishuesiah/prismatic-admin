"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@prismatic/ui"
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import Papa from "papaparse"
import { toast } from "react-hot-toast"

interface ProductCsvUploaderProps {
  onImportComplete: (count: number) => void
}

interface ColumnMapping {
  sku: string
  name: string
  pickNumber: string
  locationCode: string
  category: string
  status: string
  shopifyProductId: string
  shipstationProductId: string
}

const EXPECTED_COLUMNS: (keyof ColumnMapping)[] = [
  "sku",
  "name",
  "pickNumber",
  "locationCode",
  "category",
  "status",
  "shopifyProductId",
  "shipstationProductId"
]

const COLUMN_ALIASES: Record<string, keyof ColumnMapping> = {
  // SKU aliases
  "sku": "sku",
  "SKU": "sku",
  "product_sku": "sku",
  "Product SKU": "sku",
  "variant_sku": "sku",
  "Variant SKU": "sku",
  "item_sku": "sku",

  // Name aliases
  "name": "name",
  "Name": "name",
  "product_name": "name",
  "Product Name": "name",
  "title": "name",
  "Title": "name",
  "Product Title": "name",

  // Pick number aliases
  "pickNumber": "pickNumber",
  "pick_number": "pickNumber",
  "Pick Number": "pickNumber",
  "pick": "pickNumber",
  "Pick": "pickNumber",
  "pick_num": "pickNumber",

  // Location aliases
  "locationCode": "locationCode",
  "location_code": "locationCode",
  "Location Code": "locationCode",
  "location": "locationCode",
  "Location": "locationCode",
  "bin": "locationCode",
  "Bin": "locationCode",
  "bin_location": "locationCode",

  // Category aliases
  "category": "category",
  "Category": "category",
  "product_type": "category",
  "Product Type": "category",
  "type": "category",
  "Type": "category",

  // Status aliases
  "status": "status",
  "Status": "status",
  "product_status": "status",

  // Shopify ID aliases
  "shopifyProductId": "shopifyProductId",
  "shopify_product_id": "shopifyProductId",
  "Shopify Product ID": "shopifyProductId",
  "shopify_id": "shopifyProductId",

  // ShipStation ID aliases
  "shipstationProductId": "shipstationProductId",
  "shipstation_product_id": "shipstationProductId",
  "ShipStation Product ID": "shipstationProductId",
  "shipstation_id": "shipstationProductId"
}

export function ProductCsvUploader({ onImportComplete }: ProductCsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [columnMapping, setColumnMapping] = useState<Partial<ColumnMapping>>({})
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [totalRows, setTotalRows] = useState(0)

  const detectColumnMapping = (headers: string[]): Partial<ColumnMapping> => {
    const mapping: Partial<ColumnMapping> = {}
    headers.forEach(header => {
      const normalizedHeader = header.trim()
      if (COLUMN_ALIASES[normalizedHeader]) {
        mapping[COLUMN_ALIASES[normalizedHeader]] = normalizedHeader
      }
    })
    return mapping
  }

  const validateData = (data: any[], mapping: Partial<ColumnMapping>): string[] => {
    const errors: string[] = []

    if (!mapping.sku && !mapping.name) {
      errors.push("CSV must contain at least a SKU or Name column")
    }

    let emptySkuCount = 0
    let emptyNameCount = 0

    data.forEach((row, index) => {
      const sku = mapping.sku ? row[mapping.sku]?.trim() : null
      const name = mapping.name ? row[mapping.name]?.trim() : null

      if (!sku && !name) {
        if (index < 5) {
          errors.push(`Row ${index + 2}: Missing both SKU and Name`)
        }
      }
      if (!sku) emptySkuCount++
      if (!name) emptyNameCount++
    })

    if (emptySkuCount > 0 && emptySkuCount < data.length) {
      errors.push(`${emptySkuCount} rows are missing SKU (will be auto-generated)`)
    }

    return errors
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (!csvFile) return

    if (csvFile.type !== "text/csv" && !csvFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file")
      return
    }

    setFile(csvFile)
    setIsParsing(true)
    setValidationErrors([])

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      preview: 100, // Only parse first 100 rows for preview
      complete: (results) => {
        const headers = results.meta.fields || []
        setDetectedColumns(headers)

        const mapping = detectColumnMapping(headers)
        setColumnMapping(mapping)

        const errors = validateData(results.data as any[], mapping)
        setValidationErrors(errors.filter(e => !e.includes("will be auto-generated")))

        setPreview((results.data as any[]).slice(0, 5))
        setTotalRows(results.data.length)
        setIsParsing(false)
      },
      error: (error) => {
        console.error("CSV parsing error:", error)
        toast.error("Failed to parse CSV file")
        setIsParsing(false)
        setFile(null)
      }
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: isUploading || isParsing
  })

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Map data using detected column mapping
          const products = (results.data as any[])
            .filter(row => {
              const sku = columnMapping.sku ? row[columnMapping.sku]?.trim() : null
              const name = columnMapping.name ? row[columnMapping.name]?.trim() : null
              return sku || name
            })
            .map(row => ({
              sku: columnMapping.sku ? row[columnMapping.sku]?.trim() : null,
              name: columnMapping.name ? row[columnMapping.name]?.trim() : null,
              pickNumber: columnMapping.pickNumber ? row[columnMapping.pickNumber]?.trim() : null,
              locationCode: columnMapping.locationCode ? row[columnMapping.locationCode]?.trim() : null,
              category: columnMapping.category ? row[columnMapping.category]?.trim()?.toUpperCase() : null,
              status: columnMapping.status ? row[columnMapping.status]?.trim()?.toUpperCase() : null,
              shopifyProductId: columnMapping.shopifyProductId ? row[columnMapping.shopifyProductId]?.trim() : null,
              shipstationProductId: columnMapping.shipstationProductId ? row[columnMapping.shipstationProductId]?.trim() : null
            }))

          const response = await fetch("/api/products/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || "Import failed")
          }

          const result = await response.json()
          setFile(null)
          setPreview([])
          setColumnMapping({})
          onImportComplete(result.imported)
        } catch (error) {
          console.error("Import error:", error)
          toast.error(error instanceof Error ? error.message : "Failed to import products")
        } finally {
          setIsUploading(false)
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error)
        toast.error("Failed to parse CSV file")
        setIsUploading(false)
      }
    })
  }

  const clearFile = () => {
    setFile(null)
    setPreview([])
    setColumnMapping({})
    setDetectedColumns([])
    setValidationErrors([])
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
            ${(isUploading || isParsing) ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the CSV file here...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-2">Drag and drop your product CSV file here</p>
              <p className="text-sm text-gray-500 mb-4">or click to select a file</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Expected columns: SKU, Name, Pick Number, Location, Category, Status</p>
                <p>Categories: PLANNER, NOTEBOOK, INSERT, ACCESSORY</p>
                <p>Status: ACTIVE, DISCONTINUED, DRAFT</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          {/* File Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{file.name}</span>
              <span className="text-sm text-gray-500">
                ({totalRows} rows)
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile} disabled={isUploading}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Column Mapping Display */}
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="text-sm font-medium mb-2">Detected Column Mapping:</h4>
            <div className="flex flex-wrap gap-2">
              {EXPECTED_COLUMNS.map(col => (
                <div
                  key={col}
                  className={`text-xs px-2 py-1 rounded ${
                    columnMapping[col]
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {col}: {columnMapping[col] || "Not found"}
                </div>
              ))}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-1">Validation Warnings:</h4>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {validationErrors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li>...and {validationErrors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && columnMapping.sku && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Preview (first 5 rows):</h4>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">SKU</th>
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Pick #</th>
                      <th className="border p-2 text-left">Location</th>
                      <th className="border p-2 text-left">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border p-2 font-mono">
                          {columnMapping.sku ? row[columnMapping.sku] : "-"}
                        </td>
                        <td className="border p-2">
                          {columnMapping.name ? row[columnMapping.name]?.substring(0, 40) : "-"}
                          {columnMapping.name && row[columnMapping.name]?.length > 40 ? "..." : ""}
                        </td>
                        <td className="border p-2">
                          {columnMapping.pickNumber ? row[columnMapping.pickNumber] : "-"}
                        </td>
                        <td className="border p-2 font-mono">
                          {columnMapping.locationCode ? row[columnMapping.locationCode] : "-"}
                        </td>
                        <td className="border p-2">
                          {columnMapping.category ? row[columnMapping.category] : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={clearFile} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || validationErrors.some(e => !e.includes("will be auto-generated"))}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Import {totalRows} Products
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
