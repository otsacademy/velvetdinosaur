import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/shared.ts');

export type TimeRange = { start: string; end: string }; // "09:00"–"17:30" venue-local

export type WeeklyHoursEntry = { day: number; ranges: TimeRange[] }; // day: 0 = Sunday

export type AvailabilityException = {
  date: string; // "2026-09-14" venue-local
  available: boolean;
  ranges: TimeRange[];
};

export type BookingSettingsData = {
  timezone: string;
  slotGranularityMinutes: number;
  minLeadTimeHours: number;
  maxAdvanceDays: number;
  autoConfirm: boolean;
  notifyEmail: string;
  cancellationCutoffHours: number;
  retentionDays: number;
  manageTokenTtlDays: number;
  weeklyHours: WeeklyHoursEntry[];
  exceptions: AvailabilityException[];
};

export type BookingServiceData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  pricePence: number | null;
  active: boolean;
  sortOrder: number;
};

export type BookingResourceData = {
  id: string;
  name: string;
  email: string;
  serviceIds: string[];
  weeklyHours: WeeklyHoursEntry[];
  exceptions: AvailabilityException[];
  active: boolean;
  sortOrder: number;
};

export type BookingStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type BookingData = {
  id: string;
  serviceId: string;
  serviceName: string;
  resourceId: string;
  resourceName: string;
  customer: { name: string; email: string; phone: string };
  startAt: string; // ISO
  endAt: string; // ISO
  status: BookingStatus;
  source: 'public' | 'admin';
  notes: string;
};

export function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isValidTimeRange(range: TimeRange) {
  return /^\d{2}:\d{2}$/.test(range.start) && /^\d{2}:\d{2}$/.test(range.end) && range.start < range.end;
}

export function isValidDateStr(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
