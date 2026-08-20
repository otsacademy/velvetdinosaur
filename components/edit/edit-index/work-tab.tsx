'use client';

import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditIndexPagination } from '@/components/edit/edit-index-pagination';
import { EditIndexWorkTable } from '@/components/edit/edit-index-work-table';
import type { WorkArticleRow } from '@/components/edit/pages-index-types';
import {
  EDIT_INDEX_ITEMS_PER_PAGE,
  type ContentTabDescriptor,
  type EditIndexEngineContext,
  type TabBodyProps
} from '@/components/edit/edit-index/registry';

/**
 * Velvet Dinosaur's site-owned Work (case studies) tab for the shared
 * edit-index engine.
 */

function parseTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getWorkSortValue(article: WorkArticleRow, sort: string) {
  if (sort === 'title-asc') {
    return 0;
  }
  return Math.max(parseTime(article.updatedAt), parseTime(article.date), parseTime(article.pendingPublishRequestedAt));
}

function filterAndSortWork(rows: unknown[], query: string, sort: string): WorkArticleRow[] {
  const articles = rows as WorkArticleRow[];
  const filtered = query
    ? articles.filter((article) => {
        const slugMatch = article.slug.toLowerCase().includes(query);
        const titleMatch = article.title.toLowerCase().includes(query);
        const tagMatch = article.tag.toLowerCase().includes(query);
        const authorMatch = article.authorName.toLowerCase().includes(query);
        return slugMatch || titleMatch || tagMatch || authorMatch;
      })
    : articles;

  return [...filtered].sort((a, b) => {
    if (sort === 'title-asc') {
      return a.title.localeCompare(b.title);
    }
    return getWorkSortValue(b, sort) - getWorkSortValue(a, sort);
  });
}

function WorkNewAction({ ctx, variant = 'outline' }: { ctx: EditIndexEngineContext; variant?: 'default' | 'outline' }) {
  if (ctx.mode === 'demo') {
    return (
      <Button
        variant={variant === 'outline' ? 'outline' : undefined}
        onClick={() => ctx.onDemoAction?.('Create a new work article')}
        data-testid="edit-index-new-work"
      >
        <Briefcase className="h-4 w-4" />
        New work
      </Button>
    );
  }
  return (
    <Button variant={variant === 'outline' ? 'outline' : undefined} asChild data-testid="edit-index-new-work">
      <Link href="/edit/work/new">
        <Briefcase className="h-4 w-4" />
        New work
      </Link>
    </Button>
  );
}

function WorkTabBody({ rows, pagedRows, page, totalPages, onPageChange, ctx }: TabBodyProps) {
  return (
    <section className="space-y-3" aria-label="Work">
      <EditIndexWorkTable
        articles={pagedRows as WorkArticleRow[]}
        viewMode={ctx.viewMode}
        mode={ctx.mode}
        onDemoAction={ctx.onDemoAction}
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

export function createWorkTab(): ContentTabDescriptor {
  return {
    key: 'work',
    label: 'Work',
    dataKey: 'workArticles',
    searchPlaceholder: 'Search work case studies',
    sortPlaceholder: 'Sort work',
    sortOptions: [
      { value: 'updated-desc', label: 'Last updated' },
      { value: 'title-asc', label: 'Title (A-Z)' }
    ],
    defaultSort: 'updated-desc',
    columnSortMap: {},
    enginePagination: true,
    filterAndSort: (rows, query, sort) => filterAndSortWork(rows, query, sort),
    noMatchCopy: 'No work case studies match your current search.',
    NewAction: WorkNewAction,
    Body: WorkTabBody
  };
}
