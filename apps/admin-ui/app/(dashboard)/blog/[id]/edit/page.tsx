"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Send, Upload } from "lucide-react"
import Link from "next/link"
import { Button } from "@prismatic/ui"
import { Input } from "@prismatic/ui"
import { Label } from "@prismatic/ui"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prismatic/ui"
import { Card } from "@prismatic/ui"
import { Badge } from "@prismatic/ui"
import TiptapEditor from "@/components/blog/tiptap-editor"
import TableOfContents from "@/components/blog/table-of-contents"
import SEOAnalyzer from "@/components/blog/seo-analyzer"
import ReadabilityStats from "@/components/blog/readability-stats"

interface BlogPost {
  id: string
  title: string
  slug: string
  content: any
  excerpt: string | null
  featuredImage: string | null
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED"
  publishedAt: string | null
  shopifyArticleId: string | null
  seo: any
  author: {
    name: string | null
    email: string
    id: string
  }
}

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: {},
    excerpt: "",
    featuredImage: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "SCHEDULED",
    publishedAt: "",
    seo: {
      metaTitle: "",
      metaDescription: "",
    },
  })

  useEffect(() => {
    fetchPost()
  }, [postId])

  async function fetchPost() {
    try {
      setLoading(true)
      const response = await fetch(`/api/blog/${postId}`)
      if (!response.ok) throw new Error("Failed to fetch post")
      
      const { post } = await response.json()
      setPost(post)
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || "",
        featuredImage: post.featuredImage || "",
        status: post.status,
        publishedAt: post.publishedAt
          ? new Date(post.publishedAt).toISOString().slice(0, 16)
          : "",
        seo: post.seo || { metaTitle: "", metaDescription: "" },
      })
    } catch (error) {
      console.error("Error fetching post:", error)
      alert("Failed to load post")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(newStatus?: "DRAFT" | "PUBLISHED") {
    if (!formData.title) {
      alert("Please enter a title")
      return
    }

    try {
      setSaving(true)
      const status = newStatus || formData.status
      const response = await fetch(`/api/blog/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status,
          publishedAt:
            status === "PUBLISHED" && !formData.publishedAt
              ? new Date().toISOString()
              : formData.publishedAt || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update post")
      }

      await fetchPost()
      alert("Post updated successfully!")
    } catch (error) {
      console.error("Error updating post:", error)
      alert(error instanceof Error ? error.message : "Failed to update post")
    } finally {
      setSaving(false)
    }
  }

  async function handlePublishToShopify() {
    if (!formData.title) {
      alert("Please enter a title")
      return
    }

    try {
      setPublishing(true)
      
      // First save the post
      await handleUpdate("PUBLISHED")
      
      // TODO: Implement Shopify API integration
      // This would call a Shopify connector to create/update the article
      // For now, we'll simulate it
      alert("Shopify integration coming soon! Post has been published locally.")
      
      // In a real implementation, you would:
      // 1. Call Shopify Admin API to create/update article
      // 2. Store the returned article ID in shopifyArticleId field
      // 3. Update the post with the Shopify article ID
      
      /*
      const shopifyResponse = await fetch("/api/blog/shopify/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          ...formData,
        }),
      })
      
      if (!shopifyResponse.ok) {
        throw new Error("Failed to publish to Shopify")
      }
      
      const { articleId } = await shopifyResponse.json()
      
      // Update post with Shopify article ID
      await fetch(`/api/blog/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopifyArticleId: articleId,
        }),
      })
      
      await fetchPost()
      alert("Post published to Shopify successfully!")
      */
    } catch (error) {
      console.error("Error publishing to Shopify:", error)
      alert(
        error instanceof Error ? error.message : "Failed to publish to Shopify"
      )
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading post...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Post not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Blog Post</h1>
              {post.shopifyArticleId && (
                <Badge className="mt-1 bg-purple-100 text-purple-800">
                  Synced with Shopify
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleUpdate("DRAFT")}
              disabled={saving || publishing}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleUpdate("PUBLISHED")}
              disabled={saving || publishing}
            >
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
            <Button
              onClick={handlePublishToShopify}
              disabled={saving || publishing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Publish to Shopify
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter post title..."
                    className="text-2xl font-bold border-0 focus:ring-0 px-0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      /blog/
                    </span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="post-slug"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Content Editor */}
            <Card className="p-6">
              <Label className="mb-4 block">Content</Label>
              <TiptapEditor
                content={formData.content}
                onChange={(content) =>
                  setFormData({ ...formData, content })
                }
              />
            </Card>

            {/* Excerpt */}
            <Card className="p-6">
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  placeholder="Brief description of your post..."
                  rows={3}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </Card>

            {/* SEO */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.seo.metaTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaTitle: e.target.value },
                      })
                    }
                    placeholder="SEO title (defaults to post title)"
                  />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <textarea
                    id="metaDescription"
                    value={formData.seo.metaDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaDescription: e.target.value },
                      })
                    }
                    placeholder="SEO description (defaults to excerpt)"
                    rows={2}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.seo.metaDescription.length}/160 characters
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Readability Stats */}
            <ReadabilityStats content={formData.content} />

            {/* Table of Contents */}
            <Card className="p-6">
              <TableOfContents content={formData.content} />
            </Card>

            {/* SEO Analyzer */}
            <SEOAnalyzer
              title={formData.title}
              content={formData.content}
              excerpt={formData.excerpt}
              seo={formData.seo}
              onUpdateSEO={(updates) => {
                setFormData(prev => ({
                  ...prev,
                  ...(updates.excerpt !== undefined && { excerpt: updates.excerpt }),
                  seo: {
                    ...prev.seo,
                    ...(updates.metaTitle !== undefined && { metaTitle: updates.metaTitle }),
                    ...(updates.metaDescription !== undefined && { metaDescription: updates.metaDescription }),
                  }
                }))
              }}
            />

            {/* Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Publish</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === "SCHEDULED" && (
                  <div>
                    <Label htmlFor="publishedAt">Publish Date</Label>
                    <Input
                      id="publishedAt"
                      type="datetime-local"
                      value={formData.publishedAt}
                      onChange={(e) =>
                        setFormData({ ...formData, publishedAt: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Featured Image */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Featured Image</h3>
              <div>
                <Label htmlFor="featuredImage">Image URL</Label>
                <Input
                  id="featuredImage"
                  value={formData.featuredImage}
                  onChange={(e) =>
                    setFormData({ ...formData, featuredImage: e.target.value })
                  }
                  placeholder="https://..."
                />
                {formData.featuredImage && (
                  <div className="mt-4">
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="w-full h-auto rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png"
                      }}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Post Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Post Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Author:</span>{" "}
                  <span className="font-medium">
                    {post.author.name || post.author.email}
                  </span>
                </div>
                {post.publishedAt && (
                  <div>
                    <span className="text-gray-500">Published:</span>{" "}
                    <span className="font-medium">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {post.shopifyArticleId && (
                  <div>
                    <span className="text-gray-500">Shopify ID:</span>{" "}
                    <span className="font-mono text-xs">
                      {post.shopifyArticleId}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
