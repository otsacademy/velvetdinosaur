'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EditIndexHeaderBar } from '@/components/edit/edit-index-header-bar';
import { EditIndexSection } from '@/components/edit/edit-index-section';
import { EditIndexItem } from '@/components/edit/edit-index-item';
import { EditIndexTable } from '@/components/edit/edit-index-table';
import { EditIndexWorkTable } from '@/components/edit/edit-index-work-table';
import { EditIndexNewsTable } from '@/components/edit/edit-index-news-table';
import { EditIndexEventsTable } from '@/components/edit/edit-index-events-table';
import { filterAndSortEvents } from '@/components/edit/pages-index-events-helpers';
import { EditIndexPreviewSheet } from '@/components/edit/edit-index-preview-sheet';
import { DeletePageDialog, DuplicatePageDialog, NewPageDialog } from '@/components/edit/pages-index-dialogs';
import type {
  EventRow,
  EventSortKey,
  NewsArticleRow,
  NewsSortKey,
  PageRow,
  SectionKey,
  SortKey,
  ViewMode,
  WorkArticleRow
} from '@/components/edit/pages-index-types';
import { getSortValue, isStayPageSlug, isTextPageSlug, liveHref } from '@/components/edit/pages-index-utils';
import type { DemoRouteVariant } from '@/lib/demo-site';
import { cn } from '@/lib/utils';

type PagesIndexProps = {
  pages: PageRow[];
  workArticles: WorkArticleRow[];
  newsArticles?: NewsArticleRow[];
  events?: EventRow[];
  mode?: 'live' | 'demo';
  demoVariant?: DemoRouteVariant;
  platformAdmin?: boolean;
};

function parseTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

type NewsSortColumn = 'article' | 'status' | 'updated';
type EventSortColumn = 'event' | 'status' | 'updated';

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

function getWorkSortValue(article: WorkArticleRow, sortKey: SortKey) {
  if (sortKey === 'slug-asc') {
    return article.title.localeCompare(article.slug);
  }
  return Math.max(parseTime(article.updatedAt), parseTime(article.date), parseTime(article.pendingPublishRequestedAt));
}

export function PagesIndex({
  pages,
  workArticles,
  newsArticles = [],
  events = [],
  mode = 'live',
  demoVariant = 'host',
  platformAdmin = false
}: PagesIndexProps) {
  const router = useRouter();
  const isDemo = mode === 'demo';
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('slug-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sectionsOpen, setSectionsOpen] = useState<Record<SectionKey, boolean>>({
    stays: true,
    pages: true,
    text: true,
    work: true,
    news: true,
    events: true
  });
  const [newsSortKey, setNewsSortKey] = useState<NewsSortKey>('updated-desc');
  const [eventSortKey, setEventSortKey] = useState<EventSortKey>('updated-desc');
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'draft' | 'live'>('draft');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<PageRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PageRow | null>(null);

  const showDemoAction = (action: string) => {
    toast(action, {
      description: 'This public sandbox mirrors the real editor index, but write actions and deep editors stay disabled.'
    });
  };

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
  const filteredWorkArticles = useMemo(() => {
    const filtered = normalizedQuery
      ? workArticles.filter((article) => {
          const slugMatch = article.slug.toLowerCase().includes(normalizedQuery);
          const titleMatch = article.title.toLowerCase().includes(normalizedQuery);
          const tagMatch = article.tag.toLowerCase().includes(normalizedQuery);
          const authorMatch = article.authorName.toLowerCase().includes(normalizedQuery);
          return slugMatch || titleMatch || tagMatch || authorMatch;
        })
      : workArticles;

    return [...filtered].sort((a, b) => {
      if (sortKey === 'slug-asc') {
        return a.title.localeCompare(b.title);
      }
      return getWorkSortValue(b, sortKey) - getWorkSortValue(a, sortKey);
    });
  }, [normalizedQuery, sortKey, workArticles]);

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
    if (isDemo) {
      showDemoAction(`Preview /${pageSlug}`);
      return;
    }
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
    if (isDemo) {
      showDemoAction(`Duplicate /${page.slug}`);
      return;
    }
    setDuplicateSource(page);
    setDuplicateOpen(true);
  };

  const openDelete = (page: PageRow) => {
    if (isDemo) {
      showDemoAction(`Delete /${page.slug}`);
      return;
    }
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

  const filteredNewsArticles = useMemo(() => {
    const filtered = normalizedQuery
      ? newsArticles.filter((article) => {
          const slugMatch = article.slug.toLowerCase().includes(normalizedQuery);
          const titleMatch = article.title.toLowerCase().includes(normalizedQuery);
          const tagMatch = article.tag.toLowerCase().includes(normalizedQuery);
          return slugMatch || titleMatch || tagMatch;
        })
      : newsArticles;

    return [...filtered].sort((a, b) => {
      if (newsSortKey === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (newsSortKey === 'date-desc') {
        return (parseNewsTime(b.date) || parseNewsTime(b.updatedAt)) - (parseNewsTime(a.date) || parseNewsTime(a.updatedAt));
      }
      if (newsSortKey === 'status-asc') {
        const statusDelta = getNewsStatusSortValue(a) - getNewsStatusSortValue(b);
        if (statusDelta !== 0) return statusDelta;
      }
      return (parseNewsTime(b.updatedAt) || parseNewsTime(b.date)) - (parseNewsTime(a.updatedAt) || parseNewsTime(a.date));
    });
  }, [newsArticles, normalizedQuery, newsSortKey]);

  const filteredEvents = useMemo(
    () => filterAndSortEvents({ events, query: normalizedQuery, sortKey: eventSortKey }),
    [events, normalizedQuery, eventSortKey]
  );

  const handleNewsSortColumnClick = (column: NewsSortColumn) => {
    setNewsSortKey(column === 'article' ? 'title-asc' : column === 'status' ? 'status-asc' : 'updated-desc');
  };

  const handleEventSortColumnClick = (column: EventSortColumn) => {
    setEventSortKey(column === 'event' ? 'title-asc' : column === 'status' ? 'status-asc' : 'updated-desc');
  };

  const handleDuplicateNews = (article: NewsArticleRow) => {
    router.push(`/edit/news/new?slug=${encodeURIComponent(article.slug)}&duplicate=1`);
  };

  const handleDeleteNews = async (article: NewsArticleRow) => {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/news/articles/${encodeURIComponent(article.slug)}`, { method: 'DELETE' });
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

  const handleDuplicateEvent = (eventItem: EventRow) => {
    router.push(`/edit/events/new?slug=${encodeURIComponent(eventItem.slug)}&duplicate=1`);
  };

  const handleDeleteEvent = async (eventItem: EventRow) => {
    if (!window.confirm(`Delete "${eventItem.title}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventItem.slug)}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : 'Delete failed');
      }
      toast.success(`Deleted /events/${eventItem.slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete event');
    }
  };

  const totalCount = pages.length + workArticles.length + newsArticles.length + events.length;
  const filteredCount =
    filteredPages.length + filteredWorkArticles.length + filteredNewsArticles.length + filteredEvents.length;

  return (
    <main className={cn('min-h-screen bg-[var(--vd-bg)] pb-12', isDemo && 'vd-demo-editor')}>
      <div
        className={cn(
          'sticky top-0 z-30 border-b border-[var(--vd-border)] bg-[var(--vd-bg)]/95 backdrop-blur',
          isDemo && 'vd-demo-toolbar-shell'
        )}
      >
        <div className={cn('container py-5', isDemo && 'relative z-10')}>
          <EditIndexHeaderBar
            query={query}
            onQueryChange={setQuery}
            sortKey={sortKey}
            onSortChange={setSortKey}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filteredCount={filteredCount}
            totalCount={totalCount}
            hasContractsPage={hasContractsPage}
            mode={mode}
            demoVariant={demoVariant}
            platformAdmin={platformAdmin}
            onDemoAction={showDemoAction}
            onNewPage={() => {
              if (isDemo) {
                showDemoAction('Create a new page');
                return;
              }
              setNewOpen(true);
            }}
            onNewWorkArticle={() => {
              if (isDemo) {
                showDemoAction('Create a new work article');
                return;
              }
              router.push('/edit/work/new');
            }}
          />
        </div>
      </div>

      <div className={cn('container space-y-8 py-8', isDemo && 'vd-demo-editor-content')}>
        {totalCount === 0 ? (
          <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--vd-fg)]">No content yet</h2>
              <p className="text-sm text-[var(--vd-muted-fg)]">
                Create a page or case study to start populating the editor.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => (isDemo ? showDemoAction('Create a new page') : setNewOpen(true))}>New page</Button>
              <Button
                variant="outline"
                onClick={() => (isDemo ? showDemoAction('Create a new work article') : router.push('/edit/work/new'))}
              >
                New work article
              </Button>
            </div>
          </div>
        ) : filteredCount === 0 ? (
          <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--vd-fg)]">No matches</h2>
              <p className="text-sm text-[var(--vd-muted-fg)]">Try a different search term or reset the filters.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setQuery('')}>
                Clear filters
              </Button>
              <Button onClick={() => (isDemo ? showDemoAction('Create a new page') : setNewOpen(true))}>New page</Button>
              <Button
                variant="outline"
                onClick={() => (isDemo ? showDemoAction('Create a new work article') : router.push('/edit/work/new'))}
              >
                New work article
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredWorkArticles.length ? (
              <EditIndexSection
                title="Work"
                count={filteredWorkArticles.length}
                open={sectionsOpen.work}
                onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, work: open }))}
                mode={mode}
                animationIndex={0}
                testId="edit-index-section-work"
              >
                <EditIndexWorkTable
                  articles={filteredWorkArticles}
                  viewMode={viewMode}
                  mode={mode}
                  onDemoAction={showDemoAction}
                />
              </EditIndexSection>
            ) : null}
            <EditIndexSection
              title="News"
              count={filteredNewsArticles.length}
              open={sectionsOpen.news}
              onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, news: open }))}
              mode={mode}
              animationIndex={1}
              testId="edit-index-section-news"
            >
              <div className="mb-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (isDemo ? showDemoAction('Create a news article') : router.push('/edit/news/new'))}
                >
                  New article
                </Button>
              </div>
              {filteredNewsArticles.length ? (
                <EditIndexNewsTable
                  articles={filteredNewsArticles}
                  newsSortKey={newsSortKey}
                  onSortColumnClick={handleNewsSortColumnClick}
                  viewMode={viewMode}
                  onDuplicate={handleDuplicateNews}
                  onDelete={handleDeleteNews}
                />
              ) : (
                <p className="text-sm text-[var(--vd-muted-fg)]">No news articles yet.</p>
              )}
            </EditIndexSection>
            <EditIndexSection
              title="Events"
              count={filteredEvents.length}
              open={sectionsOpen.events}
              onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, events: open }))}
              mode={mode}
              animationIndex={1}
              testId="edit-index-section-events"
            >
              <div className="mb-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (isDemo ? showDemoAction('Create an event') : router.push('/edit/events/new'))}
                >
                  New event
                </Button>
              </div>
              {filteredEvents.length ? (
                <EditIndexEventsTable
                  events={filteredEvents}
                  eventSortKey={eventSortKey}
                  onSortColumnClick={handleEventSortColumnClick}
                  viewMode={viewMode}
                  onDuplicate={handleDuplicateEvent}
                  onDelete={handleDeleteEvent}
                />
              ) : (
                <p className="text-sm text-[var(--vd-muted-fg)]">No events yet.</p>
              )}
            </EditIndexSection>
            {stayPages.length ? (
              <EditIndexSection
                title="Stays"
                count={stayPages.length}
                open={sectionsOpen.stays}
                onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, stays: open }))}
                mode={mode}
                animationIndex={1}
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
                    mode={mode}
                    onDemoAction={showDemoAction}
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
                        mode={mode}
                        onDemoAction={showDemoAction}
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
                mode={mode}
                animationIndex={2}
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
                    mode={mode}
                    onDemoAction={showDemoAction}
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
                        mode={mode}
                        onDemoAction={showDemoAction}
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
                mode={mode}
                animationIndex={3}
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
                    mode={mode}
                    onDemoAction={showDemoAction}
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
                        mode={mode}
                        onDemoAction={showDemoAction}
                      />
                    ))}
                  </div>
                )}
              </EditIndexSection>
            ) : null}
          </div>
        )}
      </div>

      {isDemo ? null : (
        <>
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
        </>
      )}
    </main>
  );
}
