import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/timezone.ts');

// Timezone helpers: convert venue-local wall-clock times to UTC Dates using
// Intl, with no external date library.

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function isValidTimezone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return true;
  } catch {
    return false;
  }
}

function zoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second)
  );
  return asUtc - date.getTime();
}

/** Convert a venue-local wall time ("2026-09-14", "09:30") to the equivalent UTC Date. */
export function wallTimeToUtc(dateStr: string, timeStr: string, timeZone: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  // Two passes to stay correct across DST transition edges.
  const first = new Date(guess.getTime() - zoneOffsetMs(guess, timeZone));
  return new Date(guess.getTime() - zoneOffsetMs(first, timeZone));
}

/** Weekday (0 = Sunday) of a UTC instant as observed in the venue timezone. */
export function weekdayInZone(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  return WEEKDAYS.indexOf(weekday as (typeof WEEKDAYS)[number]);
}

/** "YYYY-MM-DD" of a UTC instant as observed in the venue timezone. */
export function dateStrInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return `${map.year}-${map.month}-${map.day}`;
}
