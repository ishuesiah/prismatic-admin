"use client"

import { useState, useEffect, useCallback } from "react"
import { Button, Card, CardContent, CardHeader, Input, Badge } from "@prismatic/ui"
import {
  Package,
  Upload,
  Search,
  RefreshCw,
  Plus,
  Filter,
  Download,
  ArrowUpDown,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { ProductTable } from "@/components/products/product-table"
import { ProductCsvUploader } from "@/components/products/product-csv-uploader"
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

const CATEGORIES = ["ALL", "PLANNER", "NOTEBOOK", "INSERT", "ACCESSORY"] as const
const STATUSES = ["ALL", "ACTIVE", "DISCONTINUED", "DRAFT"] as const

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showImporter, setShowImporter] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<"sku" | "name" | "updatedAt">("updatedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isSyncing, setIsSyncing] = useState<{ shopify: boolean; shipstation: boolean }>({
    shopify: false,
    shipstation: false
  })
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    needsSync: 0
  })

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (categoryFilter !== "ALL") params.set("category", categoryFilter)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)

      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error("Failed to load products")

      const data = await response.json()
      setProducts(data.products)
      setStats(data.stats)
    } catch (error) {
      console.error("Load error:", error)
      toast.error("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, categoryFilter, statusFilter, sortBy, sortOrder])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleImportComplete = (count: number) => {
    setShowImporter(false)
    toast.success(`Imported ${count} products`)
    loadProducts()
  }

  const handleSyncAll = async (platform: "shopify" | "shipstation") => {
    setIsSyncing(prev => ({ ...prev, [platform]: true }))
    try {
      const response = await fetch("/api/products/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, productIds: products.map(p => p.id) })
      })

      if (!response.ok) throw new Error(`Failed to sync to ${platform}`)

      const result = await response.json()
      toast.success(`Synced ${result.synced} products to ${platform}`)
      loadProducts()
    } catch (error) {
      console.error("Sync error:", error)
      toast.error(`Failed to sync to ${platform}`)
    } finally {
      setIsSyncing(prev => ({ ...prev, [platform]: false }))
    }
  }

  const handleExportCsv = () => {
    const csvContent = [
      ["SKU", "Name", "Pick Number", "Location", "Category", "Status", "Shopify ID", "ShipStation ID"].join(","),
      ...products.map(p => [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.pickNumber || "",
        p.locationCode || "",
        p.category,
        p.status,
        p.shopifyProductId || "",
        p.shipstationProductId || ""
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8" />
          Product Database
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowImporter(!showImporter)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Products</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Needs Sync</p>
                <p className="text-2xl font-bold">{stats.needsSync}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Importer (collapsible) */}
      {showImporter && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Products from CSV
            </h2>
          </CardHeader>
          <CardContent>
            <ProductCsvUploader onImportComplete={handleImportComplete} />
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by SKU or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              {STATUSES.map(status => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Statuses" : status}
                </option>
              ))}
            </select>

            {/* Sync Buttons */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSyncAll("shopify")}
                disabled={isSyncing.shopify || products.length === 0}
              >
                {isSyncing.shopify ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync to Shopify
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSyncAll("shipstation")}
                disabled={isSyncing.shipstation || products.length === 0}
              >
                {isSyncing.shipstation ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync to ShipStation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No products found</p>
              <Button onClick={() => setShowImporter(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import your first products
              </Button>
            </div>
          ) : (
            <ProductTable
              products={products}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={toggleSort}
              onRefresh={loadProducts}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
