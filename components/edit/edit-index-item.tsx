import Link from 'next/link';
import { Copy, Eye, FolderInput, MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PageRow, ViewMode } from '@/components/edit/pages-index-types';
import { canMovePage, getPageLastUpdatedLabel, liveHref } from '@/components/edit/pages-index-utils';
import { getPageMetadata } from '@/components/edit/pages-index-metadata';
import { editHref as pageEditHref } from '@/lib/page-paths';

type EditIndexItemProps = {
  page: PageRow;
  viewMode: ViewMode;
  isActive: boolean;
  onPreview: (slug: string) => void;
  onDuplicate: (page: PageRow) => void;
  onMove: (page: PageRow) => void;
  onDelete: (page: PageRow) => void;
};

export function EditIndexItem({
  page,
  viewMode,
  isActive,
  onPreview,
  onDuplicate,
  onMove,
  onDelete
}: EditIndexItemProps) {
  const editHref = pageEditHref(page.slug);
  const live = liveHref(page);
  const canMove = canMovePage(page);
  const hasPublished = Boolean(page.publishedAt);
  const pendingPublish = Boolean(page.pendingPublishRequestedAt);
  const canDelete = page.slug !== 'home';
  const metadata = getPageMetadata(page);
  const lastUpdated = getPageLastUpdatedLabel(page);
  const Icon = metadata.icon;

  return (
    <Card
      className={cn(
        'border border-transparent bg-[var(--vd-card)] shadow-sm transition hover:shadow-md',
        viewMode === 'list' ? 'p-4' : 'p-5',
        isActive && 'shadow-md ring-1 ring-[var(--vd-ring)]'
      )}
    >
      <div
        className={cn(
          viewMode === 'list'
            ? 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
            : 'space-y-4'
        )}
      >
        <div className={cn(viewMode === 'list' ? 'space-y-2' : 'space-y-3')}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <Link href={editHref} className="text-lg font-semibold text-[var(--vd-fg)] hover:underline">
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[var(--vd-muted-fg)]" aria-hidden="true" />
                  <span>{metadata.title}</span>
                </span>
              </Link>
              <p className="text-sm text-[var(--vd-muted-fg)]">{metadata.description}</p>
              {page.primaryChapterName ? (
                <p className="text-xs text-[var(--vd-muted-fg)]">
                  <span className="font-medium text-[var(--vd-fg)]/80">Chapter:</span> {page.primaryChapterName}
                </p>
              ) : null}
              <p className="text-xs text-[var(--vd-muted-fg)]">
                <span className="font-medium text-[var(--vd-fg)]/80">URL:</span> {metadata.path}
              </p>
            </div>
            <Badge
              className={cn(
                pendingPublish
                  ? 'border-transparent bg-amber-100 text-amber-900'
                  : hasPublished
                  ? 'border-transparent bg-[var(--vd-accent)] text-[var(--vd-accent-fg)]'
                  : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)]'
              )}
            >
              {pendingPublish ? 'Needs approval' : hasPublished ? 'Live' : 'Draft'}
            </Badge>
          </div>
          <p className="text-xs text-[var(--vd-muted-fg)]">{lastUpdated ? `Last updated ${lastUpdated}` : 'No updates yet'}</p>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            viewMode === 'list' ? 'sm:justify-end' : ''
          )}
        >
          <Button size="sm" asChild>
            <Link href={editHref}>Edit</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onPreview(page.slug)} data-testid="edit-index-preview-open">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Page actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={editHref}>Edit page</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDuplicate(page)}>
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {canMove ? (
                <DropdownMenuItem onSelect={() => onMove(page)}>
                  <FolderInput className="h-4 w-4" />
                  Move / URL
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem asChild>
                <Link href={live} target="_blank" rel="noreferrer">
                  View live
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canDelete}
                onSelect={() => onDelete(page)}
                className={cn(!canDelete ? 'text-[var(--vd-muted-fg)]' : 'text-rose-600')}
              >
                <Trash2 className="h-4 w-4" />
                {canDelete ? 'Delete' : 'Home cannot be deleted'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
