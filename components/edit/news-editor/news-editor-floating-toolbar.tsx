'use client'

import { type ReactNode } from 'react'
import { flip, offset, shift, useFloatingToolbar, useFloatingToolbarState } from '@platejs/floating'
import { toggleList } from '@platejs/list'
import { insertInlineEquation } from '@platejs/math'
import {
  Bold,
  Code2,
  Ellipsis,
  Italic,
  Link2,
  List,
  ListOrdered,
  MessageSquarePlus,
  Palette,
  Pilcrow,
  Sigma,
  Sparkles,
  Strikethrough,
  Type,
  Underline,
} from 'lucide-react'
import { KEYS } from 'platejs'
import {
  useEditorReadOnly,
  useEditorRef,
  useEventEditorValue,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
} from 'platejs/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NewsEditorLinkPopoverButton } from '@/components/edit/news-editor/news-editor-link-popover'
import { cn } from '@/lib/utils'

const buttonClass =
  'inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-md px-2 text-[rgb(94,99,111)] transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--accent)] hover:text-[rgb(21,26,38)] data-[state=on]:bg-[var(--accent)] data-[state=on]:text-[var(--primary)]'

type NewsEditorFloatingToolbarProps = {
  onOpenMagic?: () => void
  onInsertComment?: () => void
}

type MarkButtonProps = {
  nodeType: string
  label: string
  children: ReactNode
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={buttonClass}
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function MarkButton({ nodeType, label, children }: MarkButtonProps) {
  const editor = useEditorRef()
  const state = useMarkToolbarButtonState({ nodeType })
  const { props } = useMarkToolbarButton(state)
  const active = Boolean((props as { pressed?: boolean }).pressed)

  return (
    <button
      type="button"
      className={buttonClass}
      data-state={active ? 'on' : 'off'}
      title={label}
      aria-label={label}
      onMouseDown={(event) => {
        event.preventDefault()
        props.onMouseDown?.(event as never)
      }}
      onClick={() => {
        props.onClick?.()
        editor.tf.focus()
      }}
    >
      {children}
    </button>
  )
}

function LinkButton() {
  return (
    <NewsEditorLinkPopoverButton className={buttonClass} insertLabel="Insert link">
      <Link2 className="h-4 w-4" />
    </NewsEditorLinkPopoverButton>
  )
}

function TurnIntoButton() {
  const editor = useEditorRef()

  const setBlockType = (nodeType: string) => {
    editor.tf.setNodes({ type: nodeType as never })
    editor.tf.focus()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(buttonClass, 'w-auto gap-1 px-2.5')}
          title="Turn into"
          aria-label="Turn into"
          onMouseDown={(event) => event.preventDefault()}
        >
          <Type className="h-4 w-4" />
          <span className="hidden text-xs sm:inline">Turn into</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onSelect={() => setBlockType(KEYS.p)}>
          <Pilcrow className="h-4 w-4" />
          Paragraph
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setBlockType(KEYS.h1)}>Heading 1</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setBlockType(KEYS.h2)}>Heading 2</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setBlockType(KEYS.h3)}>Heading 3</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setBlockType(KEYS.blockquote)}>Quote</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NewsEditorFloatingToolbar({
  onOpenMagic,
  onInsertComment,
}: NewsEditorFloatingToolbarProps = {}) {
  const editor = useEditorRef()
  const readOnly = useEditorReadOnly()
  const focusedEditorId = useEventEditorValue('focus')

  const state = useFloatingToolbarState({
    editorId: editor.id,
    focusedEditorId,
    floatingOptions: {
      placement: 'top-start',
      middleware: [
        offset({ mainAxis: 12, crossAxis: -18 }),
        shift({ padding: 20 }),
        flip({
          padding: 12,
          fallbackPlacements: ['top-end', 'bottom-start', 'bottom-end'],
        }),
      ],
    },
  })

  const { hidden, props, ref, clickOutsideRef } = useFloatingToolbar(state)

  if (readOnly || hidden) return null

  return (
    <div ref={clickOutsideRef}>
      <div
        ref={ref}
        {...props}
        className={cn(
          'news-editor-floating-toolbar absolute z-50',
          'flex items-center gap-0.5 whitespace-nowrap rounded-[8px] bg-white p-1',
          'shadow-[0_2px_8px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.08)]',
        )}
      >
        <ActionButton label="AI prompt" onClick={() => onOpenMagic?.()}>
          <Sparkles className="h-4 w-4" />
        </ActionButton>
        <ActionButton label="Comment" onClick={() => onInsertComment?.()}>
          <MessageSquarePlus className="h-4 w-4" />
        </ActionButton>
        <TurnIntoButton />
        <MarkButton nodeType={KEYS.bold} label="Bold (Cmd/Ctrl+B)">
          <Bold className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.italic} label="Italic (Cmd/Ctrl+I)">
          <Italic className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.underline} label="Underline (Cmd/Ctrl+U)">
          <Underline className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.strikethrough} label="Strikethrough (Cmd/Ctrl+Shift+X)">
          <Strikethrough className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.code} label="Code (Cmd/Ctrl+E)">
          <Code2 className="h-4 w-4" />
        </MarkButton>
        <ActionButton
          label="Equation"
          onClick={() => {
            insertInlineEquation(editor)
            editor.tf.focus()
          }}
        >
          <Sigma className="h-4 w-4" />
        </ActionButton>
        <LinkButton />
        <MarkButton nodeType={KEYS.highlight} label="Color highlight">
          <Palette className="h-4 w-4" />
        </MarkButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={buttonClass} aria-label="More formatting" onMouseDown={(event) => event.preventDefault()}>
              <Ellipsis className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                toggleList(editor, { listStyleType: KEYS.ul })
                editor.tf.focus()
              }}
            >
              <List className="h-4 w-4" />
              Bulleted list
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                toggleList(editor, { listStyleType: KEYS.ol })
                editor.tf.focus()
              }}
            >
              <ListOrdered className="h-4 w-4" />
              Numbered list
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                editor.tf.setNodes({ type: KEYS.p as never })
                editor.tf.focus()
              }}
            >
              Clear block style
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
