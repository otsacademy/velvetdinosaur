'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Plus, Save, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import {
  buildEventDraft,
  createDemoCalendarSeed,
  createEmptyEventDraft,
  deriveAvailabilitySlots,
  deriveUpcomingEvents,
  formatDateLabel,
  getInitialDemoCalendarDate,
  getInitialSelectedEventId,
  hasEventConflict,
  normaliseDuration,
  parseAttendees,
  parseDateKey,
  sortCalendarEvents,
  toDateKey,
  type CalendarEvent,
  type EventDraft
} from '@/components/demo/calendar/demo-calendar.shared';
import { cn } from '@/lib/utils';

const ACTION_DELAY_MS = 140;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildEventTimestamp(dateKey: string, time: string) {
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : '10:00';
  return `${dateKey}T${safeTime}:00.000Z`;
}

function buildCalendarEvent(id: string, draft: EventDraft, dateKey: string): CalendarEvent {
  const timestamp = buildEventTimestamp(dateKey, draft.time.trim());
  return {
    id,
    title: draft.title.trim(),
    dateKey,
    time: draft.time.trim(),
    durationMin: normaliseDuration(draft.durationMin),
    location: draft.location.trim(),
    attendees: parseAttendees(draft.attendees),
    notes: draft.notes.trim(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function DemoCalendarWorkspace() {
  const initialEvents = useMemo(() => createDemoCalendarSeed(), []);
  const initialDate = useMemo(() => getInitialDemoCalendarDate(), []);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [events, setEvents] = useState(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState(() =>
    getInitialSelectedEventId(initialEvents, toDateKey(initialDate))
  );
  const [draft, setDraft] = useState<EventDraft>(() => createEmptyEventDraft());
  const [editDraft, setEditDraft] = useState<EventDraft>(() => createEmptyEventDraft());
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const nextEventIdRef = useRef(1);

  const selectedDateKey = toDateKey(selectedDate);

  const selectedDateEvents = useMemo(() => {
    return sortCalendarEvents(events.filter((event) => event.dateKey === selectedDateKey));
  }, [events, selectedDateKey]);

  const selectedEvent = useMemo(() => {
    return selectedDateEvents.find((event) => event.id === selectedEventId) ?? null;
  }, [selectedDateEvents, selectedEventId]);

  const upcoming = useMemo(() => deriveUpcomingEvents(events, selectedDateKey), [events, selectedDateKey]);
  const availabilitySlots = useMemo(() => deriveAvailabilitySlots(events, selectedDateKey), [events, selectedDateKey]);

  const eventDates = useMemo(() => {
    return Array.from(new Set(events.map((event) => event.dateKey))).map((dateKey) => parseDateKey(dateKey));
  }, [events]);

  useEffect(() => {
    if (!selectedEvent) {
      setEditDraft(createEmptyEventDraft());
      return;
    }

    setEditDraft(buildEventDraft(selectedEvent));
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedDateEvents.length) {
      setSelectedEventId('');
      if (formMode === 'edit') {
        setFormMode('new');
      }
      return;
    }

    if (selectedDateEvents.some((event) => event.id === selectedEventId)) return;
    setSelectedEventId(selectedDateEvents[0]?.id ?? '');
  }, [formMode, selectedDateEvents, selectedEventId]);

  useEffect(() => {
    if (formMode === 'edit' && !selectedEvent) {
      setFormMode('new');
    }
  }, [formMode, selectedEvent]);

  const createHasConflict = useMemo(() => {
    if (!draft.title.trim() && !draft.time.trim()) return false;
    return hasEventConflict(
      {
        time: draft.time.trim(),
        durationMin: normaliseDuration(draft.durationMin)
      },
      selectedDateEvents
    );
  }, [draft.durationMin, draft.time, draft.title, selectedDateEvents]);

  async function runAction(action: string, work: () => void, successMessage?: string) {
    setPendingAction(action);
    setErrorMessage('');

    try {
      await sleep(ACTION_DELAY_MS);
      work();
      if (successMessage) {
        toast.info(successMessage);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update this demonstration calendar.');
    } finally {
      setPendingAction('');
    }
  }

  async function addEvent() {
    const title = draft.title.trim();
    const time = draft.time.trim();
    if (!title || !time) {
      setErrorMessage('Title and time are required.');
      return;
    }

    const nextEvent = buildCalendarEvent(`demo-event-${nextEventIdRef.current++}`, draft, selectedDateKey);
    await runAction(
      'create',
      () => {
        setEvents((current) => sortCalendarEvents([...current, nextEvent]));
        setSelectedEventId(nextEvent.id);
        setFormMode('edit');
        setDraft(createEmptyEventDraft());
      },
      'This is a demonstration calendar, so nothing is saved.'
    );
  }

  async function saveSelected() {
    if (!selectedEvent) return;
    if (!editDraft.title.trim() || !editDraft.time.trim()) {
      setErrorMessage('Title and time are required.');
      return;
    }

    await runAction(
      'update',
      () => {
        setEvents((current) =>
          sortCalendarEvents(
            current.map((event) =>
              event.id === selectedEvent.id
                ? {
                    ...event,
                    title: editDraft.title.trim(),
                    time: editDraft.time.trim(),
                    durationMin: normaliseDuration(editDraft.durationMin),
                    location: editDraft.location.trim(),
                    attendees: parseAttendees(editDraft.attendees),
                    notes: editDraft.notes.trim(),
                    updatedAt: buildEventTimestamp(event.dateKey, editDraft.time.trim())
                  }
                : event
            )
          )
        );
      },
      'The event has been updated for this demonstration session only.'
    );
  }

  async function deleteSelected() {
    if (!selectedEvent) return;

    await runAction(
      'delete',
      () => {
        setEvents((current) => current.filter((event) => event.id !== selectedEvent.id));
        setSelectedEventId('');
        setFormMode('new');
      },
      'The event has been removed from this demonstration session.'
    );
  }

  return (
    <main className="space-y-6 py-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Calendar</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            {selectedDateEvents.length} events on {format(selectedDate, 'MMM d')} • {upcoming.length} upcoming next 7
            days
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vd-muted)] px-2.5 py-1 text-xs text-[var(--vd-muted-fg)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--vd-primary)]" />
          {format(selectedDate, 'EEE, MMM d')}
        </span>
      </div>

      {errorMessage ? (
        <p className="rounded-[var(--vd-radius)] border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid min-h-[72vh] overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:grid-cols-[320px_minmax(0,1fr)_360px]">
        <section className="border-b border-[var(--vd-border)] px-4 py-4 lg:border-b-0 lg:border-r">
          <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
            <CalendarDays className="h-4 w-4" />
            Date picker
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) setSelectedDate(date);
            }}
            modifiers={{ scheduled: eventDates }}
            modifiersClassNames={{
              scheduled:
                '[&>button]:border [&>button]:border-[color-mix(in_oklch,var(--vd-primary)_26%,var(--vd-border))] [&>button]:bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))]'
            }}
            className="w-full"
          />
        </section>

        <section className="flex min-h-0 flex-col border-b border-[var(--vd-border)] lg:border-b-0 lg:border-r">
          <div className="space-y-1 border-b border-[var(--vd-border)] px-4 py-4">
            <h2 className="text-lg font-semibold text-[var(--vd-fg)]">{formatDateLabel(selectedDate)}</h2>
            <p className="text-xs text-[var(--vd-muted-fg)]">Agenda</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {selectedDateEvents.length ? (
              selectedDateEvents.map((event) => {
                const active = selectedEventId === event.id;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setFormMode('edit');
                    }}
                    className={cn(
                      'relative w-full border-b border-[var(--vd-border)] px-4 py-3 text-left transition-colors hover:bg-[var(--vd-muted)]/30',
                      active ? 'bg-[var(--vd-muted)]/45' : ''
                    )}
                  >
                    <span
                      className={cn(
                        'absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--vd-primary)] transition-opacity',
                        active ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <p className="font-semibold text-[var(--vd-fg)]">{event.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--vd-muted-fg)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {event.time} ({event.durationMin}m)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location || 'TBD'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {event.attendees.length ? event.attendees.join(', ') : 'No attendees'}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-6 text-sm text-[var(--vd-muted-fg)]">No events on this day yet.</p>
            )}

            {upcoming.length ? (
              <div className="px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
                  Upcoming next 7 days
                </p>
                <div className="mt-2">
                  {upcoming.slice(0, 6).map((event) => (
                    <div key={event.id} className="border-b border-[var(--vd-border)] py-2 text-xs last:border-b-0">
                      <p className="font-medium text-[var(--vd-fg)]">{event.title}</p>
                      <p className="text-[var(--vd-muted-fg)]">
                        {event.dateKey} • {event.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto">
          <div className="border-b border-[var(--vd-border)] px-4 py-3">
            <div className="inline-flex rounded-full bg-[var(--vd-muted)] p-1">
              <DemoHelpTooltip content="Switch to the form for creating a new fictional event on the selected date.">
                <button
                  type="button"
                  onClick={() => setFormMode('new')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    formMode === 'new' ? 'bg-[var(--vd-card)] text-[var(--vd-fg)]' : 'text-[var(--vd-muted-fg)]'
                  )}
                >
                  New event
                </button>
              </DemoHelpTooltip>
              <DemoHelpTooltip content="Switch to editing mode for the event currently selected in the agenda column.">
                <button
                  type="button"
                  onClick={() => setFormMode('edit')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    formMode === 'edit' ? 'bg-[var(--vd-card)] text-[var(--vd-fg)]' : 'text-[var(--vd-muted-fg)]'
                  )}
                >
                  Edit event
                </button>
              </DemoHelpTooltip>
            </div>
          </div>

          {formMode === 'new' ? (
            <div className="space-y-3 px-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="demo-calendar-title">Title</Label>
                <Input
                  id="demo-calendar-title"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Event title"
                  className="border-[var(--vd-border)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="demo-calendar-time">Time</Label>
                  <Input
                    id="demo-calendar-time"
                    value={draft.time}
                    onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
                    placeholder="09:00"
                    className="border-[var(--vd-border)]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="demo-calendar-duration">Duration</Label>
                  <Input
                    id="demo-calendar-duration"
                    value={draft.durationMin}
                    onChange={(event) => setDraft((current) => ({ ...current, durationMin: event.target.value }))}
                    placeholder="60"
                    className="border-[var(--vd-border)]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="demo-calendar-location">Location</Label>
                <Input
                  id="demo-calendar-location"
                  value={draft.location}
                  onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Zoom or office"
                  className="border-[var(--vd-border)]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="demo-calendar-attendees">Attendees</Label>
                <Input
                  id="demo-calendar-attendees"
                  value={draft.attendees}
                  onChange={(event) => setDraft((current) => ({ ...current, attendees: event.target.value }))}
                  placeholder="Names or team"
                  className="border-[var(--vd-border)]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="demo-calendar-notes">Notes</Label>
                <Textarea
                  id="demo-calendar-notes"
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional notes"
                  className="min-h-[90px] border-[var(--vd-border)]"
                />
              </div>

              {createHasConflict ? (
                <p className="text-xs text-amber-700">This time overlaps an existing event.</p>
              ) : null}

              {availabilitySlots.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
                    Suggested free slots
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availabilitySlots.slice(0, 8).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, time: slot }))}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs',
                          draft.time === slot
                            ? 'bg-[var(--vd-primary)]/15 text-[var(--vd-fg)]'
                            : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]'
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <DemoHelpTooltip content="Add the event to the demo calendar for this session. It appears in the agenda immediately and clears on refresh.">
                <Button onClick={() => void addEvent()} disabled={pendingAction !== ''}>
                  <Plus className="h-4 w-4" />
                  {pendingAction === 'create' ? 'Adding…' : 'Add event'}
                </Button>
              </DemoHelpTooltip>
            </div>
          ) : (
            <div className="space-y-3 px-4 py-4">
              {selectedEvent ? (
                <>
                  <Input
                    value={editDraft.title}
                    onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Title"
                    className="border-[var(--vd-border)]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={editDraft.time}
                      onChange={(event) => setEditDraft((current) => ({ ...current, time: event.target.value }))}
                      placeholder="Time"
                      className="border-[var(--vd-border)]"
                    />
                    <Input
                      value={editDraft.durationMin}
                      onChange={(event) => setEditDraft((current) => ({ ...current, durationMin: event.target.value }))}
                      placeholder="Duration"
                      className="border-[var(--vd-border)]"
                    />
                  </div>
                  <Input
                    value={editDraft.location}
                    onChange={(event) => setEditDraft((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Location"
                    className="border-[var(--vd-border)]"
                  />
                  <Input
                    value={editDraft.attendees}
                    onChange={(event) => setEditDraft((current) => ({ ...current, attendees: event.target.value }))}
                    placeholder="Attendees"
                    className="border-[var(--vd-border)]"
                  />
                  <Textarea
                    value={editDraft.notes}
                    onChange={(event) => setEditDraft((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Notes"
                    className="min-h-[90px] border-[var(--vd-border)]"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <DemoHelpTooltip content="Save the edited time, attendees, or notes for this event inside the sandboxed calendar.">
                      <Button onClick={() => void saveSelected()} disabled={pendingAction !== ''}>
                        <Save className="h-4 w-4" />
                        {pendingAction === 'update' ? 'Saving…' : 'Save'}
                      </Button>
                    </DemoHelpTooltip>
                    <DemoHelpTooltip content="Remove the selected event from this demonstration session without affecting any live calendar.">
                      <Button variant="outline" onClick={() => void deleteSelected()} disabled={pendingAction !== ''}>
                        <Trash2 className="h-4 w-4" />
                        {pendingAction === 'delete' ? 'Deleting…' : 'Delete'}
                      </Button>
                    </DemoHelpTooltip>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--vd-muted-fg)]">Select an event from the agenda to edit it.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
