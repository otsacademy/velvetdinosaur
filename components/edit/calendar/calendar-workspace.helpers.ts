import {
  DEFAULT_CALENDARS,
  toClock,
  toMinutes,
  type CalendarEvent,
  type CalendarRecord,
  type EventDraft
} from '@/components/edit/calendar-workspace.shared';

const CALENDAR_COLORS = new Set(['primary', 'accent', 'destructive', 'muted']);

export type CalendarApiItem = {
  id?: unknown;
  ownerUserId?: unknown;
  calendarId?: unknown;
  label?: unknown;
  color?: unknown;
  owned?: unknown;
  role?: unknown;
};

export function colorClass(token: string) {
  if (token === 'accent') return 'bg-[var(--vd-accent)]';
  if (token === 'destructive') return 'bg-[var(--destructive)]';
  if (token === 'muted') return 'bg-[var(--vd-muted-fg)]';
  return 'bg-[var(--vd-primary)]';
}

export function calendarKey(ownerUserId: string, calendarId: string) {
  return `${ownerUserId}::${calendarId}`;
}

function parseCalendarKey(value: string) {
  const index = value.indexOf('::');
  if (index === -1) return { ownerUserId: '', calendarId: value };
  return {
    ownerUserId: value.slice(0, index),
    calendarId: value.slice(index + 2)
  };
}

function toCalendarRole(raw: unknown): 'view' | 'edit' {
  return raw === 'view' ? 'view' : 'edit';
}

function toCalendarColor(raw: unknown): string {
  if (typeof raw === 'string' && CALENDAR_COLORS.has(raw)) return raw;
  return 'primary';
}

export function normalizeApiCalendars(items: unknown[]) {
  const results: CalendarRecord[] = [];
  for (const raw of items) {
    const item = raw as CalendarApiItem;
    const ownerUserId = String(item.ownerUserId || '').trim();
    const calendarId = String(item.calendarId || '').trim();
    if (!ownerUserId || !calendarId) continue;

    const id =
      typeof item.id === 'string' && item.id.includes('::')
        ? item.id
        : calendarKey(ownerUserId, calendarId);

    results.push({
      id,
      ownerUserId,
      calendarId,
      label: String(item.label || '').trim() || calendarId,
      color: toCalendarColor(item.color),
      owned: Boolean(item.owned),
      role: toCalendarRole(item.role),
      visible: true
    });
  }

  return results;
}

export function mergeCalendars(
  current: CalendarRecord[],
  incoming: CalendarRecord[],
  events: CalendarEvent[],
  viewerId: string
) {
  // Replace bootstrap placeholder calendars (ownerUserId === "self") once real user-scoped ids are known.
  const normalizedCurrent =
    viewerId !== 'self' ? current.filter((calendar) => calendar.ownerUserId !== 'self') : current;

  const visibility = new Map(normalizedCurrent.map((calendar) => [calendar.id, calendar.visible]));
  const map = new Map<string, CalendarRecord>();

  for (const calendar of normalizedCurrent) {
    map.set(calendar.id, { ...calendar });
  }

  for (const calendar of incoming) {
    map.set(calendar.id, {
      ...calendar,
      visible: visibility.get(calendar.id) ?? calendar.visible
    });
  }

  for (const event of events) {
    const ownerUserId = String(event.calendarOwnerId || '').trim() || viewerId;
    const calendarId = String(event.calendarId || '').trim();
    if (!ownerUserId || !calendarId) continue;
    const id = calendarKey(ownerUserId, calendarId);
    if (map.has(id)) continue;

    map.set(id, {
      id,
      ownerUserId,
      calendarId,
      label: event.calendarName || calendarId,
      color: toCalendarColor(event.calendarColor),
      owned: ownerUserId === viewerId,
      role: ownerUserId === viewerId ? 'edit' : 'view',
      visible: visibility.get(id) ?? true
    });
  }

  if (map.size === 0) {
    for (const calendar of DEFAULT_CALENDARS) {
      map.set(calendar.id, {
        ...calendar,
        visible: visibility.get(calendar.id) ?? calendar.visible
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.owned !== b.owned) return a.owned ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

export function buildDraftFromEvent(event: CalendarEvent, calendars: CalendarRecord[]): EventDraft {
  const id = calendarKey(event.calendarOwnerId, event.calendarId);
  const selectedCalendar = calendars.find((calendar) => calendar.id === id);
  const startMinutes = toMinutes(event.time) ?? 0;
  const endMinutes = startMinutes + Math.max(15, Number(event.durationMin || 60));

  return {
    title: event.title,
    eventType: event.eventType,
    calendarId: id,
    calendarName: selectedCalendar?.label || event.calendarName,
    calendarColor: selectedCalendar?.color || event.calendarColor,
    allDay: event.allDay,
    startDateKey: event.dateKey,
    startTime: event.time,
    endDateKey: event.endDateKey || event.dateKey,
    endTime: toClock(Math.min(endMinutes, 23 * 60 + 59)),
    repeat: 'none',
    reminderMinutes: String(event.reminderMinutes || 30),
    meetingType: event.meetingType,
    location: event.location,
    guests: event.attendees.join(', '),
    category: event.category,
    description: event.notes
  };
}

export function toApiPayload(draft: EventDraft, calendars: CalendarRecord[]) {
  const startMinutes = toMinutes(draft.startTime);
  const endMinutes = toMinutes(draft.endTime);
  const fallbackDuration = 60;

  const selectedCalendar =
    calendars.find((calendar) => calendar.id === draft.calendarId) ||
    calendars.find((calendar) => calendar.role === 'edit') ||
    calendars[0] ||
    DEFAULT_CALENDARS[0];

  const parsed = parseCalendarKey(draft.calendarId);
  const ownerUserId = selectedCalendar?.ownerUserId || parsed.ownerUserId || '';
  const calendarId = selectedCalendar?.calendarId || parsed.calendarId || 'personal';
  const calendarName = selectedCalendar?.label || draft.calendarName || calendarId;
  const calendarColor = selectedCalendar?.color || draft.calendarColor || 'primary';

  const duration = (() => {
    if (draft.allDay) return 24 * 60;
    if (startMinutes == null || endMinutes == null) return fallbackDuration;
    const raw = endMinutes - startMinutes;
    return Math.max(15, raw || fallbackDuration);
  })();

  return {
    title: draft.title.trim(),
    eventType: draft.eventType,
    calendarOwnerId: ownerUserId || undefined,
    calendarId,
    calendarName,
    calendarColor,
    allDay: draft.allDay,
    dateKey: draft.startDateKey,
    endDateKey: draft.endDateKey,
    time: draft.allDay ? '00:00' : draft.startTime,
    durationMin: duration,
    reminderMinutes: Number(draft.reminderMinutes || '30') || 30,
    meetingType: draft.meetingType,
    location: draft.location.trim(),
    attendees: draft.guests,
    category: draft.category.trim(),
    notes: draft.description.trim()
  };
}
