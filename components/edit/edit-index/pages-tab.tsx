'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditIndexItem } from '@/components/edit/edit-index-item';
import { EditIndexPagination } from '@/components/edit/edit-index-pagination';
import { EditIndexSection } from '@/components/edit/edit-index-section';
import { EditIndexTable } from '@/components/edit/edit-index-table';
import { EditIndexPreviewSheet } from '@/components/edit/edit-index-preview-sheet';
import { DeletePageDialog, DuplicatePageDialog, NewPageDialog } from '@/components/edit/pages-index-dialogs';
import { MovePageDialog } from '@/components/edit/move-page-dialog';
import { normalizeChapterSlug, ASAP_CHAPTER_OPTIONS } from '@/lib/chapters';
import type { PageRow, SortKey, ViewMode } from '@/components/edit/pages-index-types';
import { getSortValue, isStayPageSlug, isTextPageSlug, liveHref } from '@/components/edit/pages-index-utils';
import {
  EDIT_INDEX_ITEMS_PER_PAGE,
  paginateItems,
  type ContentTabDescriptor,
  type EditIndexEngineContext,
  type TabBodyProps
} from '@/components/edit/edit-index/registry';

function filterAndSortPages(rows: unknown[], query: string, sort: string, chapterFilter: string): PageRow[] {
  const pages = rows as PageRow[];
  const filtered = pages.filter((page) => {
    const matchesQuery = query
      ? page.slug.toLowerCase().includes(query) ||
        (page.title ? page.title.toLowerCase().includes(query) : false)
      : true;
    if (!matchesQuery) return false;
    if (chapterFilter === '__all__' || !chapterFilter) return true;
    if (chapterFilter === '__none__') return !page.primaryChapterSlug;
    const normalizedFilter = normalizeChapterSlug(chapterFilter);
    return Array.isArray(page.chapterSlugs) && page.chapterSlugs.includes(normalizedFilter);
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'slug-asc') {
      return a.slug.localeCompare(b.slug);
    }
    return getSortValue(b, sort as SortKey) - getSortValue(a, sort as SortKey);
  });
}

function PagesChapterFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value || '__all__'} onValueChange={onChange}>
      <SelectTrigger className="hover:border-[var(--vd-ring)]/70 hover:ring-2 hover:ring-[var(--vd-ring)]/15">
        <SelectValue placeholder="Filter by chapter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All chapters</SelectItem>
        <SelectItem value="__none__">No chapter assigned</SelectItem>
        {ASAP_CHAPTER_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PagesNewAction({ ctx, variant = 'default' }: { ctx: EditIndexEngineContext; variant?: 'default' | 'outline' }) {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    if (ctx.mode === 'demo') {
      ctx.onDemoAction?.('Create a new page');
      return;
    }
    setOpen(true);
  };
  return (
    <>
      <Button variant={variant === 'outline' ? 'outline' : undefined} onClick={handleClick} data-testid="edit-index-new-page">
        <Plus className="h-4 w-4" />
        New page
      </Button>
      <NewPageDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function PagesTabBody({ rows, sort, onColumnSortClick, ctx }: TabBodyProps) {
  const router = useRouter();
  const filteredPages = rows as PageRow[];
  const isDemo = ctx.mode === 'demo';

  const [sectionsOpen, setSectionsOpen] = useState({ stays: true, pages: true, text: true });
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'draft' | 'live'>('draft');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<PageRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PageRow | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<PageRow | null>(null);
  const [staysPage, setStaysPage] = useState(1);
  const [pagesPage, setPagesPage] = useState(1);
  const [textPage, setTextPage] = useState(1);

  // Reset sub-pagination whenever the filtered set changes shape
  // (render-phase derived-state reset; avoids an effect-driven cascade).
  const filteredCount = filteredPages.length;
  const [lastResetKey, setLastResetKey] = useState({ count: filteredCount, sort });
  if (lastResetKey.count !== filteredCount || lastResetKey.sort !== sort) {
    setLastResetKey({ count: filteredCount, sort });
    setStaysPage(1);
    setPagesPage(1);
    setTextPage(1);
  }

  const stayPages = useMemo(() => filteredPages.filter((page) => isStayPageSlug(page.slug)), [filteredPages]);
  const textPages = useMemo(() => filteredPages.filter((page) => isTextPageSlug(page.slug)), [filteredPages]);
  const otherPages = useMemo(
    () => filteredPages.filter((page) => !isStayPageSlug(page.slug) && !isTextPageSlug(page.slug)),
    [filteredPages]
  );
  const pagedStayPages = useMemo(() => paginateItems(stayPages, staysPage), [stayPages, staysPage]);
  const pagedOtherPages = useMemo(() => paginateItems(otherPages, pagesPage), [otherPages, pagesPage]);
  const pagedTextPages = useMemo(() => paginateItems(textPages, textPage), [textPages, textPage]);

  const activePage = useMemo(
    () => (previewSlug ? filteredPages.find((page) => page.slug === previewSlug) ?? null : null),
    [filteredPages, previewSlug]
  );

  const handlePreviewModeChange = (mode: 'draft' | 'live') => {
    if (mode === 'live' && !activePage?.publishedAt) return;
    setPreviewMode(mode);
  };

  const handleDuplicateOpenChange = (open: boolean) => {
    setDuplicateOpen(open);
    if (!open) setDuplicateSource(null);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) setDeleteTarget(null);
  };

  const handleMoveOpenChange = (open: boolean) => {
    setMoveOpen(open);
    if (!open) setMoveTarget(null);
  };

  const guardDemo = (action: string) => {
    if (!isDemo) return false;
    ctx.onDemoAction?.(action);
    return true;
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
    if (guardDemo('Duplicate a page')) return;
    setDuplicateSource(page);
    setDuplicateOpen(true);
  };

  const openDelete = (page: PageRow) => {
    if (guardDemo('Delete a page')) return;
    setDeleteTarget(page);
    setDeleteOpen(true);
  };

  const openMove = (page: PageRow) => {
    if (guardDemo('Move a page')) return;
    setMoveTarget(page);
    setMoveOpen(true);
  };

  const handleMoved = (_slug: string, path: string) => {
    toast.success(`Moved to /${path}`);
    router.refresh();
  };

  const handleDeleted = (slug: string) => {
    toast.success(`Deleted /${slug}`);
    router.refresh();
  };

  const previewHref = previewSlug ? `/preview/${encodeURIComponent(previewSlug)}` : '';
  const livePreviewHref = activePage ? liveHref(activePage) : previewSlug ? liveHref({ slug: previewSlug }) : '';
  const layoutClass = ctx.viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3';

  const renderPagesCollection = (items: PageRow[]) => {
    if (ctx.viewMode === 'list') {
      return (
        <EditIndexTable
          pages={items}
          sortKey={sort as SortKey}
          onSortColumnClick={(column) => onColumnSortClick(column)}
          previewSlug={previewSlug}
          previewOpen={previewOpen}
          onPreview={openPreview}
          onDuplicate={openDuplicate}
          onMove={openMove}
          onDelete={openDelete}
        />
      );
    }

    return (
      <div className={layoutClass}>
        {items.map((page) => (
          <EditIndexItem
            key={page.slug}
            page={page}
            viewMode={ctx.viewMode}
            isActive={previewSlug === page.slug && previewOpen}
            onPreview={openPreview}
            onDuplicate={openDuplicate}
            onMove={openMove}
            onDelete={openDelete}
          />
        ))}
      </div>
    );
  };

  const sections: Array<{
    key: 'stays' | 'pages' | 'text';
    title: string;
    all: PageRow[];
    paged: ReturnType<typeof paginateItems<PageRow>>;
    onPageChange: (page: number) => void;
  }> = [
    { key: 'stays', title: 'Stays', all: stayPages, paged: pagedStayPages, onPageChange: setStaysPage },
    { key: 'pages', title: 'Pages', all: otherPages, paged: pagedOtherPages, onPageChange: setPagesPage },
    { key: 'text', title: 'Text', all: textPages, paged: pagedTextPages, onPageChange: setTextPage }
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) =>
        section.all.length ? (
          <EditIndexSection
            key={section.key}
            title={section.title}
            count={section.all.length}
            open={sectionsOpen[section.key]}
            onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, [section.key]: open }))}
            testId={`edit-index-section-${section.key}`}
          >
            {renderPagesCollection(section.paged.items)}
            <EditIndexPagination
              currentPage={section.paged.currentPage}
              totalPages={section.paged.totalPages}
              totalItems={section.all.length}
              pageSize={EDIT_INDEX_ITEMS_PER_PAGE}
              onPageChange={section.onPageChange}
            />
          </EditIndexSection>
        ) : null
      )}

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

      <MovePageDialog open={moveOpen} onOpenChange={handleMoveOpenChange} target={moveTarget} onMoved={handleMoved} />
      <DuplicatePageDialog open={duplicateOpen} onOpenChange={handleDuplicateOpenChange} source={duplicateSource} />
      <DeletePageDialog open={deleteOpen} onOpenChange={handleDeleteOpenChange} target={deleteTarget} onDeleted={handleDeleted} />
    </div>
  );
}

export function createPagesTab(): ContentTabDescriptor {
  return {
    key: 'pages',
    label: 'Pages',
    dataKey: 'pages',
    searchPlaceholder: 'Search pages by name or URL',
    sortPlaceholder: 'Sort pages',
    sortOptions: [
      { value: 'slug-asc', label: 'Name (A-Z)' },
      { value: 'updated-desc', label: 'Last updated' },
      { value: 'draft-desc', label: 'Last draft update' },
      { value: 'published-desc', label: 'Last published date' }
    ],
    defaultSort: 'slug-asc',
    columnSortMap: { name: 'slug-asc', updated: 'updated-desc', status: 'published-desc' },
    enginePagination: false,
    // Only offer the chapter filter on sites that actually define chapters.
    HeaderFilter: ASAP_CHAPTER_OPTIONS.length > 0 ? PagesChapterFilter : undefined,
    filterAndSort: (rows, query, sort, extraFilter) => filterAndSortPages(rows, query, sort, extraFilter),
    noMatchCopy: 'No pages match your current search.',
    NewAction: PagesNewAction,
    Body: PagesTabBody
  };
}
