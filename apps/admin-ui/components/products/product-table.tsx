"use client"

import { useState } from "react"
import Link from "next/link"
import { Button, Badge } from "@prismatic/ui"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react"
import { toast } from "react-hot-toast"

interface Product {
  id: string
  sku: string
  name: string
  pickNumber: string | null
  locationCode: string | null
  shopifyProductId: string | null
  shopifyVariantId: string | null
  shipstationProductId: string | null
  category: "PLANNER" | "NOTEBOOK" | "INSERT" | "ACCESSORY"
  status: "ACTIVE" | "DISCONTINUED" | "DRAFT"
  lastShopifySync: string | null
  lastShipstationSync: string | null
  shopifySyncError: string | null
  shipstationSyncError: string | null
  createdAt: string
  updatedAt: string
}

interface ProductTableProps {
  products: Product[]
  sortBy: "sku" | "name" | "updatedAt"
  sortOrder: "asc" | "desc"
  onSort: (field: "sku" | "name" | "updatedAt") => void
  onRefresh: () => void
}

const categoryColors: Record<string, string> = {
  PLANNER: "bg-purple-100 text-purple-800",
  NOTEBOOK: "bg-blue-100 text-blue-800",
  INSERT: "bg-green-100 text-green-800",
  ACCESSORY: "bg-orange-100 text-orange-800"
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DISCONTINUED: "bg-red-100 text-red-800",
  DRAFT: "bg-gray-100 text-gray-800"
}

function SyncStatus({ lastSync, error }: { lastSync: string | null; error: string | null }) {
  if (error) {
    return (
      <div className="flex items-center gap-1 text-red-600" title={error}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs">Error</span>
      </div>
    )
  }
  if (lastSync) {
    const date = new Date(lastSync)
    const isRecent = Date.now() - date.getTime() < 24 * 60 * 60 * 1000
    return (
      <div
        className={`flex items-center gap-1 ${isRecent ? "text-green-600" : "text-amber-600"}`}
        title={date.toLocaleString()}
      >
        {isRecent ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        <span className="text-xs">{isRecent ? "Synced" : "Stale"}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-gray-400">
      <Clock className="w-4 h-4" />
      <span className="text-xs">Never</span>
    </div>
  )
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (field !== sortBy) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
  return sortOrder === "asc" ? (
    <ArrowUp className="w-4 h-4 text-blue-600" />
  ) : (
    <ArrowDown className="w-4 h-4 text-blue-600" />
  )
}

export function ProductTable({ products, sortBy, sortOrder, onSort, onRefresh }: ProductTableProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const handleQuickSync = async (productId: string, platform: "shopify" | "shipstation") => {
    setSyncingId(productId)
    try {
      const response = await fetch("/api/products/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, productIds: [productId] })
      })

      if (!response.ok) throw new Error("Sync failed")

      toast.success(`Synced to ${platform}`)
      onRefresh()
    } catch (error) {
      toast.error(`Failed to sync to ${platform}`)
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3">
              <button
                className="flex items-center gap-1 font-semibold hover:text-blue-600"
                onClick={() => onSort("sku")}
              >
                SKU
                <SortIcon field="sku" sortBy={sortBy} sortOrder={sortOrder} />
              </button>
            </th>
            <th className="text-left p-3">
              <button
                className="flex items-center gap-1 font-semibold hover:text-blue-600"
                onClick={() => onSort("name")}
              >
                Name
                <SortIcon field="name" sortBy={sortBy} sortOrder={sortOrder} />
              </button>
            </th>
            <th className="text-left p-3 font-semibold">Pick #</th>
            <th className="text-left p-3 font-semibold">Location</th>
            <th className="text-left p-3 font-semibold">Category</th>
            <th className="text-left p-3 font-semibold">Status</th>
            <th className="text-center p-3 font-semibold">Shopify</th>
            <th className="text-center p-3 font-semibold">ShipStation</th>
            <th className="text-right p-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                  {product.sku}
                </code>
              </td>
              <td className="p-3">
                <Link
                  href={`/products/${product.id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {product.name}
                </Link>
              </td>
              <td className="p-3">
                {product.pickNumber ? (
                  <span className="font-mono">{product.pickNumber}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="p-3">
                {product.locationCode ? (
                  <code className="bg-blue-50 px-2 py-1 rounded text-xs font-mono text-blue-700">
                    {product.locationCode}
                  </code>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="p-3">
                <Badge className={categoryColors[product.category]}>
                  {product.category}
                </Badge>
              </td>
              <td className="p-3">
                <Badge className={statusColors[product.status]}>
                  {product.status}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-center gap-2">
                  <SyncStatus
                    lastSync={product.lastShopifySync}
                    error={product.shopifySyncError}
                  />
                  {product.shopifyProductId && (
                    <a
                      href={`https://admin.shopify.com/products/${product.shopifyProductId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-center">
                  <SyncStatus
                    lastSync={product.lastShipstationSync}
                    error={product.shipstationSyncError}
                  />
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickSync(product.id, "shopify")}
                    disabled={syncingId === product.id}
                    title="Sync to Shopify"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingId === product.id ? "animate-spin" : ""}`} />
                  </Button>
                  <Link href={`/products/${product.id}`}>
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
