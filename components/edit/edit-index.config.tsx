'use client';

import { createPagesTab } from '@/components/edit/edit-index/pages-tab';
import { createWorkTab } from '@/components/edit/edit-index/work-tab';
import { createNewsTab } from '@/components/edit/edit-index/news-tab';
import { createEventsTab } from '@/components/edit/edit-index/events-tab';
import type { EditIndexEngineContext, EditIndexSiteConfig } from '@/components/edit/edit-index/registry';

/**
 * Site-owned edit-index configuration: which content tabs this site offers
 * and how the header actions / empty state compose them. The engine
 * (pages-index.client.tsx) and the shared tab modules are Sauro core;
 * the Work tab is Velvet Dinosaur's own registration.
 */

const pagesTab = createPagesTab();
const workTab = createWorkTab();
const newsTab = createNewsTab();
const eventsTab = createEventsTab();

function HeaderActions({ ctx }: { ctx: EditIndexEngineContext }) {
  const PagesNew = pagesTab.NewAction;
  const WorkNew = workTab.NewAction;
  const NewsNew = newsTab.NewAction;
  const EventsNew = eventsTab.NewAction;
  return (
    <>
      <PagesNew ctx={ctx} />
      <WorkNew ctx={ctx} variant="outline" />
      <NewsNew ctx={ctx} variant="outline" />
      <EventsNew ctx={ctx} variant="outline" />
    </>
  );
}

function EmptyState({ ctx }: { ctx: EditIndexEngineContext }) {
  const PagesNew = pagesTab.NewAction;
  const WorkNew = workTab.NewAction;
  return (
    <div className="rounded-[var(--vd-radius)] bg-[var(--vd-card)] p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--vd-fg)]">No content yet</h2>
        <p className="text-sm text-[var(--vd-muted-fg)]">
          Create a page or case study to start populating the editor.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PagesNew ctx={ctx} />
        <WorkNew ctx={ctx} variant="outline" />
      </div>
    </div>
  );
}

export const editIndexConfig: EditIndexSiteConfig = {
  heading: {
    title: 'Content',
    subtitle: 'Manage pages, work, news, and events in one place.'
  },
  tabs: [pagesTab, workTab, newsTab, eventsTab],
  HeaderActions,
  EmptyState
};
