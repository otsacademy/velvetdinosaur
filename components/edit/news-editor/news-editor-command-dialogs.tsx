'use client'

import { AtSign, FileText, Image as ImageIcon, Loader2, MessageSquare, Paperclip, Plus, Smile, Video } from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type MediaPickerMode = 'image' | 'file'

export type MediaAssetItem = {
  key: string
  name?: string
  caption?: string
  alt?: string
  folder?: string
  mime?: string
  size?: number
  width?: number
  height?: number
  createdAt?: string
}

type NewsEditorCommandDialogsProps = {
  slashOpen: boolean
  onSlashOpenChange: (open: boolean) => void
  onRunSlashCommand: (command: string) => void
  mediaPickerOpen: boolean
  onMediaPickerOpenChange: (open: boolean) => void
  mediaPickerMode: MediaPickerMode
  mediaFolder: string
  mediaQuery: string
  onMediaQueryChange: (value: string) => void
  mediaLoading: boolean
  mediaList: MediaAssetItem[]
  onRefreshMedia: () => void
  onSelectMediaItem: (item: MediaAssetItem) => void
  formatAssetLabel: (item: MediaAssetItem) => string
}

export function NewsEditorCommandDialogs({
  slashOpen,
  onSlashOpenChange,
  onRunSlashCommand,
  mediaPickerOpen,
  onMediaPickerOpenChange,
  mediaPickerMode,
  mediaFolder,
  mediaQuery,
  onMediaQueryChange,
  mediaLoading,
  mediaList,
  onRefreshMedia,
  onSelectMediaItem,
  formatAssetLabel,
}: NewsEditorCommandDialogsProps) {
  return (
    <>
      <Dialog open={slashOpen} onOpenChange={onSlashOpenChange}>
        <DialogContent
          className={`
            w-[320px] max-w-[calc(100vw-2rem)] p-0
            rounded-xl border border-border
            shadow-[0_4px_20px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.08)]
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
            data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
            data-[state=open]:duration-120 data-[state=closed]:duration-120
          `}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Slash commands</DialogTitle>
            <DialogDescription>Insert rich elements and media</DialogDescription>
          </DialogHeader>
          <Command
            className={`
              [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1
              [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold
              [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.05em]
              [&_[cmdk-group-heading]]:text-[rgb(140,140,140)]
              [&_[cmdk-item]]:min-h-11 [&_[cmdk-item]]:rounded-md [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-1.5
              [&_[cmdk-item][data-selected=true]]:bg-accent
            `}
          >
            <CommandInput placeholder="Search commands" />
            <CommandList className="max-h-[380px]">
              <CommandEmpty>No commands found.</CommandEmpty>
              <CommandGroup heading="Media">
                <CommandItem onSelect={() => onRunSlashCommand('upload-image')}>
                  <ImageIcon className="h-4 w-4" /> Upload image to R2 (`{mediaFolder}`)
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('pick-image')}>
                  <ImageIcon className="h-4 w-4" /> Insert image from media gallery (`{mediaFolder}`)
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-video')}>
                  <Video className="h-4 w-4" /> Embed video URL (YouTube/Vimeo)
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('upload-file')}>
                  <Paperclip className="h-4 w-4" /> Upload attachment to R2 (`{mediaFolder}`)
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('pick-file')}>
                  <FileText className="h-4 w-4" /> Insert attachment from media gallery (`{mediaFolder}`)
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Structure">
                <CommandItem onSelect={() => onRunSlashCommand('insert-comment')}>
                  <MessageSquare className="h-4 w-4" /> Insert comment block
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-columns-2')}>
                  <Plus className="h-4 w-4" /> Insert 2 columns
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-columns-3')}>
                  <Plus className="h-4 w-4" /> Insert 3 columns
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-divider')}>
                  <Plus className="h-4 w-4" /> Insert divider
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-table')}>
                  <FileText className="h-4 w-4" /> Insert table
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Inline">
                <CommandItem onSelect={() => onRunSlashCommand('insert-mention')}>
                  <AtSign className="h-4 w-4" /> Mention person or page (@)
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-emoji')}>
                  <Smile className="h-4 w-4" /> Insert emoji (:)
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Advanced">
                <CommandItem onSelect={() => onRunSlashCommand('insert-callout')}>
                  <MessageSquare className="h-4 w-4" /> Insert callout
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-code-block')}>
                  <FileText className="h-4 w-4" /> Insert code block
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-date')}>
                  <FileText className="h-4 w-4" /> Insert date
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-equation')}>
                  <FileText className="h-4 w-4" /> Insert equation block
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-inline-equation')}>
                  <FileText className="h-4 w-4" /> Insert inline equation
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-toc')}>
                  <FileText className="h-4 w-4" /> Insert table of contents
                </CommandItem>
                <CommandItem onSelect={() => onRunSlashCommand('insert-toggle')}>
                  <Plus className="h-4 w-4" /> Insert toggle section
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <Dialog open={mediaPickerOpen} onOpenChange={onMediaPickerOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {mediaPickerMode === 'image' ? `Insert image from ${mediaFolder} folder` : `Insert file from ${mediaFolder} folder`}
            </DialogTitle>
            <DialogDescription>
              Assets shown here are from Cloudflare R2 folder <code>{mediaFolder}</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search assets by name, caption, or key"
              value={mediaQuery}
              onChange={(event) => onMediaQueryChange(event.target.value)}
            />

            <div className="max-h-[50vh] space-y-2 overflow-auto rounded-lg border border-border/60 p-2">
              {mediaLoading ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading assets...
                </div>
              ) : mediaList.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">No matching assets in the {mediaFolder} folder.</p>
              ) : (
                mediaList.map((item) => {
                  const label = formatAssetLabel(item)

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className="flex w-full items-center justify-between rounded-md border border-border/50 px-3 py-2 text-left hover:bg-muted"
                      onClick={() => onSelectMediaItem(item)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{label}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.key}</p>
                      </div>
                      <span className="ml-4 text-xs text-muted-foreground">{item.mime || 'unknown'}</span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md border border-border/60 px-3 text-sm hover:bg-muted"
                onClick={onRefreshMedia}
                disabled={mediaLoading}
              >
                Refresh
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted"
                onClick={() => onMediaPickerOpenChange(false)}
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
