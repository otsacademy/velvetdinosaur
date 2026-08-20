import type { ComponentType } from 'react';
import type { ViewMode } from '@/components/edit/pages-index-types';

/**
 * Sauro edit-index content-type registry.
 *
 * The edit index (pages-index.client.tsx) is a generic engine that renders
 * whatever content tabs the site registers in its site-owned
 * components/edit/edit-index.config.tsx. Everything type-specific — label,
 * search/sort behaviour, the tab body — lives in a ContentTabDescriptor.
 * Core descriptor factories (pages, news, events) live beside this file so
 * sites compose them instead of forking the engine.
 */

export const EDIT_INDEX_ITEMS_PER_PAGE = 10;

export type EditIndexMode = 'live' | 'demo';

export type EditIndexEngineContext = {
  mode: EditIndexMode;
  demoVariant?: string;
  platformAdmin: boolean;
  onDemoAction?: (action: string) => void;
  query: string;
  viewMode: ViewMode;
};

export type TabSortOption = { value: string; label: string };

export type TabBodyProps = {
  /** Filtered + sorted rows for this tab (full list). */
  rows: unknown[];
  /** Engine-paginated slice when the descriptor sets enginePagination. */
  pagedRows: unknown[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sort: string;
  onColumnSortClick: (column: string) => void;
  extraFilter: string;
  ctx: EditIndexEngineContext;
};

export type ContentTabDescriptor = {
  key: string;
  label: string;
  /** Which entry of the engine's `data` prop feeds this tab. */
  dataKey: string;
  searchPlaceholder: string;
  sortPlaceholder: string;
  sortOptions: TabSortOption[];
  defaultSort: string;
  /** Table-column header clicks → sort key. */
  columnSortMap: Record<string, string>;
  /** True: engine slices rows and renders the shared pagination footer. */
  enginePagination: boolean;
  /** Optional extra header control (e.g. the pages chapter filter). */
  HeaderFilter?: ComponentType<{ value: string; onChange: (value: string) => void }>;
  filterAndSort: (rows: unknown[], query: string, sort: string, extraFilter: string) => unknown[];
  noMatchCopy: string;
  /**
   * Self-contained create control (button + any dialog it needs). Mounted by
   * the header actions, the empty state, and the no-match card.
   */
  NewAction: ComponentType<{ ctx: EditIndexEngineContext; variant?: 'default' | 'outline' }>;
  Body: ComponentType<TabBodyProps>;
};

export type EditIndexSiteConfig = {
  heading: { title: string; subtitle: string };
  tabs: ContentTabDescriptor[];
  HeaderActions: ComponentType<{ ctx: EditIndexEngineContext }>;
  EmptyState: ComponentType<{ ctx: EditIndexEngineContext }>;
};

export type PaginationState<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
};

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 1) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

export function paginateItems<T>(items: T[], currentPage: number): PaginationState<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / EDIT_INDEX_ITEMS_PER_PAGE));
  const page = clampPage(currentPage, totalPages);
  const start = (page - 1) * EDIT_INDEX_ITEMS_PER_PAGE;
  const end = start + EDIT_INDEX_ITEMS_PER_PAGE;
  return {
    items: items.slice(start, end),
    currentPage: page,
    totalPages
  };
}
