import Link from 'next/link';
import { Copy, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/registry/new-york-v4/ui/table';
import { cn } from '@/lib/utils';
import type { PageRow } from '@/components/edit/pages-index-types';
import { formatWhen, liveHref } from '@/components/edit/pages-index-utils';

type EditIndexTableProps = {
  pages: PageRow[];
  previewSlug: string | null;
  previewOpen: boolean;
  onPreview: (slug: string) => void;
  onDuplicate: (page: PageRow) => void;
  onDelete: (page: PageRow) => void;
  mode?: 'live' | 'demo';
  onDemoAction?: (label: string) => void;
};

export function EditIndexTable({
  pages,
  previewSlug,
  previewOpen,
  onPreview,
  onDuplicate,
  onDelete,
  mode = 'live',
  onDemoAction
}: EditIndexTableProps) {
  const isDemo = mode === 'demo';

  return (
    <div
      className={cn(
        'rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]',
        isDemo && 'vd-demo-table-shell'
      )}
      data-testid="edit-index-pages-table"
    >
      <Table className="text-sm text-[var(--vd-fg)]">
        <TableHeader>
          <TableRow>
            <TableHead className={cn('w-[55%] text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]', isDemo && 'vd-demo-table-head')}>
              Title / Slug
            </TableHead>
            <TableHead className={cn('text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]', isDemo && 'vd-demo-table-head')}>
              Status
            </TableHead>
            <TableHead className={cn('text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]', isDemo && 'vd-demo-table-head')}>
              Updated
            </TableHead>
            <TableHead
              className={cn(
                'text-right text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]',
                isDemo && 'vd-demo-table-head'
              )}
            >
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => {
            const editHref = `/edit/${encodeURIComponent(page.slug)}`;
            const live = liveHref(page.slug);
            const draft = formatWhen(page.draftUpdatedAt);
            const published = formatWhen(page.publishedAt);
            const canDelete = page.slug !== 'home';
            const isActive = previewSlug === page.slug && previewOpen;

            return (
              <TableRow
                key={page.slug}
                data-state={isActive ? 'selected' : undefined}
                className={cn(isActive ? 'bg-[var(--vd-muted)]/60' : '', isDemo && 'vd-demo-table-row')}
              >
                <TableCell className={cn('py-3 align-top whitespace-normal', isDemo && 'vd-demo-table-cell-leading')}>
                  <div className="space-y-1">
                    {isDemo ? (
                      <button
                        type="button"
                        className={cn(
                          'text-left text-sm font-semibold text-[var(--vd-fg)]',
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
                          'text-sm font-semibold text-[var(--vd-fg)]',
                          isDemo ? 'vd-demo-row-link' : 'hover:underline'
                        )}
                      >
                        {page.slug}
                      </Link>
                    )}
                    {page.title && page.title !== page.slug ? (
                      <p className="text-xs text-[var(--vd-muted-fg)]">{page.title}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="align-top whitespace-normal">
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
                </TableCell>
                <TableCell className="align-top">
                  <div className="text-xs text-[var(--vd-muted-fg)] space-y-1">
                    <p>{draft ? `Draft ${draft}` : 'No draft yet'}</p>
                    <p>{published ? `Live ${published}` : 'Not published'}</p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(isDemo && 'vd-demo-ghost-button')}
                      onClick={() => onPreview(page.slug)}
                      aria-label={`Preview ${page.slug}`}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
