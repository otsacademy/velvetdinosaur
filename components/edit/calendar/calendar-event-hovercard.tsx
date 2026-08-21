'use client';

import { useMemo } from 'react';
import { addMinutes, format } from 'date-fns';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { parseDateKey, toMinutes, type CalendarEvent } from '@/components/edit/calendar-workspace.shared';
import type { SiteEvent } from '@/lib/events';
import { EventHoverCard } from '@/components/events/event-hover-card';

function findFirstUrl(notes: string) {
  const match = (notes || '').match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : '';
}

function toTimeLabel(date: Date) {
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    .toLowerCase();
}

function toPreviewEvent(event: CalendarEvent): SiteEvent {
  const day = parseDateKey(event.dateKey);
  const startMinutes = toMinutes(event.time) ?? 9 * 60;
  const startDate = new Date(day);
  startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

  const endDate = addMinutes(startDate, Math.max(15, event.durationMin));
  const reviewLink = findFirstUrl(event.notes);
  const description = event.notes?.trim() || `Calendar ${event.eventType.replace(/-/g, ' ')}`;

  return {
    slug: `calendar-${event.id}`,
    title: event.title,
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    date: event.dateKey,
    startTime: toTimeLabel(startDate),
    endTime: toTimeLabel(endDate),
    dayOfWeek: format(startDate, 'EEE').toUpperCase(),
    location: event.location || 'Workspace',
    venue: event.location || 'Workspace',
    description,
    fullDescription: description,
    img: '/images/asap-admin-logo.jpg',
    category: 'Conference',
    tags: [],
    cost: event.allDay ? 'All day' : `${event.durationMin}m`,
    organizer: event.calendarName,
    featured: false,
    isHybrid: event.meetingType === 'hybrid',
    isVirtual: event.meetingType === 'online' || event.meetingType === 'hybrid',
    ticketUrl: reviewLink || undefined,
    status: 'published'
  };
}

export function CalendarEventHovercard({
  event,
  children
}: {
  event: CalendarEvent;
  children: React.ReactNode;
}) {
  const previewEvent = useMemo(() => toPreviewEvent(event), [event]);

  return (
    <HoverCard openDelay={120} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        sideOffset={10}
        align="start"
        className="w-auto border-none bg-transparent p-0 shadow-none"
      >
        <EventHoverCard eventItem={previewEvent} />
      </HoverCardContent>
    </HoverCard>
  );
}
