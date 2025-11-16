"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Send } from "lucide-react"
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
import TiptapEditor from "@/components/blog/tiptap-editor"
import TableOfContents from "@/components/blog/table-of-contents"
import SEOAnalyzer from "@/components/blog/seo-analyzer"
import ReadabilityStats from "@/components/blog/readability-stats"

export default function NewBlogPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
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

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.title, formData.slug])

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    if (!formData.title) {
      alert("Please enter a title")
      return
    }

    try {
      setSaving(true)
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status,
          publishedAt: status === "PUBLISHED" ? new Date().toISOString() : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create post")
      }

      const { post } = await response.json()
      router.push(`/blog/${post.id}/edit`)
    } catch (error) {
      console.error("Error creating post:", error)
      alert(error instanceof Error ? error.message : "Failed to create post")
    } finally {
      setSaving(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">New Blog Post</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSubmit("DRAFT")}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={saving}
            >
              <Send className="h-4 w-4 mr-2" />
              Publish
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
          </div>
        </div>
      </div>
    </div>
  )
}
