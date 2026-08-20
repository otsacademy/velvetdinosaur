'use client';
import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client';
import { EditIndexHeaderBar } from '@/components/edit/edit-index-header-bar';
import { editIndexConfig } from '@/components/edit/edit-index.config';
import {
  paginateItems,
  type ContentTabDescriptor,
  type EditIndexEngineContext,
  type EditIndexMode
} from '@/components/edit/edit-index/registry';
import type { ViewMode } from '@/components/edit/pages-index-types';

/**
 * Generic edit-index engine. Which content tabs exist — and everything
 * type-specific about them — comes from the site-owned
 * components/edit/edit-index.config.tsx registrations; this file must stay
 * site-agnostic (Sauro core).
 */

type PagesIndexProps = {
  data: Record<string, unknown[]>;
  mode?: EditIndexMode;
  demoVariant?: string;
  platformAdmin?: boolean;
  onDemoAction?: (action: string) => void;
};

export function PagesIndex({
  data,
  mode = 'live',
  demoVariant,
  platformAdmin = false,
  onDemoAction
}: PagesIndexProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tabs, heading, HeaderActions, EmptyState } = editIndexConfig;

  const tabParam = searchParams.get('tab');
  const activeTab: ContentTabDescriptor = tabs.find((tab) => tab.key === tabParam) ?? tabs[0];

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortByTab, setSortByTab] = useState<Record<string, string>>({});
  const [pageByTab, setPageByTab] = useState<Record<string, number>>({});
  const [extraFilterByTab, setExtraFilterByTab] = useState<Record<string, string>>({});

  const sortValue = sortByTab[activeTab.key] ?? activeTab.defaultSort;
  const pageValue = pageByTab[activeTab.key] ?? 1;
  const extraFilterValue = extraFilterByTab[activeTab.key] ?? '';

  const setActivePage = useCallback(
    (page: number) => setPageByTab((prev) => ({ ...prev, [activeTab.key]: page })),
    [activeTab.key]
  );

  const ctx: EditIndexEngineContext = useMemo(
    () => ({ mode, demoVariant, platformAdmin, onDemoAction, query, viewMode }),
    [mode, demoVariant, platformAdmin, onDemoAction, query, viewMode]
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredByTab = useMemo(() => {
    const out: Record<string, unknown[]> = {};
    for (const tab of tabs) {
      const rows = (data[tab.dataKey] as unknown[] | undefined) ?? [];
      const sort = sortByTab[tab.key] ?? tab.defaultSort;
      const extra = extraFilterByTab[tab.key] ?? '';
      out[tab.key] = tab.filterAndSort(rows, normalizedQuery, sort, extra);
    }
    return out;
  }, [tabs, data, normalizedQuery, sortByTab, extraFilterByTab]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPageByTab({});
  };

  const handleSortChange = (value: string) => {
    setSortByTab((prev) => ({ ...prev, [activeTab.key]: value }));
    setSortMenuOpen(false);
    setActivePage(1);
  };

  const handleColumnSortClick = (column: string) => {
    const next = activeTab.columnSortMap[column];
    if (!next) return;
    setSortByTab((prev) => ({ ...prev, [activeTab.key]: next }));
    setActivePage(1);
    setSortMenuOpen(true);
  };

  const handleExtraFilterChange = (value: string) => {
    setExtraFilterByTab((prev) => ({ ...prev, [activeTab.key]: value }));
    setActivePage(1);
  };

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    const queryString = params.toString();
    router.replace(queryString ? `/edit?${queryString}` : '/edit', { scroll: false });
    setSortMenuOpen(false);
    setPageByTab({});
  };

  const totalCount = tabs.reduce((sum, tab) => sum + (((data[tab.dataKey] as unknown[]) ?? []).length), 0);
  const activeRows = filteredByTab[activeTab.key] ?? [];
  const paged = paginateItems(activeRows, pageValue);
  const Body = activeTab.Body;
  const NewAction = activeTab.NewAction;

  return (
    <AdminWorkspaceShell>
      <main className="min-h-screen bg-[var(--vd-muted)]/15 pb-12">
        <div className="sticky top-0 z-20 bg-[var(--vd-bg)]/95 shadow-sm backdrop-blur">
          <div className="px-4 py-5 lg:px-6">
            <EditIndexHeaderBar
              heading={heading}
              tabs={tabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                count: ((data[tab.dataKey] as unknown[]) ?? []).length
              }))}
              activeTab={activeTab.key}
              onTabChange={handleTabChange}
              query={query}
              onQueryChange={handleQueryChange}
              searchPlaceholder={activeTab.searchPlaceholder}
              sortOptions={activeTab.sortOptions}
              sortValue={sortValue}
              onSortChange={handleSortChange}
              sortPlaceholder={activeTab.sortPlaceholder}
              sortMenuOpen={sortMenuOpen}
              onSortMenuOpenChange={setSortMenuOpen}
              HeaderFilter={activeTab.HeaderFilter}
              extraFilter={extraFilterValue}
              onExtraFilterChange={handleExtraFilterChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              actions={<HeaderActions ctx={ctx} />}
            />
          </div>
        </div>

        <div className="space-y-6 px-4 py-8 lg:px-6">
          {totalCount === 0 ? (
            <EmptyState ctx={ctx} />
          ) : activeRows.length === 0 ? (
            <div className="rounded-[var(--vd-radius)] bg-[var(--vd-card)] p-6 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[var(--vd-fg)]">No matches</h2>
                <p className="text-sm text-[var(--vd-muted-fg)]">{activeTab.noMatchCopy}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handleQueryChange('')}>
                  Clear search
                </Button>
                <NewAction ctx={ctx} />
              </div>
            </div>
          ) : (
            <>
              <Body
                rows={activeRows}
                pagedRows={activeTab.enginePagination ? paged.items : activeRows}
                page={paged.currentPage}
                totalPages={paged.totalPages}
                onPageChange={setActivePage}
                sort={sortValue}
                onColumnSortClick={handleColumnSortClick}
                extraFilter={extraFilterValue}
                ctx={ctx}
              />
            </>
          )}
        </div>
      </main>
    </AdminWorkspaceShell>
  );
}
