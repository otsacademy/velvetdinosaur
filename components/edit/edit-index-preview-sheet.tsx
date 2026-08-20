import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PageRow } from '@/components/edit/pages-index-types';
import { PreviewViewportShell } from './preview-viewport-shell.client';

type PreviewMode = 'draft' | 'live';

type EditIndexPreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewSlug: string | null;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  activePage: PageRow | null;
  previewHref: string;
  liveHref: string;
};

export function EditIndexPreviewSheet({
  open,
  onOpenChange,
  previewSlug,
  previewMode,
  onPreviewModeChange,
  activePage,
  previewHref,
  liveHref
}: EditIndexPreviewSheetProps) {
  const iframeSrc = previewSlug
    ? previewMode === 'draft'
      ? previewHref
      : liveHref
    : '';
  const iframeKey = previewSlug ? `${previewSlug}-${previewMode}` : 'empty';
  const canOpen = Boolean(previewSlug);
  const canViewLive = Boolean(activePage?.publishedAt);
  const openInNewTabHref = iframeSrc || previewHref;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] lg:max-w-[720px]" data-testid="edit-index-preview-panel">
        <SheetHeader>
          <SheetTitle>{previewSlug ? `Previewing /${previewSlug}` : 'Preview'}</SheetTitle>
          <SheetDescription>
            {previewSlug ? 'Choose Draft or Live to view the page.' : 'Select a page to preview from the list.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          <Tabs value={previewMode} onValueChange={(value) => onPreviewModeChange(value as PreviewMode)}>
            <TabsList className="h-auto w-fit justify-start gap-2 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="draft"
                className="rounded-none border-b-2 border-b-transparent px-2 py-1.5 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
              >
                Draft
              </TabsTrigger>
              <TabsTrigger
                value="live"
                disabled={!activePage?.publishedAt}
                className="rounded-none border-b-2 border-b-transparent px-2 py-1.5 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
              >
                Live
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            {canOpen ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={openInNewTabHref} target="_blank" rel="noreferrer">
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
            {canOpen && canViewLive ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={liveHref} target="_blank" rel="noreferrer">
                  View live
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                View live
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 px-4 pb-4">
          <PreviewViewportShell showControls label="Preview size">
            {previewSlug && open ? (
              <div className="h-[calc(100vh-340px)] min-h-[320px] rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]">
                <iframe
                  key={iframeKey}
                  title={`Preview ${previewSlug}`}
                  src={iframeSrc}
                  loading="lazy"
                  className="h-full w-full bg-[var(--vd-bg)]"
                />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--vd-muted-fg)]">
                Select a page to load a preview.
              </div>
            )}
          </PreviewViewportShell>
        </div>
      </SheetContent>
    </Sheet>
  );
}
