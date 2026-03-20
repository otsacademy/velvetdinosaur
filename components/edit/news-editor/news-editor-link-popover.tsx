'use client'

import { useCallback, useRef, useState } from 'react'
import { unwrapLink, upsertLink } from '@platejs/link'
import { LinkPlugin } from '@platejs/link/react'
import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react'
import { useEditorRef } from 'platejs/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { extractTextFromPlateNode } from '@/components/edit/news-editor/news-editor-media-utils'

type LinkElementNode = {
  type?: string
  url?: string
  children?: unknown
}

type NewsEditorLinkPopoverButtonProps = {
  className: string
  children: React.ReactNode
  disabled?: boolean
  insertLabel: string
}

function cloneSelection(value: unknown) {
  if (!value) return null
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

export function NewsEditorLinkPopoverButton({
  className,
  children,
  disabled = false,
  insertLabel,
}: NewsEditorLinkPopoverButtonProps) {
  const editor = useEditorRef()
  const state = useLinkToolbarButtonState()
  const { props } = useLinkToolbarButton(state)
  const active = Boolean((props as { pressed?: boolean }).pressed)
  const [open, setOpen] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('https://')
  const selectionRef = useRef<unknown>(null)
  const linkNodeRef = useRef<LinkElementNode | null>(null)

  const syncFormStateFromSelection = useCallback(() => {
    const currentLink = editor.api.above({
      match: (node) => node.type === LinkPlugin.key,
    })
    const currentLinkNode = (currentLink?.[0] || null) as LinkElementNode | null
    const selectedFragment = editor.selection ? editor.api.fragment(editor.selection) : null
    const selectedText = extractTextFromPlateNode(selectedFragment).replace(/\s+/g, ' ').trim()
    const existingText = extractTextFromPlateNode(currentLinkNode?.children).replace(/\s+/g, ' ').trim()
    const existingUrl = typeof currentLinkNode?.url === 'string' ? currentLinkNode.url.trim() : ''

    selectionRef.current = cloneSelection(editor.selection)
    linkNodeRef.current = currentLinkNode
    setLinkText(existingText || selectedText)
    setLinkUrl(existingUrl || 'https://')
  }, [editor])

  const restoreLinkSelection = useCallback(() => {
    if (linkNodeRef.current) {
      editor.tf.select(linkNodeRef.current as never)
      return
    }
    if (selectionRef.current) {
      editor.tf.select(selectionRef.current as never)
    }
  }, [editor])

  const handleApplyLink = useCallback(() => {
    const url = linkUrl.trim()
    if (!url) return

    restoreLinkSelection()
    upsertLink(editor, {
      url,
      text: linkText.trim() || url,
      target: '_blank',
    })

    setOpen(false)
    editor.tf.focus()
  }, [editor, linkText, linkUrl, restoreLinkSelection])

  const handleRemoveLink = useCallback(() => {
    restoreLinkSelection()
    unwrapLink(editor, { split: true })
    setOpen(false)
    editor.tf.focus()
  }, [editor, restoreLinkSelection])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled) return
        if (nextOpen) {
          syncFormStateFromSelection()
        }
        setOpen(nextOpen)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={className}
          data-state={active ? 'on' : 'off'}
          title={active ? 'Edit link' : insertLabel}
          aria-label={active ? 'Edit link' : insertLabel}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
        >
          {children}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[340px] space-y-3"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          editor.tf.focus()
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="news-link-text">Text</Label>
          <Input
            id="news-link-text"
            value={linkText}
            onChange={(event) => setLinkText(event.target.value)}
            placeholder="Link text"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="news-link-url">Link</Label>
          <Input
            id="news-link-url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com"
            autoFocus
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              handleApplyLink()
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {active ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLink}>
              Remove link
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Selected text stays in place unless you change it here.
            </span>
          )}

          <Button type="button" size="sm" onClick={handleApplyLink} disabled={!linkUrl.trim()}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
