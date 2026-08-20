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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/registry/new-york-v4/ui/table';
import { cn } from '@/lib/utils';
import type { NewsArticleRow, NewsSortKey, ViewMode } from '@/components/edit/pages-index-types';

type NewsSortColumn = 'article' | 'status' | 'updated';

type EditIndexNewsTableProps = {
  articles: NewsArticleRow[];
  newsSortKey: NewsSortKey;
  onSortColumnClick: (column: NewsSortColumn) => void;
  viewMode: ViewMode;
  onDuplicate: (article: NewsArticleRow) => void;
  onDelete: (article: NewsArticleRow) => void;
};

function getStatus(article: NewsArticleRow) {
  if (article.pendingPublishRequestedAt) {
    return {
      label: 'Needs approval',
      className: 'border-transparent bg-amber-100 text-amber-900'
    };
  }

  if (article.status === 'published') {
    return {
      label: 'Live',
      className: 'border-transparent bg-[var(--vd-accent)] text-[var(--vd-accent-fg)]'
    };
  }

  if (article.status === 'scheduled') {
    return {
      label: 'Scheduled',
      className: 'border-transparent bg-sky-100 text-sky-900'
    };
  }

  return {
    label: 'Draft',
    className: 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)]'
  };
}

function formatWhen(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function articleHref(slug: string) {
  return `/news/${encodeURIComponent(slug)}`;
}

export function EditIndexNewsTable({
  articles,
  newsSortKey,
  onSortColumnClick,
  viewMode,
  onDuplicate,
  onDelete
}: EditIndexNewsTableProps) {
  const activeSortColumn: NewsSortColumn =
    newsSortKey === 'title-asc' ? 'article' : newsSortKey === 'status-asc' ? 'status' : 'updated';
  const activeSortDirection = newsSortKey === 'title-asc' || newsSortKey === 'status-asc' ? '↑' : '↓';

  const renderSortIndicator = (column: NewsSortColumn) => {
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

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => {
          const status = getStatus(article);
          const liveHref = articleHref(article.slug);
          const editHref = `/edit/news/new?slug=${encodeURIComponent(article.slug)}`;
          return (
            <Card key={article.slug} className="space-y-3 border border-transparent bg-[var(--vd-card)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-2 text-base font-semibold text-[var(--vd-fg)]">{article.title}</p>
                  <p className="text-xs text-[var(--vd-muted-fg)]">
                    {article.tag}
                    {article.primaryChapterName ? ` • ${article.primaryChapterName}` : ''}
                    {' • '}
                    {article.authorName}
                  </p>
                  <p className="truncate text-xs text-[var(--vd-muted-fg)]">/news/{article.slug}</p>
                </div>
                <Badge className={cn(status.className)}>{status.label}</Badge>
              </div>

              <p className="text-xs text-[var(--vd-muted-fg)]">
                Last updated: {formatWhen(article.updatedAt || article.date)}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" variant="outline" asChild>
                  <Link href={liveHref} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={editHref}>Edit</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Article actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={editHref}>Edit article</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDuplicate(article)}>
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={liveHref} target="_blank" rel="noreferrer">
                        View live
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onDelete(article)} className="text-rose-600">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--vd-radius)] bg-[var(--vd-card)] shadow-sm">
      <Table className="text-sm text-[var(--vd-fg)]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[55%] text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              <button
                type="button"
                onClick={() => onSortColumnClick('article')}
                className={cn(
                  'group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--vd-fg)]',
                  activeSortColumn === 'article' ? 'text-[var(--vd-fg)]' : ''
                )}
                aria-label="Sort by article"
              >
                <span>Article</span>
                {renderSortIndicator('article')}
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
          {articles.map((article) => {
            const status = getStatus(article);
            const liveHref = articleHref(article.slug);
            const editHref = `/edit/news/new?slug=${encodeURIComponent(article.slug)}`;
            return (
              <TableRow
                key={article.slug}
                className="group border-[var(--vd-border)]/35 transition-colors hover:bg-[var(--vd-ring)]/8"
              >
                <TableCell className="border-l-2 border-l-transparent py-4 align-top whitespace-normal group-hover:border-l-[var(--vd-ring)]/80">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-[var(--vd-fg)]">{article.title}</p>
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      <span className="font-medium text-[var(--vd-fg)]/80">Tag:</span> {article.tag}
                      {article.primaryChapterName ? (
                        <>
                          <span className="mx-1.5">•</span>
                          <span className="font-medium text-[var(--vd-fg)]/80">Chapter:</span> {article.primaryChapterName}
                        </>
                      ) : null}
                      <span className="mx-1.5">•</span>
                      {article.authorName}
                    </p>
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      <span className="font-medium text-[var(--vd-fg)]/80">URL:</span> /news/{article.slug}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <Badge className={cn(status.className)}>{status.label}</Badge>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <p className="text-xs text-[var(--vd-muted-fg)]">{formatWhen(article.updatedAt || article.date)}</p>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={liveHref} target="_blank" rel="noreferrer">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={editHref}>Edit</Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Article actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={editHref}>Edit article</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDuplicate(article)}>
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={liveHref} target="_blank" rel="noreferrer">
                            View live
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onDelete(article)} className="text-rose-600">
                          <Trash2 className="h-4 w-4" />
                          Delete
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
