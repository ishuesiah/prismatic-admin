import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ImageGalleryComponent from './image-gallery-component'

export interface ImageGalleryOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageGallery: {
      setImageGallery: (images: { src: string; alt?: string; caption?: string }[]) => ReturnType
      updateImageGallery: (images: { src: string; alt?: string; caption?: string }[]) => ReturnType
    }
  }
}

export const ImageGallery = Node.create<ImageGalleryOptions>({
  name: 'imageGallery',

  group: 'block',

  content: '',

  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: element => {
          const images = element.getAttribute('data-images')
          return images ? JSON.parse(images) : []
        },
        renderHTML: attributes => {
          return {
            'data-images': JSON.stringify(attributes.images || [])
          }
        }
      },
      layout: {
        default: 'grid',
        parseHTML: element => element.getAttribute('data-layout') || 'grid',
        renderHTML: attributes => {
          return {
            'data-layout': attributes.layout
          }
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-gallery"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(
      this.options.HTMLAttributes,
      HTMLAttributes,
      { 'data-type': 'image-gallery' }
    )]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGalleryComponent)
  },

  addCommands() {
    return {
      setImageGallery: (images) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { images },
        })
      },
      updateImageGallery: (images) => ({ commands, editor }) => {
        const { selection } = editor.state
        const node = editor.state.doc.nodeAt(selection.from)
        
        if (node && node.type.name === this.name) {
          return commands.updateAttributes(this.name, { images })
        }
        
        return false
      },
    }
  },
})
