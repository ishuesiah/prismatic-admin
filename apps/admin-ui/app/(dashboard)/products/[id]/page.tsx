"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button, Card, CardContent, CardHeader, Input, Label, Badge } from "@prismatic/ui"
import {
  Package,
  Save,
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  ExternalLink,
  Clock,
  History
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
  notes: string | null
  createdAt: string
  updatedAt: string
  syncLogs?: SyncLog[]
}

interface SyncLog {
  id: string
  platform: string
  action: string
  success: boolean
  errorMessage: string | null
  createdAt: string
}

const CATEGORIES = ["PLANNER", "NOTEBOOK", "INSERT", "ACCESSORY"] as const
const STATUSES = ["ACTIVE", "DISCONTINUED", "DRAFT"] as const

export default function ProductEditPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const isNew = productId === "new"

  const [product, setProduct] = useState<Partial<Product>>({
    sku: "",
    name: "",
    pickNumber: "",
    locationCode: "",
    category: "ACCESSORY",
    status: "DRAFT",
    notes: ""
  })
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState<{ shopify: boolean; shipstation: boolean }>({
    shopify: false,
    shipstation: false
  })
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!isNew) {
      loadProduct()
    }
  }, [productId, isNew])

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Product not found")
          router.push("/products")
          return
        }
        throw new Error("Failed to load product")
      }
      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error("Load error:", error)
      toast.error("Failed to load product")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof Product, value: string) => {
    setProduct(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!product.name?.trim()) {
      toast.error("Product name is required")
      return
    }

    setIsSaving(true)
    try {
      const method = isNew ? "POST" : "PUT"
      const url = isNew ? "/api/products" : `/api/products/${productId}`

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to save product")
      }

      const saved = await response.json()
      toast.success(isNew ? "Product created" : "Product saved")
      setHasChanges(false)

      if (isNew) {
        router.push(`/products/${saved.id}`)
      } else {
        setProduct(saved)
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save product")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async (platform: "shopify" | "shipstation") => {
    if (isNew) {
      toast.error("Save the product first before syncing")
      return
    }

    setIsSyncing(prev => ({ ...prev, [platform]: true }))
    try {
      const response = await fetch("/api/products/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, productIds: [productId] })
      })

      if (!response.ok) throw new Error(`Failed to sync to ${platform}`)

      toast.success(`Synced to ${platform}`)
      loadProduct() // Reload to get updated sync status
    } catch (error) {
      toast.error(`Failed to sync to ${platform}`)
    } finally {
      setIsSyncing(prev => ({ ...prev, [platform]: false }))
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete product")

      toast.success("Product deleted")
      router.push("/products")
    } catch (error) {
      toast.error("Failed to delete product")
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            {isNew ? "New Product" : product.name}
          </h1>
          {!isNew && product.status && (
            <Badge className={
              product.status === "ACTIVE" ? "bg-green-100 text-green-800" :
              product.status === "DISCONTINUED" ? "bg-red-100 text-red-800" :
              "bg-gray-100 text-gray-800"
            }>
              {product.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isNew ? "Create Product" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Product Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={product.sku || ""}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    placeholder="e.g., HO-PLN-2024-BLK"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to auto-generate
                  </p>
                </div>
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={product.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., 2024 Weekly Planner - Black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickNumber">Pick Number</Label>
                  <Input
                    id="pickNumber"
                    value={product.pickNumber || ""}
                    onChange={(e) => handleChange("pickNumber", e.target.value)}
                    placeholder="e.g., P001"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for warehouse labels
                  </p>
                </div>
                <div>
                  <Label htmlFor="locationCode">Location Code</Label>
                  <Input
                    id="locationCode"
                    value={product.locationCode || ""}
                    onChange={(e) => handleChange("locationCode", e.target.value)}
                    placeholder="e.g., A01-K1-A"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: Aisle-Kallax-Cube
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={product.category || "ACCESSORY"}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={product.status || "DRAFT"}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={product.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Internal notes about this product..."
                  className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* External IDs */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">External System IDs</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shopifyProductId">Shopify Product ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="shopifyProductId"
                      value={product.shopifyProductId || ""}
                      onChange={(e) => handleChange("shopifyProductId", e.target.value)}
                      placeholder="e.g., 7894561230123"
                      className="font-mono"
                    />
                    {product.shopifyProductId && (
                      <a
                        href={`https://admin.shopify.com/products/${product.shopifyProductId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-3 border rounded-md hover:bg-gray-50"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="shopifyVariantId">Shopify Variant ID</Label>
                  <Input
                    id="shopifyVariantId"
                    value={product.shopifyVariantId || ""}
                    onChange={(e) => handleChange("shopifyVariantId", e.target.value)}
                    placeholder="e.g., 45678901234567"
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shipstationProductId">ShipStation Product ID</Label>
                <Input
                  id="shipstationProductId"
                  value={product.shipstationProductId || ""}
                  onChange={(e) => handleChange("shipstationProductId", e.target.value)}
                  placeholder="e.g., 12345678"
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sync Status */}
          {!isNew && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Sync Status
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Shopify */}
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Shopify</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync("shopify")}
                      disabled={isSyncing.shopify}
                    >
                      {isSyncing.shopify ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {product.shopifySyncError ? (
                    <div className="flex items-start gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      <span>{product.shopifySyncError}</span>
                    </div>
                  ) : product.lastShopifySync ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Synced {formatDate(product.lastShopifySync)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Never synced</span>
                    </div>
                  )}
                </div>

                {/* ShipStation */}
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">ShipStation</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync("shipstation")}
                      disabled={isSyncing.shipstation}
                    >
                      {isSyncing.shipstation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {product.shipstationSyncError ? (
                    <div className="flex items-start gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      <span>{product.shipstationSyncError}</span>
                    </div>
                  ) : product.lastShipstationSync ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Synced {formatDate(product.lastShipstationSync)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Never synced</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {!isNew && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Metadata</h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span>{formatDate(product.createdAt || null)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span>{formatDate(product.updatedAt || null)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{product.id}</code>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sync History */}
          {!isNew && product.syncLogs && product.syncLogs.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Sync History
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.syncLogs.slice(0, 5).map(log => (
                    <div
                      key={log.id}
                      className={`text-xs p-2 rounded border ${
                        log.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{log.platform}</span>
                        <span className="text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {log.success ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>{log.action}</span>
                      </div>
                      {log.errorMessage && (
                        <p className="text-red-600 mt-1">{log.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
