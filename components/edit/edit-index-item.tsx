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
};

export function EditIndexItem({
  page,
  viewMode,
  isActive,
  onPreview,
  onDuplicate,
  onDelete
}: EditIndexItemProps) {
  const editHref = `/edit/${encodeURIComponent(page.slug)}`;
  const live = liveHref(page.slug);
  const draft = formatWhen(page.draftUpdatedAt);
  const published = formatWhen(page.publishedAt);
  const canDelete = page.slug !== 'home';

  return (
    <Card
      className={cn(
        'transition hover:border-[var(--vd-ring)] bg-[var(--vd-card)]',
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
              <Link href={editHref} className="text-lg font-semibold text-[var(--vd-fg)] hover:underline">
                {page.slug}
              </Link>
              {page.title && page.title !== page.slug ? (
                <p className="text-sm text-[var(--vd-fg)]">{page.title}</p>
              ) : null}
            </div>
            <Badge
              className={cn(
                published
                  ? 'border-transparent bg-[var(--vd-accent)] text-[var(--vd-accent-fg)]'
                  : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)]'
              )}
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
          <Button variant="ghost" size="sm" onClick={() => onPreview(page.slug)} data-testid="edit-index-preview-open">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
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
