'use client';

import Link from 'next/link';
import { FilePenLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EditIndexNewsTable } from '@/components/edit/edit-index-news-table';
import { EditIndexPagination } from '@/components/edit/edit-index-pagination';
import type { NewsArticleRow, NewsSortKey } from '@/components/edit/pages-index-types';
import {
  EDIT_INDEX_ITEMS_PER_PAGE,
  type ContentTabDescriptor,
  type EditIndexEngineContext,
  type TabBodyProps
} from '@/components/edit/edit-index/registry';

function NewsNewAction({ ctx, variant = 'outline' }: { ctx: EditIndexEngineContext; variant?: 'default' | 'outline' }) {
  if (ctx.mode === 'demo') {
    return (
      <Button
        variant={variant === 'outline' ? 'outline' : undefined}
        onClick={() => ctx.onDemoAction?.('Create a news article')}
        data-testid="edit-index-add-article"
      >
        <FilePenLine className="h-4 w-4" />
        New article
      </Button>
    );
  }
  return (
    <Button variant={variant === 'outline' ? 'outline' : undefined} asChild data-testid="edit-index-add-article">
      <Link href="/edit/news/new">
        <FilePenLine className="h-4 w-4" />
        New article
      </Link>
    </Button>
  );
}

function parseNewsTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getNewsStatusSortValue(article: NewsArticleRow) {
  if (article.pendingPublishRequestedAt) return 0;
  if (article.status === 'draft' || !article.status) return 1;
  if (article.status === 'scheduled') return 2;
  return 3;
}

function filterAndSortNews(rows: unknown[], query: string, sort: string): NewsArticleRow[] {
  const articles = rows as NewsArticleRow[];
  const filtered = query
    ? articles.filter((article) => {
        const slugMatch = article.slug.toLowerCase().includes(query);
        const titleMatch = article.title.toLowerCase().includes(query);
        const tagMatch = article.tag.toLowerCase().includes(query);
        return slugMatch || titleMatch || tagMatch;
      })
    : articles;

  return [...filtered].sort((a, b) => {
    if (sort === 'title-asc') {
      return a.title.localeCompare(b.title);
    }
    if (sort === 'date-desc') {
      const aTime = parseNewsTime(a.date) || parseNewsTime(a.updatedAt);
      const bTime = parseNewsTime(b.date) || parseNewsTime(b.updatedAt);
      return bTime - aTime;
    }
    if (sort === 'status-asc') {
      const statusDelta = getNewsStatusSortValue(a) - getNewsStatusSortValue(b);
      if (statusDelta !== 0) return statusDelta;
    }
    const aTime = parseNewsTime(a.updatedAt) || parseNewsTime(a.date);
    const bTime = parseNewsTime(b.updatedAt) || parseNewsTime(b.date);
    return bTime - aTime;
  });
}

function NewsTabBody({ rows, pagedRows, page, totalPages, onPageChange, sort, onColumnSortClick, ctx }: TabBodyProps) {
  const router = useRouter();

  const handleDuplicate = (article: NewsArticleRow) => {
    if (ctx.mode === 'demo') {
      ctx.onDemoAction?.('Duplicate a news article');
      return;
    }
    router.push(`/edit/news/new?slug=${encodeURIComponent(article.slug)}&duplicate=1`);
  };

  const handleDelete = async (article: NewsArticleRow) => {
    if (ctx.mode === 'demo') {
      ctx.onDemoAction?.('Delete a news article');
      return;
    }
    const confirmed = window.confirm(`Delete "${article.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/news/articles/${encodeURIComponent(article.slug)}`, {
        method: 'DELETE'
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : 'Delete failed');
      }
      toast.success(`Deleted /news/${article.slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete article');
    }
  };

  return (
    <section className="space-y-3" aria-label="News Articles">
      <EditIndexNewsTable
        articles={pagedRows as NewsArticleRow[]}
        newsSortKey={sort as NewsSortKey}
        onSortColumnClick={(column) => onColumnSortClick(column)}
        viewMode={ctx.viewMode}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
      <EditIndexPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={rows.length}
        pageSize={EDIT_INDEX_ITEMS_PER_PAGE}
        onPageChange={onPageChange}
      />
    </section>
  );
}

export function createNewsTab(): ContentTabDescriptor {
  return {
    key: 'news',
    label: 'News',
    dataKey: 'newsArticles',
    searchPlaceholder: 'Search news articles',
    sortPlaceholder: 'Sort news',
    sortOptions: [
      { value: 'updated-desc', label: 'Last updated' },
      { value: 'date-desc', label: 'Article date' },
      { value: 'title-asc', label: 'Title (A-Z)' },
      { value: 'status-asc', label: 'Status (A-Z)' }
    ],
    defaultSort: 'updated-desc',
    columnSortMap: { article: 'title-asc', status: 'status-asc', updated: 'updated-desc' },
    enginePagination: true,
    filterAndSort: (rows, query, sort) => filterAndSortNews(rows, query, sort),
    noMatchCopy: 'No news articles match your current search.',
    NewAction: NewsNewAction,
    Body: NewsTabBody
  };
}
