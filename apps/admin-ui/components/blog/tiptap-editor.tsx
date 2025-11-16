"use client"

import { useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Extension } from "@tiptap/core"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Images,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button, cn } from "@prismatic/ui"
import { HemingwayExtension } from "./hemingway-extension"
import { ImageGallery } from "./image-gallery-extension"

interface TiptapEditorProps {
  content: any
  onChange: (content: any) => void
  editable?: boolean
}

interface EditorState {
  highlighting: boolean
  checkingGrammar: boolean
}

// Extension to add IDs to headings and render them in HTML
const HeadingWithId = Extension.create({
  name: "headingWithId",
  
  addGlobalAttributes() {
    return [
      {
        types: ["heading"],
        attributes: {
          id: {
            default: null,
            parseHTML: (element) => element.getAttribute("id"),
            renderHTML: (attributes) => {
              if (!attributes.id) {
                return {}
              }
              return { 
                id: attributes.id,
                class: "scroll-mt-20"
              }
            },
          },
        },
      },
    ]
  },
  
  addProseMirrorPlugins() {
    return []
  },
})

export default function TiptapEditor({
  content,
  onChange,
  editable = true,
}: TiptapEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>({
    highlighting: true,
    checkingGrammar: false,
  })
  // Add IDs to headings in content before passing to editor
  const prepareContent = (contentData: any) => {
    if (!contentData || !contentData.content) return contentData
    
    const updatedContent = JSON.parse(JSON.stringify(contentData))
    
    updatedContent.content.forEach((node: any, index: number) => {
      if (node.type === "heading" && node.content) {
        const text = node.content
          .map((c: any) => c.text || "")
          .join("")
        if (text) {
          const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
          if (!node.attrs) node.attrs = {}
          node.attrs.id = id
        }
      }
    })
    
    return updatedContent
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          HTMLAttributes: {
            class: "scroll-mt-20",
          },
        },
      }),
      HeadingWithId,
      HemingwayExtension.configure({
        enabled: editorState.highlighting,
      }),
      ImageGallery.configure({
        HTMLAttributes: {
          class: "image-gallery-wrapper",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 hover:underline",
        },
      }),
    ],
    content: prepareContent(content),
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      
      // Add IDs to headings for TOC navigation
      if (json.content) {
        json.content.forEach((node: any, index: number) => {
          if (node.type === "heading" && node.content) {
            const text = node.content
              .map((c: any) => c.text || "")
              .join("")
            if (text) {
              const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
              if (!node.attrs) node.attrs = {}
              node.attrs.id = id
            }
          }
        })
      }
      
      onChange(json)
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] p-4",
      },
    },
  })

  // Update highlighting when toggle changes
  useEffect(() => {
    if (editor) {
      const hemingwayExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "hemingway"
      )
      if (hemingwayExt) {
        hemingwayExt.options.enabled = editorState.highlighting
        editor.view.dispatch(editor.state.tr)
      }
    }
  }, [editorState.highlighting, editor])

  // Check grammar function
  const checkGrammar = async () => {
    if (!editor || editorState.checkingGrammar) return
    
    // Get text content
    const doc = editor.state.doc
    let text = ""
    doc.descendants((node: any) => {
      if (node.isText) {
        text += node.text + " "
      }
    })
    
    if (text.trim().length < 10) {
      alert("Please write some text before checking grammar")
      return
    }
    
    setEditorState(prev => ({ ...prev, checkingGrammar: true }))
    
    try {
      const response = await fetch("/api/blog/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.details 
          ? `${errorData.error}\n\n${errorData.details}` 
          : errorData.error
        throw new Error(errorMessage || "Failed to check grammar")
      }
      
      const { errors } = await response.json()
      
      // Update the extension with grammar errors
      const hemingwayExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "hemingway"
      )
      if (hemingwayExt) {
        hemingwayExt.storage.grammarErrors = errors
        
        // Trigger decoration update
        const { tr } = editor.state
        tr.setMeta("grammarErrors", errors)
        editor.view.dispatch(tr)
      }
      
      if (errors.length === 0) {
        alert("Great! No spelling or grammar errors found.")
      } else {
        alert(`Found ${errors.length} error${errors.length > 1 ? 's' : ''}. Click on the underlined text to see suggestions.`)
      }
    } catch (error) {
      console.error("Grammar check error:", error)
      alert(error instanceof Error ? error.message : "Failed to check grammar")
    } finally {
      setEditorState(prev => ({ ...prev, checkingGrammar: false }))
    }
  }

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt("Enter image URL:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addImageGallery = () => {
    const url = window.prompt("Enter first image URL:")
    if (url) {
      const caption = window.prompt("Enter caption (optional):") || ""
      editor.chain().focus().setImageGallery([{ src: url, caption, alt: caption }]).run()
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("Enter URL:", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  if (!editable) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-white">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "bg-gray-200" : ""}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? "bg-gray-200" : ""}
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-gray-200" : ""}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-gray-200" : ""}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={editor.isActive("link") ? "bg-gray-200" : ""}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImageGallery}
          title="Add image gallery"
        >
          <Images className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="flex-1"></div>

        {/* AI Review Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={checkGrammar}
          disabled={editorState.checkingGrammar}
          className="gap-2"
        >
          {editorState.checkingGrammar ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Review
            </>
          )}
        </Button>

        {/* Highlighting Toggle */}
        <button
          type="button"
          onClick={() => setEditorState(prev => ({ ...prev, highlighting: !prev.highlighting }))}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors",
            editorState.highlighting
              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
          title="Toggle readability highlighting"
        >
          <span className="font-medium">Highlighting</span>
          <span className={cn(
            "w-9 h-5 rounded-full transition-colors relative",
            editorState.highlighting ? "bg-yellow-500" : "bg-gray-300"
          )}>
            <span className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
              editorState.highlighting ? "left-4" : "left-0.5"
            )}></span>
          </span>
        </button>

      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
