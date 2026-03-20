'use client'

/* eslint-disable @next/next/no-img-element -- editor uses dynamic media URLs from R2 */

import { useCallback } from 'react'
import type { PlateElementProps } from 'platejs/react'
import { useEditorRef } from 'platejs/react'
import { Input } from '@/components/ui/input'

type ImgElementData = {
  url?: string
  src?: string
  image?: string
  imageUrl?: string
  href?: string
  uri?: string
  alt?: string
  caption?: string
  children?: Array<{ text?: string }>
}

export function NewsEditorImageElement({ attributes, children, element }: PlateElementProps) {
  const editor = useEditorRef()
  const media = element as ImgElementData
  const childImageText = Array.isArray(media.children)
    ? media.children
        .map((child) => (typeof child?.text === 'string' ? child.text : ''))
        .find((text) => /^https?:\/\/|^\/(images|api|media|uploads)\//.test((text || '').trim()) || /^data:image\//.test((text || '').trim()))
        ?.trim()
    : ''
  const src =
    media.url ||
    media.src ||
    media.image ||
    media.imageUrl ||
    media.href ||
    media.uri ||
    childImageText ||
    ''
  const alt = media.alt || media.caption || 'Article image'
  const caption = typeof media.caption === 'string' ? media.caption : ''

  const updateCaption = useCallback(
    (value: string) => {
      const path = editor.api.findPath(element)
      if (!path) return
      editor.tf.setNodes({ caption: value === '' ? undefined : value }, { at: path })
    },
    [editor, element],
  )

  return (
    <div {...attributes}>
      <div contentEditable={false} className="my-4">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="max-h-[460px] w-full rounded-lg border border-border object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Image URL missing
          </div>
        )}
        <div className="mt-2">
          <Input
            value={caption}
            onChange={(event) => updateCaption(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Add image caption..."
            className="h-9 border-border/70 bg-muted/20 text-sm placeholder:text-muted-foreground/85 hover:bg-muted/35"
          />
        </div>
      </div>
      {children}
    </div>
  )
}
