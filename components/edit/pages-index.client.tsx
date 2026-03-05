'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EditIndexHeaderBar } from '@/components/edit/edit-index-header-bar';
import { EditIndexSection } from '@/components/edit/edit-index-section';
import { EditIndexItem } from '@/components/edit/edit-index-item';
import { EditIndexTable } from '@/components/edit/edit-index-table';
import { EditIndexPreviewSheet } from '@/components/edit/edit-index-preview-sheet';
import { DeletePageDialog, DuplicatePageDialog, NewPageDialog } from '@/components/edit/pages-index-dialogs';
import type { PageRow, SectionKey, SortKey, ViewMode } from '@/components/edit/pages-index-types';
import { getSortValue, isStayPageSlug, isTextPageSlug, liveHref } from '@/components/edit/pages-index-utils';

type PagesIndexProps = {
  pages: PageRow[];
};

export function PagesIndex({ pages }: PagesIndexProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('slug-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sectionsOpen, setSectionsOpen] = useState<Record<SectionKey, boolean>>({
    stays: true,
    pages: true,
    text: true
  });
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'draft' | 'live'>('draft');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<PageRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PageRow | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPages = useMemo(() => {
    const filtered = normalizedQuery
      ? pages.filter((page) => {
          const slugMatch = page.slug.toLowerCase().includes(normalizedQuery);
          const titleMatch = page.title ? page.title.toLowerCase().includes(normalizedQuery) : false;
          return slugMatch || titleMatch;
        })
      : pages;

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'slug-asc') {
        return a.slug.localeCompare(b.slug);
      }
      return getSortValue(b, sortKey) - getSortValue(a, sortKey);
    });

    return sorted;
  }, [normalizedQuery, pages, sortKey]);

  const stayPages = useMemo(() => filteredPages.filter((page) => isStayPageSlug(page.slug)), [filteredPages]);
  const textPages = useMemo(() => filteredPages.filter((page) => isTextPageSlug(page.slug)), [filteredPages]);
  const otherPages = useMemo(
    () => filteredPages.filter((page) => !isStayPageSlug(page.slug) && !isTextPageSlug(page.slug)),
    [filteredPages]
  );

  const activePage = useMemo(
    () => (previewSlug ? pages.find((page) => page.slug === previewSlug) ?? null : null),
    [pages, previewSlug]
  );

  const handlePreviewModeChange = (mode: 'draft' | 'live') => {
    if (mode === 'live' && !activePage?.publishedAt) return;
    setPreviewMode(mode);
  };

  const handleDuplicateOpenChange = (open: boolean) => {
    setDuplicateOpen(open);
    if (!open) {
      setDuplicateSource(null);
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) {
      setDeleteTarget(null);
    }
  };

  const openPreview = (pageSlug: string) => {
    setPreviewSlug(pageSlug);
    setPreviewMode('draft');
    setPreviewOpen(true);
  };

  const closePreview = (open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      setPreviewSlug(null);
      setPreviewMode('draft');
    }
  };

  const openDuplicate = (page: PageRow) => {
    setDuplicateSource(page);
    setDuplicateOpen(true);
  };

  const openDelete = (page: PageRow) => {
    setDeleteTarget(page);
    setDeleteOpen(true);
  };

  const handleDeleted = (slug: string) => {
    toast.success(`Deleted /${slug}`);
    router.refresh();
  };

  const previewHref = previewSlug ? `/preview/${encodeURIComponent(previewSlug)}` : '';
  const livePreviewHref = previewSlug ? liveHref(previewSlug) : '';

  const layoutClass = viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3';
  const hasContractsPage = useMemo(() => pages.some((page) => page.slug === 'contracts'), [pages]);

  return (
    <main className="min-h-screen bg-[var(--vd-bg)] pb-12">
      <div className="sticky top-0 z-30 border-b border-[var(--vd-border)] bg-[var(--vd-bg)]/95 backdrop-blur">
        <div className="container py-5">
          <EditIndexHeaderBar
            query={query}
            onQueryChange={setQuery}
            sortKey={sortKey}
            onSortChange={setSortKey}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filteredCount={filteredPages.length}
            totalCount={pages.length}
            hasContractsPage={hasContractsPage}
            onNewPage={() => setNewOpen(true)}
          />
        </div>
      </div>

      <div className="container space-y-8 py-8">
        {pages.length === 0 ? (
          <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--vd-fg)]">No pages yet</h2>
              <p className="text-sm text-[var(--vd-muted-fg)]">
                Create a page from the Store page or seed content, then refresh.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => setNewOpen(true)}>New page</Button>
            </div>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--vd-fg)]">No matches</h2>
              <p className="text-sm text-[var(--vd-muted-fg)]">Try a different search term or reset the filters.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setQuery('')}>
                Clear filters
              </Button>
              <Button onClick={() => setNewOpen(true)}>New page</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {stayPages.length ? (
              <EditIndexSection
                title="Stays"
                count={stayPages.length}
                open={sectionsOpen.stays}
                onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, stays: open }))}
                testId="edit-index-section-stays"
              >
                {viewMode === 'list' ? (
                  <EditIndexTable
                    pages={stayPages}
                    previewSlug={previewSlug}
                    previewOpen={previewOpen}
                    onPreview={openPreview}
                    onDuplicate={openDuplicate}
                    onDelete={openDelete}
                  />
                ) : (
                  <div className={layoutClass}>
                    {stayPages.map((page) => (
                      <EditIndexItem
                        key={page.slug}
                        page={page}
                        viewMode={viewMode}
                        isActive={previewSlug === page.slug && previewOpen}
                        onPreview={openPreview}
                        onDuplicate={openDuplicate}
                        onDelete={openDelete}
                      />
                    ))}
                  </div>
                )}
              </EditIndexSection>
            ) : null}
            {otherPages.length ? (
              <EditIndexSection
                title="Pages"
                count={otherPages.length}
                open={sectionsOpen.pages}
                onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, pages: open }))}
                testId="edit-index-section-pages"
              >
                {viewMode === 'list' ? (
                  <EditIndexTable
                    pages={otherPages}
                    previewSlug={previewSlug}
                    previewOpen={previewOpen}
                    onPreview={openPreview}
                    onDuplicate={openDuplicate}
                    onDelete={openDelete}
                  />
                ) : (
                  <div className={layoutClass}>
                    {otherPages.map((page) => (
                      <EditIndexItem
                        key={page.slug}
                        page={page}
                        viewMode={viewMode}
                        isActive={previewSlug === page.slug && previewOpen}
                        onPreview={openPreview}
                        onDuplicate={openDuplicate}
                        onDelete={openDelete}
                      />
                    ))}
                  </div>
                )}
              </EditIndexSection>
            ) : null}
            {textPages.length ? (
              <EditIndexSection
                title="Text"
                count={textPages.length}
                open={sectionsOpen.text}
                onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, text: open }))}
                testId="edit-index-section-text"
              >
                {viewMode === 'list' ? (
                  <EditIndexTable
                    pages={textPages}
                    previewSlug={previewSlug}
                    previewOpen={previewOpen}
                    onPreview={openPreview}
                    onDuplicate={openDuplicate}
                    onDelete={openDelete}
                  />
                ) : (
                  <div className={layoutClass}>
                    {textPages.map((page) => (
                      <EditIndexItem
                        key={page.slug}
                        page={page}
                        viewMode={viewMode}
                        isActive={previewSlug === page.slug && previewOpen}
                        onPreview={openPreview}
                        onDuplicate={openDuplicate}
                        onDelete={openDelete}
                      />
                    ))}
                  </div>
                )}
              </EditIndexSection>
            ) : null}
          </div>
        )}
      </div>

      <EditIndexPreviewSheet
        open={previewOpen}
        onOpenChange={closePreview}
        previewSlug={previewSlug}
        previewMode={previewMode}
        onPreviewModeChange={handlePreviewModeChange}
        activePage={activePage}
        previewHref={previewHref}
        liveHref={livePreviewHref}
      />

      <NewPageDialog open={newOpen} onOpenChange={setNewOpen} />
      <DuplicatePageDialog open={duplicateOpen} onOpenChange={handleDuplicateOpenChange} source={duplicateSource} />
      <DeletePageDialog
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        target={deleteTarget}
        onDeleted={handleDeleted}
      />
    </main>
  );
}
