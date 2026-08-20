'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarAgendaView } from '@/components/edit/calendar/calendar-agenda-view';
import { CalendarEventsView } from '@/components/edit/calendar/calendar-events-view';
import { CalendarEventHovercard } from '@/components/edit/calendar/calendar-event-hovercard';
import { cn } from '@/lib/utils';
import {
  toClock,
  toDateKey,
  toMinutes,
  type CalendarEvent,
  type CalendarSettingsState,
  type CalendarViewMode
} from '@/components/edit/calendar-workspace.shared';

function colorClass(token: string) {
  if (token === 'accent') return 'border-[var(--vd-accent)] bg-[var(--vd-accent)]/12';
  if (token === 'destructive') return 'border-[var(--destructive)] bg-[var(--destructive)]/12';
  if (token === 'muted') return 'border-[var(--vd-border)] bg-[var(--vd-muted)]/45';
  return 'border-[var(--vd-primary)] bg-[var(--vd-primary)]/12';
}

function toAccentColor(token: string) {
  if (token === 'accent') return 'var(--vd-accent)';
  if (token === 'destructive') return 'var(--destructive)';
  if (token === 'muted') return 'var(--vd-muted-fg)';
  return 'var(--vd-primary)';
}

function toSortedEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    return a.time.localeCompare(b.time);
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toMeridiem(totalHour: number) {
  const normalized = ((totalHour % 24) + 24) % 24;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const hour = normalized % 12 || 12;
  return `${hour} ${suffix}`;
}

function toMeridiemTime(totalMinutes: number) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hour = hour24 % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${hour24 >= 12 ? 'PM' : 'AM'}`;
}

type TimeGridCommitHandlers = {
  onMoveEvent: (event: CalendarEvent, next: { dateKey: string; time: string }) => void;
  onResizeEvent: (event: CalendarEvent, next: { durationMin: number }) => void;
};

type TimeGridProps = {
  days: Date[];
  settings: CalendarSettingsState;
  events: CalendarEvent[];
  selectedEventId: string;
  pendingEventId: string;
  onSelect: (event: CalendarEvent) => void;
  onCreateAt: (date: Date, startMinutes: number) => void;
  isEventEditable: (event: CalendarEvent) => boolean;
} & TimeGridCommitHandlers;

function TimeGrid({
  days,
  settings,
  events,
  selectedEventId,
  pendingEventId,
  onSelect,
  onCreateAt,
  isEventEditable,
  onMoveEvent,
  onResizeEvent
}: TimeGridProps) {
  const snapMinutes = settings.snapMinutes;
  const startHour = settings.workStartHour;
  const endHour = Math.max(settings.workStartHour + 1, settings.workEndHour);
  const hourHeight = settings.hourHeight;
  const startMinutes = startHour * 60;
  const endMinutes = (endHour + 1) * 60;
  const totalMinutes = endMinutes - startMinutes;
  const gridHeight = (totalMinutes / 60) * hourHeight;

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) {
      const key = toDateKey(day);
      map.set(
        key,
        toSortedEvents(events.filter((event) => event.dateKey === key))
      );
    }
    return map;
  }, [days, events]);

  const dragStateRef = useRef<
    | {
        mode: 'move';
        event: CalendarEvent;
        startClientX: number;
        startClientY: number;
        originalStartMin: number;
        originalDayIndex: number;
        originalDuration: number;
        dayWidth: number;
      }
    | {
        mode: 'resize';
        event: CalendarEvent;
        startClientY: number;
        originalStartMin: number;
        originalDuration: number;
      }
    | null
  >(null);

  const [dragPreview, setDragPreview] = useState<{
    eventId: string;
    dayIndex: number;
    startMin: number;
    durationMin: number;
  } | null>(null);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      if (dragState.mode === 'move') {
        const deltaY = event.clientY - dragState.startClientY;
        const deltaX = event.clientX - dragState.startClientX;
        const deltaMinutesRaw = (deltaY / hourHeight) * 60;
        const deltaMinutes = Math.round(deltaMinutesRaw / snapMinutes) * snapMinutes;
        const dayDelta = Math.round(deltaX / Math.max(dragState.dayWidth, 1));
        const dayIndex = clamp(dragState.originalDayIndex + dayDelta, 0, days.length - 1);
        const latestStart = endMinutes - Math.max(15, dragState.originalDuration);
        const startMin = clamp(dragState.originalStartMin + deltaMinutes, startMinutes, latestStart);

        setDragPreview({
          eventId: dragState.event.id,
          dayIndex,
          startMin,
          durationMin: dragState.originalDuration
        });
      } else {
        const deltaY = event.clientY - dragState.startClientY;
        const deltaMinutesRaw = (deltaY / hourHeight) * 60;
        const deltaMinutes = Math.round(deltaMinutesRaw / snapMinutes) * snapMinutes;
        const durationMin = clamp(
          dragState.originalDuration + deltaMinutes,
          15,
          endMinutes - dragState.originalStartMin
        );

        setDragPreview({
          eventId: dragState.event.id,
          dayIndex: days.findIndex((day) => toDateKey(day) === dragState.event.dateKey),
          startMin: dragState.originalStartMin,
          durationMin
        });
      }
    }

    function onPointerUp() {
      const dragState = dragStateRef.current;
      const preview = dragPreview;
      dragStateRef.current = null;

      if (!dragState || !preview) {
        setDragPreview(null);
        return;
      }

      if (dragState.mode === 'move') {
        const nextDay = days[preview.dayIndex];
        if (nextDay) {
          onMoveEvent(dragState.event, {
            dateKey: toDateKey(nextDay),
            time: toClock(preview.startMin)
          });
        }
      } else {
        onResizeEvent(dragState.event, {
          durationMin: preview.durationMin
        });
      }

      setDragPreview(null);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [days, dragPreview, endMinutes, hourHeight, onMoveEvent, onResizeEvent, snapMinutes, startMinutes]);

  const hours = Array.from({ length: endHour - startHour + 2 }, (_, index) => startHour + index);

  return (
    <ScrollArea className="h-[58vh]">
      <div className="min-w-[900px] rounded-[var(--vd-radius)] border border-[var(--vd-border)]">
        <div
          className={cn(
            'grid border-b border-[var(--vd-border)] bg-[var(--vd-muted)]/30',
            days.length === 1 ? 'grid-cols-[70px_minmax(0,1fr)]' : 'grid-cols-[70px_repeat(7,minmax(0,1fr))]'
          )}
        >
          <div className="p-2 text-xs text-[var(--vd-muted-fg)]">Time</div>
          {days.map((day) => (
            <div key={day.toISOString()} className="border-l border-[var(--vd-border)] p-2 text-xs font-medium text-[var(--vd-fg)]">
              {format(day, days.length === 1 ? 'EEEE, MMM d' : 'EEE d')}
            </div>
          ))}
        </div>

        <div
          className={cn(
            'grid',
            days.length === 1 ? 'grid-cols-[70px_minmax(0,1fr)]' : 'grid-cols-[70px_repeat(7,minmax(0,1fr))]'
          )}
          style={{ height: `${gridHeight}px` }}
        >
          <div className="relative border-r border-[var(--vd-border)]">
            {hours.map((hour, index) => {
              const top = (index / (hours.length - 1)) * gridHeight;
              return (
                <div key={hour} className="absolute left-0 right-0" style={{ top: `${top}px` }}>
                  <span className="-translate-y-1/2 px-2 text-[11px] text-[var(--vd-muted-fg)]">
                    {toMeridiem(hour)}
                  </span>
                </div>
              );
            })}
          </div>

          {days.map((day, dayIndex) => {
            const dayKey = toDateKey(day);
            const dayEvents = byDay.get(dayKey) || [];
            return (
              <div
                key={dayKey}
                className="relative border-l border-[var(--vd-border)]"
                data-day-index={dayIndex}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const relativeY = event.clientY - rect.top;
                  const minutesFromTop = (relativeY / Math.max(gridHeight, 1)) * totalMinutes + startMinutes;
                  const latestStart = endMinutes - Math.max(15, snapMinutes);
                  const snapped = clamp(
                    Math.round(minutesFromTop / snapMinutes) * snapMinutes,
                    startMinutes,
                    latestStart
                  );
                  onCreateAt(day, snapped);
                }}
              >
                {hours.map((_, index) => {
                  const top = (index / (hours.length - 1)) * gridHeight;
                  return (
                    <div
                      key={`${dayKey}-line-${index}`}
                      className="absolute left-0 right-0 border-t border-[var(--vd-border)]/50"
                      style={{ top: `${top}px` }}
                    />
                  );
                })}

                {dayEvents.map((event) => {
                  const eventStart = event.allDay ? startMinutes : toMinutes(event.time) ?? startMinutes;
                  const clampedStart = clamp(eventStart, startMinutes, endMinutes - 15);
                  const eventDuration = event.allDay ? 60 : Math.max(15, event.durationMin);
                  const editable = isEventEditable(event) && !event.allDay;

                  const preview = dragPreview?.eventId === event.id ? dragPreview : null;
                  const startMin = preview ? preview.startMin : clampedStart;
                  const durationMin = preview ? preview.durationMin : eventDuration;

                  const top = ((startMin - startMinutes) / totalMinutes) * gridHeight;
                  const height = Math.max((durationMin / totalMinutes) * gridHeight, 24);

                  const active = selectedEventId === event.id;
                  const dragging = dragPreview?.eventId === event.id;
                  const pending = pendingEventId === event.id;

                  return (
                    <article
                      key={event.id}
                      className={cn(
                        'absolute left-1 right-1 rounded-[var(--vd-radius)] border px-2 py-1 text-left text-xs shadow-sm transition',
                        colorClass(event.calendarColor),
                        editable ? 'cursor-move' : '',
                        active ? 'ring-2 ring-[var(--vd-ring)]' : '',
                        dragging ? 'opacity-80' : '',
                        pending ? 'opacity-50' : ''
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                      }}
                      onPointerDown={
                        editable
                          ? (pointerEvent) => {
                              const target = pointerEvent.currentTarget.parentElement;
                              const dayWidth = target?.clientWidth || 1;
                              dragStateRef.current = {
                                mode: 'move',
                                event,
                                startClientX: pointerEvent.clientX,
                                startClientY: pointerEvent.clientY,
                                originalStartMin: startMin,
                                originalDayIndex: dayIndex,
                                originalDuration: durationMin,
                                dayWidth
                              };
                            }
                          : undefined
                      }
                    >
                      <CalendarEventHovercard event={event}>
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={(clickEvent) => {
                            clickEvent.preventDefault();
                            clickEvent.stopPropagation();
                            onSelect(event);
                          }}
                        >
                          <p className="truncate font-medium text-[var(--vd-fg)]">{event.title}</p>
                          <p className="truncate text-[10px] text-[var(--vd-muted-fg)]">
                            {event.allDay ? 'All day' : `${toMeridiemTime(startMin)} · ${durationMin}m`}
                          </p>
                        </button>
                      </CalendarEventHovercard>

                      {editable ? (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize rounded-b-[var(--vd-radius)] bg-[var(--vd-fg)]/10"
                          onPointerDown={(pointerEvent) => {
                            pointerEvent.stopPropagation();
                            dragStateRef.current = {
                              mode: 'resize',
                              event,
                              startClientY: pointerEvent.clientY,
                              originalStartMin: startMin,
                              originalDuration: durationMin
                            };
                          }}
                        />
                      ) : null}
                    </article>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

function MonthView({
  date,
  events,
  selectedEventId,
  onSelect,
  onCreateAtDate,
  weekStartsOn
}: {
  date: Date;
  events: CalendarEvent[];
  selectedEventId: string;
  onSelect: (event: CalendarEvent) => void;
  onCreateAtDate: (date: Date) => void;
  weekStartsOn: 0 | 1;
}) {
  const weekdayLabels =
    weekStartsOn === 0
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const start = startOfWeek(startOfMonth(date), { weekStartsOn });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn });
  const days: Date[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(new Date(cursor));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/35">
        {weekdayLabels.map((label) => (
          <p
            key={label}
            className="border-r border-[var(--vd-border)] px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vd-muted-fg)] last:border-r-0"
          >
            {label}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayEvents = toSortedEvents(events.filter((event) => event.dateKey === key));
          const inMonth = day.getMonth() === date.getMonth();
          const today = isSameDay(day, new Date());
          return (
            <article
              key={key}
              className={cn(
                'group relative min-h-[132px] rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-2 transition-colors',
                inMonth ? 'bg-[var(--vd-card)]/70' : 'bg-[var(--vd-muted)]/20',
                today ? 'ring-1 ring-[var(--vd-ring)]' : '',
                'cursor-pointer hover:bg-[var(--vd-muted)]/40'
              )}
              onClick={() => onCreateAtDate(day)}
            >
              <button
                type="button"
                className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] text-[var(--vd-muted-fg)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--vd-fg)]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onCreateAtDate(day);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">Add event on {format(day, 'PPP')}</span>
              </button>

              <p className={cn('text-xs font-semibold', inMonth ? 'text-[var(--vd-fg)]' : 'text-[var(--vd-muted-fg)]')}>
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                    today
                      ? 'bg-[var(--vd-fg)] text-[var(--vd-bg)]'
                      : inMonth
                        ? 'text-[var(--vd-fg)]'
                        : 'text-[var(--vd-muted-fg)]'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </p>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <CalendarEventHovercard key={event.id} event={event}>
                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.preventDefault();
                        clickEvent.stopPropagation();
                        onSelect(event);
                      }}
                      className={cn(
                        'w-full rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/30 px-2 py-1.5 text-left text-xs transition-colors',
                        selectedEventId === event.id ? 'ring-1 ring-[var(--vd-ring)]' : 'hover:bg-[var(--vd-muted)]/50'
                      )}
                      style={{ borderLeftWidth: '4px', borderLeftColor: toAccentColor(event.calendarColor) }}
                    >
                      <p className="truncate font-medium text-[var(--vd-fg)]">{event.title}</p>
                      <p className="truncate text-[11px] text-[var(--vd-muted-fg)]">
                        {event.allDay ? 'All day' : `${toMeridiemTime(toMinutes(event.time) ?? 0)} · ${event.durationMin}m`}
                      </p>
                    </button>
                  </CalendarEventHovercard>
                ))}
                {dayEvents.length > 3 ? (
                  <p className="text-[11px] text-[var(--vd-muted-fg)]">+{dayEvents.length - 3} more</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

type CalendarViewsProps = {
  view: CalendarViewMode;
  currentDate: Date;
  events: CalendarEvent[];
  selectedEventId: string;
  pendingEventId: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateAtDateTime: (date: Date, startMinutes?: number) => void;
  isEventEditable: (event: CalendarEvent) => boolean;
  settings: CalendarSettingsState;
} & TimeGridCommitHandlers;

export function CalendarViews({
  view,
  currentDate,
  events,
  selectedEventId,
  pendingEventId,
  onSelectEvent,
  onCreateAtDateTime,
  isEventEditable,
  settings,
  onMoveEvent,
  onResizeEvent
}: CalendarViewsProps) {
  if (view === 'day') {
    return (
      <TimeGrid
        days={[currentDate]}
        settings={settings}
        events={events.filter((event) => event.dateKey === toDateKey(currentDate))}
        selectedEventId={selectedEventId}
        pendingEventId={pendingEventId}
        onSelect={onSelectEvent}
        onCreateAt={(date, startMinutes) => onCreateAtDateTime(date, startMinutes)}
        isEventEditable={isEventEditable}
        onMoveEvent={onMoveEvent}
        onResizeEvent={onResizeEvent}
      />
    );
  }

  if (view === 'week') {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: settings.weekStartsOn === 'Sunday' ? 0 : 1 });
    const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    return (
      <TimeGrid
        days={days}
        settings={settings}
        events={events}
        selectedEventId={selectedEventId}
        pendingEventId={pendingEventId}
        onSelect={onSelectEvent}
        onCreateAt={(date, startMinutes) => onCreateAtDateTime(date, startMinutes)}
        isEventEditable={isEventEditable}
        onMoveEvent={onMoveEvent}
        onResizeEvent={onResizeEvent}
      />
    );
  }

  if (view === 'agenda') {
    return <CalendarAgendaView events={events} selectedEventId={selectedEventId} onSelect={onSelectEvent} />;
  }

  if (view === 'events') {
    return <CalendarEventsView events={events} selectedEventId={selectedEventId} onSelect={onSelectEvent} />;
  }

  return (
    <MonthView
      date={currentDate}
      events={events}
      selectedEventId={selectedEventId}
      onSelect={onSelectEvent}
      onCreateAtDate={(date) => onCreateAtDateTime(date)}
      weekStartsOn={settings.weekStartsOn === 'Sunday' ? 0 : 1}
    />
  );
}
