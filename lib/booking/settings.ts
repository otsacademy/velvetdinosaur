import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/settings.ts');

import { connectDB } from '@/lib/db';
import { BookingSettings } from '@/models/BookingSettings';
import { isValidTimezone } from '@/lib/booking/timezone';
import {
  clean,
  isValidDateStr,
  isValidTimeRange,
  type AvailabilityException,
  type BookingSettingsData,
  type WeeklyHoursEntry
} from '@/lib/booking/shared';

const DEFAULT_BOOKING_SETTINGS: BookingSettingsData = {
  timezone: 'Europe/London',
  slotGranularityMinutes: 30,
  minLeadTimeHours: 2,
  maxAdvanceDays: 60,
  autoConfirm: false,
  notifyEmail: '',
  cancellationCutoffHours: 24,
  retentionDays: 365,
  manageTokenTtlDays: 30,
  weeklyHours: [],
  exceptions: []
};

function toBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function toNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function toTimezone(value: unknown, fallback: string) {
  const candidate = clean(value);
  return candidate && isValidTimezone(candidate) ? candidate : fallback;
}

function toWeeklyHours(value: unknown): WeeklyHoursEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const day = Number((entry as WeeklyHoursEntry)?.day);
      const ranges = Array.isArray((entry as WeeklyHoursEntry)?.ranges)
        ? (entry as WeeklyHoursEntry).ranges
            .map((range) => ({ start: clean(range?.start), end: clean(range?.end) }))
            .filter(isValidTimeRange)
        : [];
      return { day, ranges };
    })
    .filter((entry) => Number.isInteger(entry.day) && entry.day >= 0 && entry.day <= 6);
}

function toExceptions(value: unknown): AvailabilityException[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const date = clean((entry as AvailabilityException)?.date);
      const available = (entry as AvailabilityException)?.available === true;
      const ranges = Array.isArray((entry as AvailabilityException)?.ranges)
        ? (entry as AvailabilityException).ranges
            .map((range) => ({ start: clean(range?.start), end: clean(range?.end) }))
            .filter(isValidTimeRange)
        : [];
      return { date, available, ranges };
    })
    .filter((entry) => isValidDateStr(entry.date));
}

export function normalizeBookingSettings(
  raw: Partial<BookingSettingsData> | null | undefined
): BookingSettingsData {
  const input = raw || {};
  return {
    timezone: toTimezone(input.timezone, DEFAULT_BOOKING_SETTINGS.timezone),
    slotGranularityMinutes: toNumber(
      input.slotGranularityMinutes,
      DEFAULT_BOOKING_SETTINGS.slotGranularityMinutes,
      5,
      240
    ),
    minLeadTimeHours: toNumber(input.minLeadTimeHours, DEFAULT_BOOKING_SETTINGS.minLeadTimeHours, 0, 336),
    maxAdvanceDays: toNumber(input.maxAdvanceDays, DEFAULT_BOOKING_SETTINGS.maxAdvanceDays, 1, 365),
    autoConfirm: toBoolean(input.autoConfirm, DEFAULT_BOOKING_SETTINGS.autoConfirm),
    notifyEmail: clean(input.notifyEmail).toLowerCase(),
    cancellationCutoffHours: toNumber(
      input.cancellationCutoffHours,
      DEFAULT_BOOKING_SETTINGS.cancellationCutoffHours,
      0,
      720
    ),
    retentionDays: toNumber(input.retentionDays, DEFAULT_BOOKING_SETTINGS.retentionDays, 30, 3650),
    manageTokenTtlDays: toNumber(
      input.manageTokenTtlDays,
      DEFAULT_BOOKING_SETTINGS.manageTokenTtlDays,
      1,
      365
    ),
    weeklyHours: toWeeklyHours(input.weeklyHours),
    exceptions: toExceptions(input.exceptions)
  };
}

type BookingSettingsDoc = Partial<BookingSettingsData> & { key?: string };

export async function getBookingSettings(): Promise<BookingSettingsData> {
  await connectDB();
  const doc = (await BookingSettings.findOne({ key: 'default' }).lean()) as BookingSettingsDoc | null;
  return normalizeBookingSettings(doc);
}

export async function updateBookingSettings(next: Partial<BookingSettingsData>) {
  await connectDB();
  const normalized = normalizeBookingSettings(next);
  await BookingSettings.findOneAndUpdate(
    { key: 'default' },
    { $set: { ...normalized, key: 'default' } },
    { upsert: true, new: true }
  );
  return normalized;
}

export function getDefaultBookingSettings() {
  return { ...DEFAULT_BOOKING_SETTINGS };
}
