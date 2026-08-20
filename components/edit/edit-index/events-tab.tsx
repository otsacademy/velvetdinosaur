'use client';

import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EditIndexEventsTable } from '@/components/edit/edit-index-events-table';
import { EditIndexPagination } from '@/components/edit/edit-index-pagination';
import { filterAndSortEvents } from '@/components/edit/pages-index-events-helpers';
import type { EventRow, EventSortKey } from '@/components/edit/pages-index-types';
import {
  EDIT_INDEX_ITEMS_PER_PAGE,
  type ContentTabDescriptor,
  type EditIndexEngineContext,
  type TabBodyProps
} from '@/components/edit/edit-index/registry';

function EventsNewAction({ ctx, variant = 'outline' }: { ctx: EditIndexEngineContext; variant?: 'default' | 'outline' }) {
  if (ctx.mode === 'demo') {
    return (
      <Button
        variant={variant === 'outline' ? 'outline' : undefined}
        onClick={() => ctx.onDemoAction?.('Create an event')}
        data-testid="edit-index-add-event"
      >
        <CalendarPlus className="h-4 w-4" />
        New event
      </Button>
    );
  }
  return (
    <Button variant={variant === 'outline' ? 'outline' : undefined} asChild data-testid="edit-index-add-event">
      <Link href="/edit/events/new">
        <CalendarPlus className="h-4 w-4" />
        New event
      </Link>
    </Button>
  );
}

function EventsTabBody({ rows, pagedRows, page, totalPages, onPageChange, sort, onColumnSortClick, ctx }: TabBodyProps) {
  const router = useRouter();

  const handleDuplicate = (eventItem: EventRow) => {
    if (ctx.mode === 'demo') {
      ctx.onDemoAction?.('Duplicate an event');
      return;
    }
    router.push(`/edit/events/new?slug=${encodeURIComponent(eventItem.slug)}&duplicate=1`);
  };

  const handleDelete = async (eventItem: EventRow) => {
    if (ctx.mode === 'demo') {
      ctx.onDemoAction?.('Delete an event');
      return;
    }
    const confirmed = window.confirm(`Delete "${eventItem.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventItem.slug)}`, {
        method: 'DELETE'
      });
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

  return (
    <section className="space-y-3" aria-label="Events">
      <EditIndexEventsTable
        events={pagedRows as EventRow[]}
        eventSortKey={sort as EventSortKey}
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

export function createEventsTab(): ContentTabDescriptor {
  return {
    key: 'events',
    label: 'Events',
    dataKey: 'events',
    searchPlaceholder: 'Search events',
    sortPlaceholder: 'Sort events',
    sortOptions: [
      { value: 'updated-desc', label: 'Last updated' },
      { value: 'start-asc', label: 'Start date/time' },
      { value: 'title-asc', label: 'Title (A-Z)' },
      { value: 'status-asc', label: 'Status (A-Z)' }
    ],
    defaultSort: 'updated-desc',
    columnSortMap: { event: 'title-asc', status: 'status-asc', updated: 'updated-desc' },
    enginePagination: true,
    filterAndSort: (rows, query, sort) =>
      filterAndSortEvents({ events: rows as EventRow[], query, sortKey: sort as EventSortKey }),
    noMatchCopy: 'No events match your current search.',
    NewAction: EventsNewAction,
    Body: EventsTabBody
  };
}
