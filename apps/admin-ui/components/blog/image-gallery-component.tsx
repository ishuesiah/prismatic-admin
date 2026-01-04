"use client"

import React from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

export default function ImageGalleryComponent({
  node,
  updateAttributes,
  deleteNode
}: NodeViewProps) {
  const images = (node.attrs.images || []) as Array<{ src: string; alt?: string; caption?: string }>
  const layout = (node.attrs.layout || 'grid') as 'grid' | 'carousel' | 'masonry'
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    if (newImages.length === 0) {
      deleteNode()
    } else {
      updateAttributes({ images: newImages })
    }
  }

  const handleAddImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      const caption = window.prompt('Enter caption (optional):') || ''
      updateAttributes({ 
        images: [...images, { src: url, caption, alt: caption }]
      })
    }
  }

  const handleLayoutChange = (newLayout: string) => {
    updateAttributes({ layout: newLayout })
  }

  if (images.length === 0) {
    return (
      <NodeViewWrapper>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No images in gallery</p>
          <button
            onClick={handleAddImage}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add First Image
          </button>
        </div>
      </NodeViewWrapper>
    )
  }

  const layoutClasses = {
    grid: 'grid grid-cols-2 md:grid-cols-3 gap-4',
    carousel: 'flex overflow-x-auto gap-4 pb-4',
    masonry: 'columns-2 md:columns-3 gap-4'
  }

  return (
    <NodeViewWrapper>
      <div className="my-6 p-4 border rounded-lg bg-gray-50">
        {/* Gallery Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Gallery Layout:</span>
            <select
              value={layout}
              onChange={(e) => handleLayoutChange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
              <option value="masonry">Masonry</option>
            </select>
          </div>
          <button
            onClick={handleAddImage}
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Image
          </button>
        </div>

        {/* Images Display */}
        <div className={layoutClasses[layout as keyof typeof layoutClasses]}>
          {images.map((image: any, index: number) => (
            <div 
              key={index} 
              className={`relative group ${layout === 'masonry' ? 'break-inside-avoid mb-4' : ''}`}
            >
              <img
                src={image.src}
                alt={image.alt || `Gallery image ${index + 1}`}
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.png'
                }}
              />
              {image.caption && (
                <p className="text-sm text-gray-600 mt-2 text-center">{image.caption}</p>
              )}
              
              {/* Remove button */}
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                         bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  )
}
