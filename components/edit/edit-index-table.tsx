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
};

export function EditIndexTable({
  pages,
  previewSlug,
  previewOpen,
  onPreview,
  onDuplicate,
  onDelete
}: EditIndexTableProps) {
  return (
    <div
      className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]"
      data-testid="edit-index-pages-table"
    >
      <Table className="text-sm text-[var(--vd-fg)]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[55%] text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              Title / Slug
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              Status
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              Updated
            </TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
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
                className={cn(isActive ? 'bg-[var(--vd-muted)]/60' : '')}
              >
                <TableCell className="py-3 align-top whitespace-normal">
                  <div className="space-y-1">
                    <Link href={editHref} className="text-sm font-semibold text-[var(--vd-fg)] hover:underline">
                      {page.slug}
                    </Link>
                    {page.title && page.title !== page.slug ? (
                      <p className="text-xs text-[var(--vd-muted-fg)]">{page.title}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <Badge
                    className={cn(
                      published
                        ? 'border-transparent bg-[var(--vd-accent)] text-[var(--vd-accent-fg)]'
                        : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)]'
                    )}
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
                      onClick={() => onPreview(page.slug)}
                      aria-label={`Preview ${page.slug}`}
                    >
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
