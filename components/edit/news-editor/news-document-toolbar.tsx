'use client'

import {
  BlockquotePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
} from '@platejs/basic-nodes/react'
import { setAlign } from '@platejs/basic-styles'
import { insertCallout } from '@platejs/callout'
import { insertCodeBlock } from '@platejs/code-block'
import { insertDate } from '@platejs/date'
import { useIndentButton, useOutdentButton } from '@platejs/indent/react'
import { insertColumnGroup } from '@platejs/layout'
import { toggleList } from '@platejs/list'
import { insertTable } from '@platejs/table'
import { insertToc } from '@platejs/toc'
import { KEYS } from 'platejs'
import {
  useEditorRef,
  useEditorSelector,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
  useSelectionFragmentProp,
} from 'platejs/react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AtSign,
  Bold,
  ChevronDown,
  Code,
  Highlighter,
  ListIndentDecrease,
  ListIndentIncrease,
  Loader2,
  Italic,
  Link2,
  List as ListIcon,
  ListOrdered,
  Paperclip,
  Plus,
  Redo,
  Strikethrough,
  Underline,
  Video,
  Image as ImageIcon,
  Smile,
  Sparkles,
  Undo,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSeparator,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { NewsEditorLinkPopoverButton } from '@/components/edit/news-editor/news-editor-link-popover'
export { NEWS_EDITOR_PLUGINS } from '@/components/edit/news-editor/news-editor-plugins'

const toolbarButtonClass =
  'inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-[6px] px-2 text-[rgb(94,99,111)] transition-[background-color,color] duration-120 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--accent)] hover:text-[rgb(21,26,38)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=on]:bg-[var(--accent)] data-[state=on]:text-[var(--primary)]'

export type NewsMagicMode =
  | 'fix'
  | 'shorten'
  | 'expand'
  | 'tone:professional'
  | 'tone:friendly'
  | 'tone:neutral'

type NewsMagicButtonState = {
  isMagicConfigured: boolean
  magicEnvVar?: string
  magicBusy?: boolean
  onMagic?: (mode: NewsMagicMode) => void | Promise<void>
  canUndoMagic?: boolean
  onUndoMagic?: () => void
  isUndoBusy?: boolean
}
export type NewsDocumentToolbarProps = NewsMagicButtonState & {
  disabled?: boolean
  onInsertImage?: () => void
  onInsertVideo?: () => void
  onInsertFile?: () => void
}

type ToolbarButtonProps = {
  active?: boolean
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function EditorToolbarButton({ active = false, label, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={toolbarButtonClass}
      data-state={active ? 'on' : 'off'}
      disabled={disabled}
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-disabled={disabled ? 'true' : undefined}
    >
      {children}
    </button>
  )
}

type MarkButtonProps = {
  nodeType: string
  label: string
  children: React.ReactNode
}

function MarkButton({ nodeType, label, children }: MarkButtonProps) {
  const editor = useEditorRef()
  const state = useMarkToolbarButtonState({ nodeType })
  const { props } = useMarkToolbarButton(state)
  const active = Boolean((props as { pressed?: boolean }).pressed)

  return (
    <button
      type="button"
      className={toolbarButtonClass}
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
    <NewsEditorLinkPopoverButton
      className={toolbarButtonClass}
      insertLabel="Insert link (Cmd/Ctrl+Shift+K)"
    >
      <Link2 className="h-4 w-4" />
    </NewsEditorLinkPopoverButton>
  )
}

function BlockTypeMenu({
  activeBlock,
  onSetParagraph,
  onSetH1,
  onSetH2,
  onSetH3,
  onSetQuote,
}: {
  activeBlock: string
  onSetParagraph: () => void
  onSetH1: () => void
  onSetH2: () => void
  onSetH3: () => void
  onSetQuote: () => void
}) {
  const label =
    activeBlock === KEYS.h1
      ? 'Heading 1'
      : activeBlock === KEYS.h2
        ? 'Heading 2'
        : activeBlock === KEYS.h3
          ? 'Heading 3'
          : activeBlock === KEYS.blockquote
            ? 'Quote'
            : 'Paragraph'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-[30px] items-center gap-1 rounded-[6px] border border-border/60 px-2 text-sm text-[rgb(94,99,111)] transition-[background-color,color] duration-120 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--accent)] hover:text-[rgb(21,26,38)]"
          aria-label="Change block type"
          onMouseDown={(event) => event.preventDefault()}
        >
          <span>{label}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            onSetParagraph()
          }}
        >
          Paragraph
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            onSetH1()
          }}
        >
          Heading 1
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            onSetH2()
          }}
        >
          Heading 2
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            onSetH3()
          }}
        >
          Heading 3
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            onSetQuote()
          }}
        >
          Quote
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FontSizeMenu({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const label = value || '16px'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-[30px] items-center gap-1 rounded-[6px] border border-border/60 px-2 text-xs font-medium text-[rgb(94,99,111)] transition-[background-color,color] duration-120 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--accent)] hover:text-[rgb(21,26,38)]"
          aria-label="Font size"
          onMouseDown={(event) => event.preventDefault()}
        >
          <span>{label}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        <DropdownMenuRadioGroup value={value || '16px'} onValueChange={onChange}>
          <DropdownMenuRadioItem value="14px">Small (14px)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="16px">Normal (16px)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="18px">Large (18px)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="20px">XL (20px)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NewsDocumentToolbar({
  isMagicConfigured = false,
  magicEnvVar = 'OPENAI_API_KEY',
  magicBusy = false,
  onMagic,
  canUndoMagic = false,
  onUndoMagic,
  isUndoBusy = false,
  disabled = false,
  onInsertImage,
  onInsertVideo,
  onInsertFile,
}: NewsDocumentToolbarProps) {
  const editor = useEditorRef()

  const activeBlock = useEditorSelector((e) => {
    if (
      e.api.some({
        match: (node) => (node as { type?: string }).type === KEYS.h1,
      })
    ) {
      return KEYS.h1
    }

    if (
      e.api.some({
        match: (node) => (node as { type?: string }).type === KEYS.h2,
      })
    ) {
      return KEYS.h2
    }

    if (
      e.api.some({
        match: (node) => (node as { type?: string }).type === KEYS.h3,
      })
    ) {
      return KEYS.h3
    }

    if (
      e.api.some({
        match: (node) => (node as { type?: string }).type === KEYS.blockquote,
      })
    ) {
      return KEYS.blockquote
    }

    return KEYS.p
  }, [])

  const isBulletList = useEditorSelector(
    (e) =>
      e.api.some({
        match: (node) => (node as { listStyleType?: string }).listStyleType === KEYS.ul,
      }),
    [],
  )

  const isNumberedList = useEditorSelector(
    (e) =>
      e.api.some({
        match: (node) => (node as { listStyleType?: string }).listStyleType === KEYS.ol,
      }),
    [],
  )

  const activeFontSize = useSelectionFragmentProp({
    key: 'fontSize',
    defaultValue: '16px',
    mode: 'text',
  })

  const activeAlign = useEditorSelector((e) => {
    const blockEntry = e.api.block()
    const block = blockEntry?.[0] as { align?: string; textAlign?: string } | undefined
    const raw = block?.align || block?.textAlign || 'left'
    if (raw === 'start') return 'left'
    if (raw === 'end') return 'right'
    return raw
  }, [])

  const indentButton = useIndentButton()
  const outdentButton = useOutdentButton()

  const requestMagic = (mode: NewsMagicMode) => {
    if (!onMagic || magicBusy || !isMagicConfigured) return
    void onMagic(mode)
  }

  const magicTooltipText = isMagicConfigured
    ? 'Rewrite selected text, current block, or full document'
    : `Set ${magicEnvVar} to enable`

  return (
    <div
      className={cn(
        'sticky top-[88px] z-20 border-b border-border/60 bg-white/95 px-2 py-1.5 shadow-[0_1px_0_rgba(0,0,0,0.06),0_8px_18px_-16px_rgba(0,0,0,0.45)] backdrop-blur supports-[backdrop-filter]:bg-white/85',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <div className="mx-auto flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap pb-0.5 [&>*]:shrink-0">
        <div className="flex items-center gap-1 rounded-md bg-muted/25 p-0.5">
          <EditorToolbarButton
            label="Undo (Cmd/Ctrl+Z)"
            onClick={() => {
              editor.tf.undo()
              editor.tf.focus()
            }}
          >
            <Undo className="h-4 w-4" />
          </EditorToolbarButton>
          <EditorToolbarButton
            label="Redo (Cmd/Ctrl+Shift+Z)"
            onClick={() => {
              editor.tf.redo()
              editor.tf.focus()
            }}
          >
            <Redo className="h-4 w-4" />
          </EditorToolbarButton>
        </div>

        <Separator orientation="vertical" className="mx-2 h-5" />

        <BlockTypeMenu
          activeBlock={activeBlock}
          onSetParagraph={() => {
            editor.tf.setNodes({ type: KEYS.p })
            editor.tf.focus()
          }}
          onSetH1={() => {
            ;((editor.getApi(H1Plugin) as { h1?: { toggle?: () => void } }).h1?.toggle ?? (() => undefined))()
            editor.tf.focus()
          }}
          onSetH2={() => {
            ;((editor.getApi(H2Plugin) as { h2?: { toggle?: () => void } }).h2?.toggle ?? (() => undefined))()
            editor.tf.focus()
          }}
          onSetH3={() => {
            ;((editor.getApi(H3Plugin) as { h3?: { toggle?: () => void } }).h3?.toggle ?? (() => undefined))()
            editor.tf.focus()
          }}
          onSetQuote={() => {
            ;((editor.getApi(BlockquotePlugin) as { blockquote?: { toggle?: () => void } }).blockquote?.toggle ??
              (() => undefined))()
            editor.tf.focus()
          }}
        />

        <FontSizeMenu
          value={activeFontSize || '16px'}
          onChange={(value) => {
            editor.tf.addMarks({ fontSize: value })
            editor.tf.focus()
          }}
        />

        <Separator orientation="vertical" className="mx-2 h-5" />

        <div className="flex items-center gap-1 rounded-md bg-muted/25 p-0.5">
          <MarkButton nodeType="bold" label="Bold (Cmd/Ctrl+B)">
            <Bold className="h-4 w-4" />
          </MarkButton>
          <MarkButton nodeType="italic" label="Italic (Cmd/Ctrl+I)">
            <Italic className="h-4 w-4" />
          </MarkButton>
          <MarkButton nodeType="underline" label="Underline (Cmd/Ctrl+U)">
            <Underline className="h-4 w-4" />
          </MarkButton>
          <MarkButton nodeType="strikethrough" label="Strikethrough (Cmd/Ctrl+Shift+X)">
            <Strikethrough className="h-4 w-4" />
          </MarkButton>
          <MarkButton nodeType="code" label="Code (Cmd/Ctrl+E)">
            <Code className="h-4 w-4" />
          </MarkButton>
          <MarkButton nodeType="highlight" label="Highlight">
            <Highlighter className="h-4 w-4" />
          </MarkButton>
          <LinkButton />
          <EditorToolbarButton
            label="Mention (@)"
            onClick={() => {
              editor.tf.insertText('@')
              editor.tf.focus()
            }}
          >
            <AtSign className="h-4 w-4" />
          </EditorToolbarButton>
          <EditorToolbarButton
            label="Emoji (:)"
            onClick={() => {
              editor.tf.insertText(':')
              editor.tf.focus()
            }}
          >
            <Smile className="h-4 w-4" />
          </EditorToolbarButton>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-muted/25 p-0.5">
          <EditorToolbarButton
            active={activeAlign === 'left'}
            label="Align left"
            onClick={() => {
              setAlign(editor, 'left')
              editor.tf.focus()
            }}
          >
            <AlignLeft className="h-4 w-4" />
          </EditorToolbarButton>
          <EditorToolbarButton
            active={activeAlign === 'center'}
            label="Align center"
            onClick={() => {
              setAlign(editor, 'center')
              editor.tf.focus()
            }}
          >
            <AlignCenter className="h-4 w-4" />
          </EditorToolbarButton>
          <EditorToolbarButton
            active={activeAlign === 'right'}
            label="Align right"
            onClick={() => {
              setAlign(editor, 'right')
              editor.tf.focus()
            }}
          >
            <AlignRight className="h-4 w-4" />
          </EditorToolbarButton>
          <EditorToolbarButton
            active={activeAlign === 'justify'}
            label="Justify"
            onClick={() => {
              setAlign(editor, 'justify')
              editor.tf.focus()
            }}
          >
            <AlignJustify className="h-4 w-4" />
          </EditorToolbarButton>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-muted/25 p-0.5">
          <EditorToolbarButton
            active={isBulletList}
            label="Bulleted list (Cmd/Ctrl+Shift+8)"
            onClick={() => {
              toggleList(editor, { listStyleType: KEYS.ul })
              editor.tf.focus()
            }}
          >
            <ListIcon className="h-4 w-4" />
          </EditorToolbarButton>

          <EditorToolbarButton
            active={isNumberedList}
            label="Numbered list (Cmd/Ctrl+Shift+7)"
            onClick={() => {
              toggleList(editor, { listStyleType: KEYS.ol })
              editor.tf.focus()
            }}
          >
            <ListOrdered className="h-4 w-4" />
          </EditorToolbarButton>
          <EditorToolbarButton
            label="Decrease indent"
            onClick={() => {
              outdentButton.props.onClick()
              editor.tf.focus()
            }}
          >
            <ListIndentDecrease className="h-4 w-4" />
          </EditorToolbarButton>
          <EditorToolbarButton
            label="Increase indent"
            onClick={() => {
              indentButton.props.onClick()
              editor.tf.focus()
            }}
          >
            <ListIndentIncrease className="h-4 w-4" />
          </EditorToolbarButton>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-muted/25 p-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-[30px] items-center gap-1 rounded-[6px] border border-border/60 px-2 text-sm text-[rgb(94,99,111)] transition-[background-color,color] duration-120 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--accent)] hover:text-[rgb(21,26,38)]"
                aria-label="Insert commands"
                onMouseDown={(event) => event.preventDefault()}
              >
                <Plus className="h-4 w-4" />
                <span>Insert</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  onInsertImage?.()
                }}
                disabled={disabled || !onInsertImage}
              >
                <ImageIcon className="h-4 w-4" />
                Add image
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  onInsertVideo?.()
                }}
                disabled={disabled || !onInsertVideo}
              >
                <Video className="h-4 w-4" />
                Add video
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  onInsertFile?.()
                }}
                disabled={disabled || !onInsertFile}
              >
                <Paperclip className="h-4 w-4" />
                Add file
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  editor.tf.insertText('@')
                  editor.tf.focus()
                }}
              >
                <AtSign className="h-4 w-4" />
                Mention
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  editor.tf.insertText(':')
                  editor.tf.focus()
                }}
              >
                <Smile className="h-4 w-4" />
                Emoji
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  editor.tf.insertNodes({ type: KEYS.hr, children: [{ text: '' }] } as never)
                  editor.tf.focus()
                }}
              >
                Insert divider
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  insertTable(editor, { colCount: 3, rowCount: 3, header: true })
                  editor.tf.focus()
                }}
              >
                Insert table
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  toggleList(editor, { listStyleType: KEYS.ul })
                  editor.tf.focus()
                }}
              >
                Bulleted list
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  toggleList(editor, { listStyleType: KEYS.ol })
                  editor.tf.focus()
                }}
              >
                Numbered list
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  insertColumnGroup(editor, { columns: 2, select: true })
                  editor.tf.focus()
                }}
              >
                Insert 2 columns
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  insertColumnGroup(editor, { columns: 3, select: true })
                  editor.tf.focus()
                }}
              >
                Insert 3 columns
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  insertCallout(editor, { select: true })
                  editor.tf.focus()
                }}
              >
                Insert callout
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  insertCodeBlock(editor, { select: true })
                  editor.tf.focus()
                }}
              >
                Insert code block
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  insertDate(editor, { select: true })
                  editor.tf.focus()
                }}
              >
                Insert date
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  insertToc(editor, { select: true })
                  editor.tf.focus()
                }}
              >
                Insert table of contents
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  editor.tf.insertNodes(
                    {
                      type: KEYS.toggle,
                      children: [{ text: 'Toggle section title' }],
                    } as never,
                    { select: true },
                  )
                  editor.tf.focus()
                }}
              >
                Insert toggle section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="mx-2 h-5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-[30px] items-center gap-1 rounded-[6px] border border-border/60 px-2 text-sm text-[rgb(94,99,111)] transition-[background-color,color] duration-120 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--accent)] hover:text-[rgb(21,26,38)] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Magic"
                    onMouseDown={(event) => event.preventDefault()}
                    disabled={disabled || !isMagicConfigured || magicBusy}
                  >
                    {magicBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>Magic</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Magic rewrite</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      requestMagic('fix')
                    }}
                    disabled={disabled || !isMagicConfigured || magicBusy}
                  >
                    Fix grammar/spelling
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      requestMagic('shorten')
                    }}
                    disabled={disabled || !isMagicConfigured || magicBusy}
                  >
                    Shorten
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      requestMagic('expand')
                    }}
                    disabled={disabled || !isMagicConfigured || magicBusy}
                  >
                    Expand
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Tone</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault()
                          requestMagic('tone:professional')
                        }}
                        disabled={disabled || !isMagicConfigured || magicBusy}
                      >
                        Professional
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault()
                          requestMagic('tone:friendly')
                        }}
                        disabled={disabled || !isMagicConfigured || magicBusy}
                      >
                        Friendly
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault()
                          requestMagic('tone:neutral')
                        }}
                        disabled={disabled || !isMagicConfigured || magicBusy}
                      >
                        Neutral
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </TooltipTrigger>
          <TooltipContent>{magicTooltipText}</TooltipContent>
        </Tooltip>

        {canUndoMagic ? (
          <div className="ml-1">
            <EditorToolbarButton
              label="Undo magic"
              onClick={() => {
                onUndoMagic?.()
              }}
              disabled={disabled || isUndoBusy || !onUndoMagic}
            >
              <Undo className="h-4 w-4" />
            </EditorToolbarButton>
          </div>
        ) : null}
      </div>
    </div>
  )
}
