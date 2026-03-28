import { addDays, format } from 'date-fns';

export type CalendarEvent = {
  id: string;
  title: string;
  dateKey: string;
  time: string;
  durationMin: number;
  location: string;
  attendees: string[];
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EventDraft = {
  title: string;
  time: string;
  durationMin: string;
  location: string;
  attendees: string;
  notes: string;
};

const DEMO_BASE_DATE = new Date(2026, 2, 23);
const AVAILABILITY_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export function createEmptyEventDraft(): EventDraft {
  return {
    title: '',
    time: '10:00',
    durationMin: '60',
    location: '',
    attendees: '',
    notes: ''
  };
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(DEMO_BASE_DATE);
  }
  return new Date(year, month - 1, day);
}

export function formatDateLabel(date: Date) {
  return format(date, 'EEEE, MMM d');
}

export function getInitialDemoCalendarDate() {
  return new Date(DEMO_BASE_DATE);
}

export function toMinutes(clock: string) {
  const [hoursRaw, minutesRaw] = clock.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function normaliseDuration(value: string | number) {
  const duration = Number(value);
  if (!Number.isFinite(duration)) return 60;
  return Math.max(15, duration);
}

export function parseAttendees(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildEventDraft(event: CalendarEvent): EventDraft {
  return {
    title: event.title,
    time: event.time,
    durationMin: String(event.durationMin || 60),
    location: event.location,
    attendees: event.attendees.join(', '),
    notes: event.notes
  };
}

export function sortCalendarEvents(items: CalendarEvent[]) {
  return [...items].sort((left, right) => {
    const leftKey = `${left.dateKey} ${left.time}`;
    const rightKey = `${right.dateKey} ${right.time}`;
    return leftKey.localeCompare(rightKey);
  });
}

export function getInitialSelectedEventId(items: CalendarEvent[], dateKey: string) {
  return sortCalendarEvents(items.filter((item) => item.dateKey === dateKey))[0]?.id ?? '';
}

export function hasEventConflict(
  input: {
    id?: string;
    time: string;
    durationMin: number;
  },
  items: CalendarEvent[]
) {
  const start = toMinutes(input.time);
  if (start == null) return false;
  const end = start + normaliseDuration(input.durationMin);

  return items.some((item) => {
    if (input.id && item.id === input.id) return false;
    const itemStart = toMinutes(item.time);
    if (itemStart == null) return false;
    const itemEnd = itemStart + normaliseDuration(item.durationMin);
    return start < itemEnd && end > itemStart;
  });
}

export function deriveAvailabilitySlots(items: CalendarEvent[], dateKey: string) {
  const dayEvents = items.filter((item) => item.dateKey === dateKey);

  return AVAILABILITY_SLOTS.filter((slot) => {
    return !hasEventConflict(
      {
        time: slot,
        durationMin: 60
      },
      dayEvents
    );
  });
}

export function deriveUpcomingEvents(items: CalendarEvent[], selectedDateKey: string) {
  const selectedDate = parseDateKey(selectedDateKey);
  const limitDate = addDays(selectedDate, 7);
  const startTime = selectedDate.getTime();
  const endTime = limitDate.getTime();

  return sortCalendarEvents(items).filter((item) => {
    const itemDate = parseDateKey(item.dateKey).getTime();
    return itemDate > startTime && itemDate <= endTime;
  });
}

function createSeedEvent(
  id: string,
  title: string,
  offsetDays: number,
  time: string,
  durationMin: number,
  location: string,
  attendees: string[],
  notes: string
): CalendarEvent {
  const date = addDays(DEMO_BASE_DATE, offsetDays);
  const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8 + offsetDays, 30).toISOString();

  return {
    id,
    title,
    dateKey: toDateKey(date),
    time,
    durationMin,
    location,
    attendees,
    notes,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createDemoCalendarSeed(): CalendarEvent[] {
  return sortCalendarEvents([
    createSeedEvent(
      'harbour-pine-discovery',
      'Harbour & Pine discovery call',
      0,
      '09:30',
      45,
      'Google Meet',
      ['Martha', 'Ian'],
      'Review the new positioning, launch timing, and must-have page types for the first release.'
    ),
    createSeedEvent(
      'northline-content-audit',
      'Northline content audit',
      0,
      '13:00',
      60,
      'Studio boardroom',
      ['Sam', 'Ellis'],
      'Check whether the current booking FAQs and cabin details are clear enough on smaller screens.'
    ),
    createSeedEvent(
      'orchard-wireframe',
      'Orchard & North wireframe review',
      0,
      '16:30',
      30,
      'Zoom',
      ['June', 'Harriet'],
      'Walk through the homepage structure before the first design pass is signed off.'
    ),
    createSeedEvent(
      'cinder-house-booking',
      'Cinder House booking flow walkthrough',
      1,
      '10:00',
      60,
      'Google Meet',
      ['Asha', 'Rory'],
      'Map the enquiry steps to the new inbox and calendar flow so the team can manage calls without a separate CRM.'
    ),
    createSeedEvent(
      'harbour-pine-shortlist',
      'Harbour & Pine image shortlist review',
      2,
      '11:30',
      45,
      'Figma comments',
      ['Martha', 'Leah'],
      'Trim the gallery to the strongest set and agree which imagery should lead each case study.'
    ),
    createSeedEvent(
      'lumen-copy-handover',
      'Lumen Atelier copy handover',
      3,
      '14:00',
      60,
      'Notion review',
      ['Nora', 'Freya'],
      'Final pass on service-page copy, project summaries, and the contact prompts before migration.'
    ),
    createSeedEvent(
      'sycamore-launch',
      'Sycamore Stay launch readiness check',
      4,
      '09:00',
      45,
      'Google Meet',
      ['Robin', 'Isaac'],
      'Run through redirects, booking confirmations, and the launch-day checklist.'
    ),
    createSeedEvent(
      'grove-hall-seo',
      'Grove Hall SEO priorities session',
      5,
      '12:30',
      45,
      'Zoom',
      ['Leonie', 'Mae'],
      'Agree which location pages and FAQs need to be published first after launch.'
    )
  ]);
}
