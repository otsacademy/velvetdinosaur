'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  changeDateByView,
  dateRangeForView,
  defaultEventDraft,
  DEFAULT_CALENDARS,
  DEFAULT_SETTINGS,
  formatDateLabel,
  readJson,
  toClock,
  toDateKey,
  toMinutes,
  type CalendarEvent,
  type CalendarRecord,
  type CalendarSettingsState,
  type CalendarViewMode,
  type EventDraft
} from '@/components/edit/calendar-workspace.shared';
import { CalendarEventDialog } from '@/components/edit/calendar/calendar-event-dialog';
import { CalendarAddDialog } from '@/components/edit/calendar/calendar-add-dialog';
import { CalendarEventSummary } from '@/components/edit/calendar/calendar-event-summary';
import { cn } from '@/lib/utils';
import {
  calendarKey,
  buildDraftFromEvent,
  mergeCalendars,
  normalizeApiCalendars,
  toApiPayload,
  type CalendarApiItem
} from '@/components/edit/calendar/calendar-workspace.helpers';
import { CalendarSettingsDialog } from '@/components/edit/calendar/calendar-settings-dialog';
import { CalendarSidebar } from '@/components/edit/calendar/calendar-sidebar';
import { CalendarToolbar } from '@/components/edit/calendar/calendar-toolbar';
import { CalendarViews } from '@/components/edit/calendar/calendar-views';
import { WorkspaceScopeNotice } from '@/components/edit/workspace-scope-notice';

export function CalendarWorkspace() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarViewMode>('month');
  const [viewerId, setViewerId] = useState('self');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarRecord[]>(DEFAULT_CALENDARS);
  const [settings, setSettings] = useState<CalendarSettingsState>(DEFAULT_SETTINGS);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [addCalendarOpen, setAddCalendarOpen] = useState(false);
  const [draft, setDraft] = useState<EventDraft>(
    defaultEventDraft(new Date(), DEFAULT_CALENDARS, DEFAULT_SETTINGS.defaultMeetingDuration)
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [pendingEventId, setPendingEventId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('asap.calendar.settings');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CalendarSettingsState>;
      setSettings((current) => ({ ...current, ...parsed }));
      if (parsed.defaultView) {
        const mapped = parsed.defaultView.toLowerCase();
        if (mapped === 'day' || mapped === 'week' || mapped === 'month' || mapped === 'agenda' || mapped === 'events') {
          setView(mapped);
        }
      }
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('asap.calendar.settings', JSON.stringify(settings));
    } catch {
      // Ignore storage failures.
    }
  }, [settings]);

  const loadCalendars = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/calendars', {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await readJson(response)) as {
        items?: unknown[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload?.error || 'Unable to load calendars');

      const incoming = normalizeApiCalendars(Array.isArray(payload.items) ? payload.items : []);
      const nextViewerId = incoming.find((item) => item.owned)?.ownerUserId || viewerId;
      setViewerId(nextViewerId);
      setCalendars((current) => mergeCalendars(current, incoming, [], nextViewerId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load calendars');
    }
  }, [viewerId]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const range = dateRangeForView(selectedDate, view);
      const params = new URLSearchParams();
      params.set('from', range.from);
      params.set('to', range.to);
      const response = await fetch(`/api/calendar/events?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await readJson(response)) as {
        viewerId?: string;
        items?: CalendarEvent[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload?.error || 'Unable to load events');

      const nextViewerId = String(payload.viewerId || '').trim() || viewerId;
      const items = Array.isArray(payload.items) ? payload.items : [];
      setViewerId(nextViewerId);
      setEvents(items);
      setCalendars((current) => mergeCalendars(current, [], items, nextViewerId));
      setSelectedEventId((current) => {
        if (items.some((item) => item.id === current)) return current;
        return items[0]?.id || '';
      });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, view, viewerId]);

  const refreshWorkspace = useCallback(async () => {
    await Promise.all([loadCalendars(), loadEvents()]);
  }, [loadCalendars, loadEvents]);

  useEffect(() => {
    void loadCalendars();
  }, [loadCalendars]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const calendarLookup = useMemo(() => {
    return new Map(calendars.map((calendar) => [calendar.id, calendar]));
  }, [calendars]);

  const editableCalendars = useMemo(() => {
    return calendars.filter((calendar) => calendar.role === 'edit');
  }, [calendars]);

  const visibleCalendarIds = useMemo(() => {
    return new Set(calendars.filter((calendar) => calendar.visible).map((calendar) => calendar.id));
  }, [calendars]);

  const isEventEditable = useCallback(
    (event: CalendarEvent) => {
      const key = calendarKey(event.calendarOwnerId, event.calendarId);
      return calendarLookup.get(key)?.role === 'edit';
    },
    [calendarLookup]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const key = calendarKey(event.calendarOwnerId, event.calendarId);
      return visibleCalendarIds.has(key);
    });
  }, [events, visibleCalendarIds]);

  const selectedEvent = useMemo(() => {
    return filteredEvents.find((event) => event.id === selectedEventId) || null;
  }, [filteredEvents, selectedEventId]);

  const selectedEventCalendar = useMemo(() => {
    if (!selectedEvent) return null;
    const key = calendarKey(selectedEvent.calendarOwnerId, selectedEvent.calendarId);
    return calendarLookup.get(key) || null;
  }, [calendarLookup, selectedEvent]);

  const selectedEventEditable = selectedEvent ? isEventEditable(selectedEvent) : false;

  const onSelectEvent = (event: CalendarEvent) => {
    setSelectedEventId(event.id);
  };

  const openCreateDialogAt = useCallback(
    (date: Date, startMinutes?: number) => {
      if (!editableCalendars.length) {
        setErrorMessage('No editable calendar is available for creating events.');
        return;
      }

      const dateKey = toDateKey(date);
      const baseDraft = defaultEventDraft(date, editableCalendars, settings.defaultMeetingDuration);
      const fallbackStart = toMinutes(baseDraft.startTime) ?? 10 * 60;
      const normalizedStartRaw = startMinutes ?? fallbackStart;
      const normalizedStart = Math.min(
        Math.max(0, Math.round(normalizedStartRaw / settings.snapMinutes) * settings.snapMinutes),
        24 * 60 - settings.snapMinutes
      );
      const duration = Math.max(15, settings.defaultMeetingDuration);
      const endMinutes = Math.min(normalizedStart + duration, 23 * 60 + 59);

      setSelectedDate(date);
      setDialogMode('create');
      setDraft({
        ...baseDraft,
        startDateKey: dateKey,
        endDateKey: dateKey,
        startTime: toClock(normalizedStart),
        endTime: toClock(endMinutes)
      });
      setDialogOpen(true);
    },
    [editableCalendars, settings.defaultMeetingDuration, settings.snapMinutes]
  );

  const openCreateDialog = () => {
    openCreateDialogAt(selectedDate);
  };

  const openEditDialog = () => {
    if (!selectedEvent) return;
    if (!selectedEventEditable) {
      setErrorMessage('This event is in a read-only calendar.');
      return;
    }
    setDialogMode('edit');
    setDraft(buildDraftFromEvent(selectedEvent, calendars));
    setDialogOpen(true);
  };

  const onAddCalendar = async (input: { label: string; color: string }) => {
    setPendingAction('add-calendar');
    try {
      const response = await fetch('/api/calendar/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label: input.label, color: input.color })
      });
      const payload = (await readJson(response)) as {
        error?: string;
        item?: CalendarApiItem;
      };
      if (!response.ok) throw new Error(payload?.error || 'Unable to create calendar');

      const incoming = normalizeApiCalendars(payload.item ? [payload.item] : []);
      setCalendars((current) => mergeCalendars(current, incoming, [], viewerId));
      setAddCalendarOpen(false);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create calendar');
    } finally {
      setPendingAction('');
    }
  };

  const onShareCalendar = async (calendar: CalendarRecord) => {
    const rawEmail = window.prompt(`Share \"${calendar.label}\" with email`);
    if (!rawEmail) return;
    const email = rawEmail.trim().toLowerCase();
    if (!email) return;

    const canEdit = window.confirm('Grant edit access? Click Cancel for view-only access.');

    setPendingAction('share-calendar');
    try {
      const response = await fetch(
        `/api/calendar/calendars/${encodeURIComponent(calendar.calendarId)}/share`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, role: canEdit ? 'edit' : 'view' })
        }
      );
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload?.error || 'Unable to share calendar');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to share calendar');
    } finally {
      setPendingAction('');
    }
  };

  const toggleCalendar = (id: string) => {
    setCalendars((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, visible: !entry.visible } : entry))
    );
  };

  const submitEvent = async () => {
    if (!draft.title.trim()) {
      setErrorMessage('Event title is required.');
      return;
    }
    if (!draft.startDateKey.trim()) {
      setErrorMessage('Start date is required.');
      return;
    }

    const selectedCalendar = calendars.find((calendar) => calendar.id === draft.calendarId);
    if (!selectedCalendar || selectedCalendar.role !== 'edit') {
      setErrorMessage('Select an editable calendar.');
      return;
    }

    if (dialogMode === 'edit' && (!selectedEvent || !selectedEventEditable)) {
      setErrorMessage('This event is not editable.');
      return;
    }

    setPendingAction(dialogMode === 'create' ? 'create' : 'update');
    try {
      const payload = toApiPayload(draft, calendars);
      const endpoint =
        dialogMode === 'create'
          ? '/api/calendar/events'
          : `/api/calendar/events/${encodeURIComponent(String(selectedEvent?.id || ''))}`;
      const method = dialogMode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const result = (await readJson(response)) as { error?: string; item?: CalendarEvent };
      if (!response.ok) throw new Error(result?.error || 'Unable to save event');

      setDialogOpen(false);
      if (result.item?.id) setSelectedEventId(result.item.id);
      await refreshWorkspace();
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save event');
    } finally {
      setPendingAction('');
    }
  };

  const deleteSelected = async () => {
    if (!selectedEvent) return;
    if (!selectedEventEditable) {
      setErrorMessage('This event is in a read-only calendar.');
      return;
    }

    setPendingAction('delete');
    try {
      const response = await fetch(`/api/calendar/events/${encodeURIComponent(selectedEvent.id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(result?.error || 'Unable to delete event');
      setSelectedEventId('');
      await loadEvents();
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete event');
    } finally {
      setPendingAction('');
    }
  };

  const moveEvent = useCallback(
    async (event: CalendarEvent, next: { dateKey: string; time: string }) => {
      if (!isEventEditable(event)) return;
      const previous = { dateKey: event.dateKey, time: event.time };

      setPendingEventId(event.id);
      setEvents((current) =>
        current.map((entry) =>
          entry.id === event.id ? { ...entry, dateKey: next.dateKey, time: next.time } : entry
        )
      );

      try {
        const response = await fetch(`/api/calendar/events/${encodeURIComponent(event.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ dateKey: next.dateKey, time: next.time })
        });
        const result = (await readJson(response)) as { error?: string; item?: CalendarEvent };
        if (!response.ok) throw new Error(result?.error || 'Unable to move event');

        if (result.item?.id) {
          setEvents((current) =>
            current.map((entry) => (entry.id === result.item?.id ? result.item : entry))
          );
        }
        await loadEvents();
      } catch (error) {
        setEvents((current) =>
          current.map((entry) =>
            entry.id === event.id
              ? { ...entry, dateKey: previous.dateKey, time: previous.time }
              : entry
          )
        );
        setErrorMessage(error instanceof Error ? error.message : 'Unable to move event');
      } finally {
        setPendingEventId('');
      }
    },
    [isEventEditable, loadEvents]
  );

  const resizeEvent = useCallback(
    async (event: CalendarEvent, next: { durationMin: number }) => {
      if (!isEventEditable(event)) return;
      const previousDuration = event.durationMin;

      setPendingEventId(event.id);
      setEvents((current) =>
        current.map((entry) =>
          entry.id === event.id ? { ...entry, durationMin: next.durationMin } : entry
        )
      );

      try {
        const response = await fetch(`/api/calendar/events/${encodeURIComponent(event.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ durationMin: next.durationMin })
        });
        const result = (await readJson(response)) as { error?: string; item?: CalendarEvent };
        if (!response.ok) throw new Error(result?.error || 'Unable to resize event');

        if (result.item?.id) {
          setEvents((current) =>
            current.map((entry) => (entry.id === result.item?.id ? result.item : entry))
          );
        }
        await loadEvents();
      } catch (error) {
        setEvents((current) =>
          current.map((entry) =>
            entry.id === event.id ? { ...entry, durationMin: previousDuration } : entry
          )
        );
        setErrorMessage(error instanceof Error ? error.message : 'Unable to resize event');
      } finally {
        setPendingEventId('');
      }
    },
    [isEventEditable, loadEvents]
  );

  const dialogCalendars = editableCalendars.length ? editableCalendars : calendars;
  const statusMessage = pendingEventId
    ? 'Saving drag/resize changes…'
    : pendingAction === 'add-calendar'
      ? 'Creating calendar…'
      : pendingAction === 'share-calendar'
        ? 'Sharing calendar…'
        : '';

  return (
    <main className="space-y-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--vd-fg)] md:text-3xl">Calendar</h1>
      </div>

      <WorkspaceScopeNotice
        title="Shared calendar"
        description="Use this calendar for shared events, reminders, and operational scheduling. It is not a personal calendar."
        icon={CalendarDays}
      />

      {errorMessage ? (
        <p className="rounded-[var(--vd-radius)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid min-h-[72vh] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <CalendarSidebar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          calendars={calendars}
          onToggleCalendar={toggleCalendar}
          onAddCalendar={() => setAddCalendarOpen(true)}
          onShareCalendar={(calendar) => void onShareCalendar(calendar)}
        />

        <div className="space-y-4">
          <CalendarToolbar
            dateLabel={formatDateLabel(selectedDate, view)}
            view={view}
            onChangeView={setView}
            onPrev={() => setSelectedDate((current) => changeDateByView(current, view, 'prev'))}
            onNext={() => setSelectedDate((current) => changeDateByView(current, view, 'next'))}
            onToday={() => setSelectedDate(new Date())}
            onOpenEvents={() => setView('events')}
            onOpenSettings={() => setSettingsOpen(true)}
            showZoom={view === 'day' || view === 'week'}
            hourHeight={settings.hourHeight}
            onChangeHourHeight={(nextHeight) =>
              setSettings((current) => ({ ...current, hourHeight: nextHeight }))
            }
            onOpenCreate={openCreateDialog}
          />

          <Card className="p-0">
            <CardContent className="p-5">
              <div className={cn('grid gap-4', selectedEvent ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : '')}>
                <div className="space-y-4">
                  {isLoading ? (
                    <p className="text-xs text-[var(--vd-muted-fg)]">Loading events…</p>
                  ) : null}

                  <CalendarViews
                    view={view}
                    currentDate={selectedDate}
                    events={filteredEvents}
                    selectedEventId={selectedEventId}
                    pendingEventId={pendingEventId}
                    onSelectEvent={onSelectEvent}
                    onCreateAtDateTime={openCreateDialogAt}
                    isEventEditable={isEventEditable}
                    settings={settings}
                    onMoveEvent={(event, next) => void moveEvent(event, next)}
                    onResizeEvent={(event, next) => void resizeEvent(event, next)}
                  />
                </div>

                {selectedEvent ? (
                  <div className="xl:sticky xl:top-4">
                    <CalendarEventSummary
                      event={selectedEvent}
                      calendarLabel={selectedEventCalendar?.label || selectedEvent.calendarName}
                      calendarColor={selectedEventCalendar?.color || selectedEvent.calendarColor}
                      editable={selectedEventEditable}
                      pendingAction={pendingAction}
                      onEdit={openEditDialog}
                      onDelete={() => void deleteSelected()}
                    />
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        draft={draft}
        onChangeDraft={setDraft}
        calendars={dialogCalendars}
        isSaving={pendingAction === 'create' || pendingAction === 'update'}
        onSubmit={() => void submitEvent()}
        mode={dialogMode}
      />
      <CalendarAddDialog
        key={addCalendarOpen ? 'calendar-add-open' : 'calendar-add-closed'}
        open={addCalendarOpen}
        onOpenChange={setAddCalendarOpen}
        isSaving={pendingAction === 'add-calendar'}
        onSubmit={(input) => void onAddCalendar(input)}
      />

      <CalendarSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        value={settings}
        onChange={setSettings}
      />

      {statusMessage ? <p className="text-xs text-[var(--vd-muted-fg)]">{statusMessage}</p> : null}
    </main>
  );
}
