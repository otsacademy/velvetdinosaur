import Link from 'next/link';
import { Copy, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
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
import { formatWhen, liveHref } from '@/components/edit/pages-index-utils';

type EditIndexItemProps = {
  page: PageRow;
  viewMode: ViewMode;
  isActive: boolean;
  onPreview: (slug: string) => void;
  onDuplicate: (page: PageRow) => void;
  onDelete: (page: PageRow) => void;
  mode?: 'live' | 'demo';
  onDemoAction?: (label: string) => void;
};

export function EditIndexItem({
  page,
  viewMode,
  isActive,
  onPreview,
  onDuplicate,
  onDelete,
  mode = 'live',
  onDemoAction
}: EditIndexItemProps) {
  const isDemo = mode === 'demo';
  const editHref = `/edit/${encodeURIComponent(page.slug)}`;
  const live = liveHref(page.slug);
  const draft = formatWhen(page.draftUpdatedAt);
  const published = formatWhen(page.publishedAt);
  const canDelete = page.slug !== 'home';

  return (
    <Card
      className={cn(
        'transition hover:border-[var(--vd-ring)] bg-[var(--vd-card)]',
        isDemo && 'vd-demo-grid-card',
        viewMode === 'list' ? 'p-4' : 'p-5',
        isActive && 'border-[var(--vd-ring)] shadow-md'
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
            <div className="space-y-1">
              {isDemo ? (
                <button
                  type="button"
                  className={cn(
                    'text-left text-lg font-semibold text-[var(--vd-fg)]',
                    isDemo ? 'vd-demo-row-link' : 'hover:underline'
                  )}
                  onClick={() => onDemoAction?.(`Edit /${page.slug}`)}
                >
                  {page.slug}
                </button>
              ) : (
                <Link
                  href={editHref}
                  className={cn(
                    'text-lg font-semibold text-[var(--vd-fg)]',
                    isDemo ? 'vd-demo-row-link' : 'hover:underline'
                  )}
                >
                  {page.slug}
                </Link>
              )}
              {page.title && page.title !== page.slug ? (
                <p className="text-sm text-[var(--vd-fg)]">{page.title}</p>
              ) : null}
            </div>
            <Badge
              className={cn(
                isDemo
                  ? 'vd-demo-status-badge'
                  : published
                    ? 'border-transparent bg-[color-mix(in_oklch,var(--vd-score-perfect)_18%,var(--vd-bg))] text-[color-mix(in_oklch,var(--vd-score-perfect)_72%,var(--vd-fg))]'
                    : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)]'
              )}
              data-tone={published ? 'published' : 'draft'}
            >
              {published ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="text-xs text-[var(--vd-muted-fg)]">
            {draft ? `Draft updated ${draft}` : 'No draft yet'}
            {published ? ` • Published ${published}` : null}
          </p>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            viewMode === 'list' ? 'sm:justify-end' : ''
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(isDemo && 'vd-demo-ghost-button')}
            onClick={() => onPreview(page.slug)}
            data-testid="edit-index-preview-open"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn('h-9 w-9 p-0', isDemo && 'vd-demo-icon-button')}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Page actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isDemo ? (
                <DropdownMenuItem onSelect={() => onDemoAction?.(`Edit /${page.slug}`)}>
                  Edit page
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={editHref}>Edit page</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => onDuplicate(page)}>
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {isDemo ? (
                <DropdownMenuItem onSelect={() => onDemoAction?.(`View live /${page.slug}`)}>
                  View live
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={live} target="_blank" rel="noreferrer">
                    View live
                  </Link>
                </DropdownMenuItem>
              )}
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
