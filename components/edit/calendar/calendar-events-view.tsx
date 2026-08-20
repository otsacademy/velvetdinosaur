'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CalendarEventHovercard } from '@/components/edit/calendar/calendar-event-hovercard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { parseDateKey, toMinutes, type CalendarEvent } from '@/components/edit/calendar-workspace.shared';

type CalendarEventsViewProps = {
  events: CalendarEvent[];
  selectedEventId: string;
  onSelect: (event: CalendarEvent) => void;
};

function eventTypeLabel(value: CalendarEvent['eventType']) {
  if (value === 'out-of-office') return 'Out of Office';
  return value[0].toUpperCase() + value.slice(1);
}

function toAccentColor(token: string) {
  if (token === 'accent') return 'var(--vd-accent)';
  if (token === 'destructive') return 'var(--destructive)';
  if (token === 'muted') return 'var(--vd-muted-fg)';
  return 'var(--vd-primary)';
}

function toFriendlyTime(clock: string) {
  const totalMinutes = toMinutes(clock);
  if (totalMinutes == null) return clock;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function sortedEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    return a.time.localeCompare(b.time);
  });
}

export function CalendarEventsView({ events, selectedEventId, onSelect }: CalendarEventsViewProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CalendarEvent['eventType']>('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortedEvents(events).filter((event) => {
      if (typeFilter !== 'all' && event.eventType !== typeFilter) return false;
      if (!needle) return true;
      const haystack = [event.title, event.location, event.calendarName, event.category, event.notes, event.attendees.join(' ')]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [events, query, typeFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events, locations, guests, or notes"
          className="min-w-[220px] flex-1"
        />
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="reminder">Reminder</SelectItem>
            <SelectItem value="out-of-office">Out of Office</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length ? (
        <div className="space-y-2">
          {filtered.map((event) => {
            const active = selectedEventId === event.id;
            const dateLabel = format(parseDateKey(event.dateKey), 'EEE, MMM d');
            const timeLabel = event.allDay ? 'All day' : `${toFriendlyTime(event.time)} · ${event.durationMin}m`;
            return (
              <CalendarEventHovercard key={event.id} event={event}>
                <button
                  type="button"
                  onClick={() => onSelect(event)}
                  className={cn(
                    'w-full rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]/50 px-3 py-2 text-left transition',
                    active ? 'ring-1 ring-[var(--vd-ring)]' : 'hover:bg-[var(--vd-muted)]/30'
                  )}
                  style={{ borderLeftWidth: '4px', borderLeftColor: toAccentColor(event.calendarColor) }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--vd-fg)]">{event.title}</p>
                      <p className="text-xs text-[var(--vd-muted-fg)]">
                        {dateLabel} · {timeLabel}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className="border-[var(--vd-border)] bg-[var(--vd-muted)] text-[10px] text-[var(--vd-fg)]">
                        {eventTypeLabel(event.eventType)}
                      </Badge>
                      <Badge className="border-[var(--vd-border)] bg-[var(--vd-muted)] text-[10px] text-[var(--vd-fg)]">
                        {event.calendarName}
                      </Badge>
                    </div>
                  </div>
                </button>
              </CalendarEventHovercard>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[var(--vd-radius)] border border-dashed border-[var(--vd-border)] p-4 text-sm text-[var(--vd-muted-fg)]">
          No matching events for this filter.
        </p>
      )}
    </div>
  );
}
