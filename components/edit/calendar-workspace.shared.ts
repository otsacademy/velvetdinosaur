import { addDays, addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda' | 'events';

export type CalendarEventType = 'event' | 'task' | 'reminder' | 'out-of-office';

export type CalendarMeetingType = '' | 'in-person' | 'online' | 'hybrid';

export type CalendarEvent = {
  id: string;
  calendarOwnerId: string;
  title: string;
  dateKey: string;
  time: string;
  durationMin: number;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  eventType: CalendarEventType;
  allDay: boolean;
  endDateKey: string;
  meetingType: CalendarMeetingType;
  category: string;
  reminderMinutes: number;
  location: string;
  attendees: string[];
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CalendarRecord = {
  id: string; // composite ownerUserId::calendarId
  ownerUserId: string;
  calendarId: string;
  label: string;
  color: string;
  owned: boolean;
  role: 'view' | 'edit';
  visible: boolean;
};

export type CalendarSettingsState = {
  hourHeight: number;
  snapMinutes: 15 | 30 | 60;
  weekStartsOn: 'Sunday' | 'Monday';
  defaultView: 'Day' | 'Week' | 'Month' | 'Agenda';
  workingDays: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>;
  workStartHour: number;
  workEndHour: number;
  primaryTimezone: string;
  secondaryTimezone: string;
  defaultMeetingDuration: number;
  speedyMeetings: boolean;
  defaultConferencing: 'none' | 'zoom' | 'google-meet' | 'teams';
};

export type EventDraft = {
  title: string;
  eventType: CalendarEventType;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  allDay: boolean;
  startDateKey: string;
  startTime: string;
  endDateKey: string;
  endTime: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  reminderMinutes: string;
  meetingType: CalendarMeetingType;
  location: string;
  guests: string;
  category: string;
  description: string;
};

export const DEFAULT_CALENDARS: CalendarRecord[] = [
  {
    id: 'self::personal',
    ownerUserId: 'self',
    calendarId: 'personal',
    label: 'Personal',
    color: 'primary',
    owned: true,
    role: 'edit',
    visible: true
  },
  {
    id: 'self::team',
    ownerUserId: 'self',
    calendarId: 'team',
    label: 'Team',
    color: 'accent',
    owned: true,
    role: 'edit',
    visible: true
  },
  {
    id: 'self::tasks',
    ownerUserId: 'self',
    calendarId: 'tasks',
    label: 'Tasks',
    color: 'destructive',
    owned: true,
    role: 'edit',
    visible: true
  }
];

export const DEFAULT_SETTINGS: CalendarSettingsState = {
  hourHeight: 60,
  snapMinutes: 30,
  weekStartsOn: 'Monday',
  defaultView: 'Month',
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  workStartHour: 0,
  workEndHour: 23,
  primaryTimezone: 'Europe/Berlin',
  secondaryTimezone: 'UTC',
  defaultMeetingDuration: 60,
  speedyMeetings: false,
  defaultConferencing: 'none'
};

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date();
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

export function formatDateLabel(date: Date, view: CalendarViewMode) {
  if (view === 'day') return format(date, 'EEEE, MMM d, yyyy');
  if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  if (view === 'events') {
    const from = addDays(date, -30);
    const to = addDays(date, 90);
    return `${format(from, 'MMM d')} - ${format(to, 'MMM d, yyyy')}`;
  }
  if (view === 'agenda') {
    const end = addDays(date, 13);
    return `${format(date, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  return format(date, 'MMMM yyyy');
}

export function changeDateByView(date: Date, view: CalendarViewMode, direction: 'next' | 'prev') {
  const sign = direction === 'next' ? 1 : -1;
  if (view === 'day') return addDays(date, sign);
  if (view === 'week') return addDays(date, 7 * sign);
  if (view === 'events') return addDays(date, 30 * sign);
  if (view === 'agenda') return addDays(date, 14 * sign);
  return addMonths(date, sign);
}

export function dateRangeForView(date: Date, view: CalendarViewMode) {
  if (view === 'day') {
    const key = toDateKey(date);
    return { from: key, to: key };
  }
  if (view === 'week') {
    const fromDate = startOfWeek(date, { weekStartsOn: 1 });
    const toDate = endOfWeek(date, { weekStartsOn: 1 });
    return { from: toDateKey(fromDate), to: toDateKey(toDate) };
  }
  if (view === 'events') {
    return {
      from: toDateKey(addDays(date, -30)),
      to: toDateKey(addDays(date, 90))
    };
  }
  if (view === 'agenda') {
    return { from: toDateKey(date), to: toDateKey(addDays(date, 30)) };
  }
  const fromDate = startOfMonth(date);
  const toDate = endOfMonth(date);
  return { from: toDateKey(fromDate), to: toDateKey(toDate) };
}

export function toMinutes(clock: string) {
  const [hRaw, mRaw] = clock.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function toClock(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function defaultEventDraft(date: Date, calendars: CalendarRecord[], defaultDuration: number): EventDraft {
  const first = calendars.find((calendar) => calendar.owned) || calendars[0] || DEFAULT_CALENDARS[0];
  const startDateKey = toDateKey(date);
  const startTime = '10:00';
  const startMinutes = toMinutes(startTime) ?? 600;
  const endTime = toClock(startMinutes + defaultDuration);

  return {
    title: '',
    eventType: 'event',
    calendarId: first.id,
    calendarName: first.label,
    calendarColor: first.color,
    allDay: false,
    startDateKey,
    startTime,
    endDateKey: startDateKey,
    endTime,
    repeat: 'none',
    reminderMinutes: '30',
    meetingType: '',
    location: '',
    guests: '',
    category: '',
    description: ''
  };
}

export async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}
