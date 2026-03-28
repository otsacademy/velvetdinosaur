'use client';

import type { DemoTravelBooking } from '@/lib/demo-travel-seed';

const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
  { unit: 'second', ms: 1000 },
];

export const BOOKING_STATUS_LABELS: Record<DemoTravelBooking['status'], string> = {
  pending: 'New',
  confirmed: 'Confirmed',
  cancelled: 'Archived',
  completed: 'Resolved',
};

export const BOOKING_TYPE_LABELS: Record<DemoTravelBooking['type'], string> = {
  enquiry: 'Enquiry',
  booking: 'Booking',
  lead: 'Lead',
};

export const BOOKING_STATUS_OPTIONS: DemoTravelBooking['status'][] = ['pending', 'confirmed', 'cancelled', 'completed'];
export const BOOKING_TYPE_OPTIONS: Array<'all' | DemoTravelBooking['type']> = ['all', 'enquiry', 'booking', 'lead'];

export function toIsoDate(input: Date) {
  return input.toISOString().slice(0, 10);
}

export function addDays(input: Date, days: number) {
  const copy = new Date(input);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function formatDateLabel(value?: string) {
  if (!value) return 'n/a';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-GB');
}

export function formatRelativeTime(value?: string, now = Date.now()) {
  if (!value) return 'n/a';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const diffMs = parsed.getTime() - now;
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (absMs >= ms || unit === 'second') {
      const delta = Math.round(diffMs / ms);
      return formatter.format(delta, unit);
    }
  }

  return 'just now';
}

export function parseDateLines(value: string): string[] {
  const set = new Set<string>();
  for (const line of value.split('\n')) {
    const trimmed = line.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) continue;
    set.add(trimmed);
  }
  return Array.from(set).sort();
}

export function humanizeSlug(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
