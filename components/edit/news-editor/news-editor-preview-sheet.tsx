'use client'

import Link from 'next/link'
import { ExternalLink, RefreshCw } from 'lucide-react'

import { PreviewViewportShell } from '@/components/edit/preview-viewport-shell.client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type NewsPreviewMode = 'draft' | 'live'

type NewsEditorPreviewSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug: string | null
  previewMode: NewsPreviewMode
  onPreviewModeChange: (mode: NewsPreviewMode) => void
  canViewLive: boolean
  refreshToken: number
  onRefresh: () => void
}

export function NewsEditorPreviewSheet({
  open,
  onOpenChange,
  slug,
  previewMode,
  onPreviewModeChange,
  canViewLive,
  refreshToken,
  onRefresh,
}: NewsEditorPreviewSheetProps) {
  const draftHref = slug ? `/preview/news/${encodeURIComponent(slug)}` : ''
  const liveHref = slug ? `/news/${encodeURIComponent(slug)}` : ''
  const iframeSrc = slug ? (previewMode === 'live' ? liveHref : draftHref) : ''
  const iframeKey = slug ? `${slug}-${previewMode}-${refreshToken}` : 'news-preview-empty'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] lg:max-w-[760px]">
        <SheetHeader>
          <SheetTitle>{slug ? `Previewing /news/${slug}` : 'Preview'}</SheetTitle>
          <SheetDescription>
            Draft preview shows the latest saved draft. Save to include unsaved edits.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <Tabs value={previewMode} onValueChange={(value) => onPreviewModeChange(value as NewsPreviewMode)}>
            <TabsList className="h-auto w-fit justify-start gap-2 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="draft"
                className="rounded-none border-b-2 border-b-transparent px-2 py-1.5 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
              >
                Draft
              </TabsTrigger>
              <TabsTrigger
                value="live"
                disabled={!canViewLive}
                className="rounded-none border-b-2 border-b-transparent px-2 py-1.5 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
              >
                Live
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!slug} onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh preview
            </Button>
            {slug ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={iframeSrc} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 px-4 pb-4">
          <PreviewViewportShell showControls label="Preview size">
            {slug && open ? (
              <div className="h-[calc(100vh-340px)] min-h-[320px] rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]">
                <iframe key={iframeKey} title={`News preview ${slug}`} src={iframeSrc} className="h-full w-full bg-[var(--vd-bg)]" />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--vd-muted-fg)]">
                Enter a title to generate a preview slug.
              </div>
            )}
          </PreviewViewportShell>
        </div>
      </SheetContent>
    </Sheet>
  )
}
