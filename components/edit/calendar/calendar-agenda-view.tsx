'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CalendarEventHovercard } from '@/components/edit/calendar/calendar-event-hovercard';
import { cn } from '@/lib/utils';
import { parseDateKey, type CalendarEvent } from '@/components/edit/calendar-workspace.shared';

type CalendarAgendaViewProps = {
  events: CalendarEvent[];
  selectedEventId: string;
  onSelect: (event: CalendarEvent) => void;
};

function eventTypeLabel(value: CalendarEvent['eventType']) {
  if (value === 'out-of-office') return 'Out of Office';
  return value[0].toUpperCase() + value.slice(1);
}

function colorClass(token: string) {
  if (token === 'accent') return 'border-[var(--vd-accent)] bg-[var(--vd-accent)]/12';
  if (token === 'destructive') return 'border-[var(--destructive)] bg-[var(--destructive)]/12';
  if (token === 'muted') return 'border-[var(--vd-border)] bg-[var(--vd-muted)]/45';
  return 'border-[var(--vd-primary)] bg-[var(--vd-primary)]/12';
}

function toSortedEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    return a.time.localeCompare(b.time);
  });
}

export function CalendarAgendaView({ events, selectedEventId, onSelect }: CalendarAgendaViewProps) {
  const sorted = toSortedEvents(events);
  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of sorted) {
    const list = grouped.get(event.dateKey) || [];
    list.push(event);
    grouped.set(event.dateKey, list);
  }

  if (!sorted.length) {
    return (
      <p className="rounded-[var(--vd-radius)] border border-dashed border-[var(--vd-border)] p-4 text-sm text-[var(--vd-muted-fg)]">
        No events in this range.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
        <section key={dateKey} className="space-y-2">
          <p className="text-sm font-semibold text-[var(--vd-fg)]">{format(parseDateKey(dateKey), 'EEEE, MMM d')}</p>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  'rounded-[var(--vd-radius)] border p-3',
                  colorClass(event.calendarColor),
                  selectedEventId === event.id ? 'ring-1 ring-[var(--vd-ring)]' : ''
                )}
              >
                <CalendarEventHovercard event={event}>
                  <button type="button" className="w-full text-left" onClick={() => onSelect(event)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--vd-fg)]">{event.title}</p>
                      <Badge className="border-[var(--vd-border)] bg-[var(--vd-muted)] text-[10px] text-[var(--vd-fg)]">
                        {eventTypeLabel(event.eventType)}
                      </Badge>
                      <Badge className="border-[var(--vd-border)] bg-[var(--vd-muted)] text-[10px] text-[var(--vd-fg)]">
                        {event.calendarName}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      {event.allDay ? 'All day' : `${event.time} · ${event.durationMin}m`}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  </button>
                </CalendarEventHovercard>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
