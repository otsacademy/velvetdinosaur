import Link from 'next/link';
import { Copy, Eye, FolderInput, MoreHorizontal, Trash2 } from 'lucide-react';
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
import type { PageRow, SortKey } from '@/components/edit/pages-index-types';
import { canMovePage, getPageLastUpdatedLabel, liveHref } from '@/components/edit/pages-index-utils';
import { getPageMetadata } from '@/components/edit/pages-index-metadata';

type PageSortColumn = 'name' | 'status' | 'updated';

type EditIndexTableProps = {
  pages: PageRow[];
  sortKey: SortKey;
  onSortColumnClick: (column: PageSortColumn) => void;
  previewSlug: string | null;
  previewOpen: boolean;
  onPreview: (slug: string) => void;
  onDuplicate: (page: PageRow) => void;
  onMove: (page: PageRow) => void;
  onDelete: (page: PageRow) => void;
};


type PageActionsMenuProps = {
  page: PageRow;
  metadataTitle: string;
  editHref: string;
  liveUrl: string;
  canMove: boolean;
  canDelete: boolean;
  onDuplicate: (page: PageRow) => void;
  onMove: (page: PageRow) => void;
  onDelete: (page: PageRow) => void;
};

function PageActionsMenu({
  page,
  metadataTitle,
  editHref,
  liveUrl,
  canMove,
  canDelete,
  onDuplicate,
  onMove,
  onDelete
}: PageActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions for {metadataTitle}</span>
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
          <Link href={liveUrl} target="_blank" rel="noreferrer">
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
  );
}

export function EditIndexTable({
  pages,
  sortKey,
  onSortColumnClick,
  previewSlug,
  previewOpen,
  onPreview,
  onDuplicate,
  onMove,
  onDelete
}: EditIndexTableProps) {
  const activeSortColumn: PageSortColumn =
    sortKey === 'slug-asc' ? 'name' : sortKey === 'updated-desc' ? 'updated' : 'status';
  const activeSortDirection = sortKey === 'slug-asc' ? '↑' : '↓';

  const renderSortIndicator = (column: PageSortColumn) => {
    const isActive = column === activeSortColumn;
    return (
      <span
        aria-hidden
        className={cn(
          'text-xs transition-colors',
          isActive ? 'text-[var(--vd-ring)]' : 'text-[var(--vd-muted-fg)]/75 group-hover:text-[var(--vd-ring)]'
        )}
      >
        {isActive ? activeSortDirection : '⇅'}
      </span>
    );
  };

  return (
    <div
      className="overflow-hidden rounded-[var(--vd-radius)] bg-[var(--vd-card)] shadow-sm"
      data-testid="edit-index-pages-table"
    >
      {/* Below md the table collapses into cards; a four-column grid in
          390px slivers is unreadable. */}
      <ul className="divide-y divide-[var(--vd-border)]/35 md:hidden">
        {pages.map((page) => {
          const editHref =
            page.slug === 'home' ? '/edit?slug=home' : `/edit/${encodeURIComponent(page.slug)}`;
          const live = liveHref(page);
          const canMove = canMovePage(page);
          const hasPublished = Boolean(page.publishedAt);
          const pendingPublish = Boolean(page.pendingPublishRequestedAt);
          const canDelete = page.slug !== 'home';
          const metadata = getPageMetadata(page);
          const lastUpdated = getPageLastUpdatedLabel(page);
          const Icon = metadata.icon;
          return (
            <li key={page.slug} className="flex items-start justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0 space-y-1">
                <Link href={editHref} className="text-sm font-semibold text-[var(--vd-fg)] hover:underline">
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--vd-muted-fg)]" aria-hidden="true" />
                    <span className="truncate">{metadata.title}</span>
                  </span>
                </Link>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--vd-muted-fg)]">
                  <Badge
                    className={cn(
                      'px-2 py-0',
                      pendingPublish
                        ? 'border-transparent bg-amber-100 text-amber-900'
                        : hasPublished
                        ? 'border-transparent bg-[var(--vd-accent)] text-[var(--vd-accent-fg)]'
                        : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)]'
                    )}
                  >
                    {pendingPublish ? 'Needs approval' : hasPublished ? 'Live' : 'Draft'}
                  </Badge>
                  <span className="truncate">{metadata.path}</span>
                  {lastUpdated ? <span>{lastUpdated}</span> : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="sm" asChild>
                  <Link href={editHref}>Edit</Link>
                </Button>
                <PageActionsMenu
                  page={page}
                  metadataTitle={metadata.title}
                  editHref={editHref}
                  liveUrl={live}
                  canMove={canMove}
                  canDelete={canDelete}
                  onDuplicate={onDuplicate}
                  onMove={onMove}
                  onDelete={onDelete}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <Table className="hidden text-sm text-[var(--vd-fg)] md:table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[55%] text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              <button
                type="button"
                onClick={() => onSortColumnClick('name')}
                className={cn(
                  'group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--vd-fg)]',
                  activeSortColumn === 'name' ? 'text-[var(--vd-fg)]' : ''
                )}
                aria-label="Sort by name"
              >
                <span>Name</span>
                {renderSortIndicator('name')}
              </button>
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              <button
                type="button"
                onClick={() => onSortColumnClick('status')}
                className={cn(
                  'group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--vd-fg)]',
                  activeSortColumn === 'status' ? 'text-[var(--vd-fg)]' : ''
                )}
                aria-label="Sort by status"
              >
                <span>Status</span>
                {renderSortIndicator('status')}
              </button>
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              <button
                type="button"
                onClick={() => onSortColumnClick('updated')}
                className={cn(
                  'group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--vd-fg)]',
                  activeSortColumn === 'updated' ? 'text-[var(--vd-fg)]' : ''
                )}
                aria-label="Sort by last updated"
              >
                <span>Last updated</span>
                {renderSortIndicator('updated')}
              </button>
            </TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => {
            const editHref =
              page.slug === 'home' ? '/edit?slug=home' : `/edit/${encodeURIComponent(page.slug)}`;
            const live = liveHref(page);
            const canMove = canMovePage(page);
            const hasPublished = Boolean(page.publishedAt);
            const pendingPublish = Boolean(page.pendingPublishRequestedAt);
            const canDelete = page.slug !== 'home';
            const isActive = previewSlug === page.slug && previewOpen;
            const metadata = getPageMetadata(page);
            const lastUpdated = getPageLastUpdatedLabel(page);
            const Icon = metadata.icon;

            return (
              <TableRow
                key={page.slug}
                data-state={isActive ? 'selected' : undefined}
                className={cn(
                  'group border-[var(--vd-border)]/35 transition-colors hover:bg-[var(--vd-ring)]/8',
                  isActive ? 'bg-[var(--vd-muted)]/60' : ''
                )}
              >
                <TableCell
                  className={cn(
                    'border-l-2 py-4 align-top whitespace-normal',
                    isActive ? 'border-l-[var(--vd-ring)]' : 'border-l-transparent group-hover:border-l-[var(--vd-ring)]/80'
                  )}
                >
                  <div className="space-y-1.5">
                    <Link href={editHref} className="text-sm font-semibold text-[var(--vd-fg)] hover:underline">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[var(--vd-muted-fg)]" aria-hidden="true" />
                        <span>{metadata.title}</span>
                      </span>
                    </Link>
                    <p className="text-xs text-[var(--vd-muted-fg)]">{metadata.description}</p>
                    {page.primaryChapterName ? (
                      <p className="text-xs text-[var(--vd-muted-fg)]">
                        <span className="font-medium text-[var(--vd-fg)]/80">Chapter:</span> {page.primaryChapterName}
                      </p>
                    ) : null}
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      <span className="font-medium text-[var(--vd-fg)]/80">URL:</span> {metadata.path}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top whitespace-normal">
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
                </TableCell>
                <TableCell className="py-4 align-top">
                  <p className="text-xs text-[var(--vd-muted-fg)]">{lastUpdated || '\u2014'}</p>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" asChild>
                      <Link href={editHref}>Edit</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(page.slug)}
                      aria-label={`Preview ${metadata.title}`}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <PageActionsMenu
                      page={page}
                      metadataTitle={metadata.title}
                      editHref={editHref}
                      liveUrl={live}
                      canMove={canMove}
                      canDelete={canDelete}
                      onDuplicate={onDuplicate}
                      onMove={onMove}
                      onDelete={onDelete}
                    />
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
