import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/slots.ts');

import { wallTimeToUtc, weekdayInZone } from '@/lib/booking/timezone';
import type { AvailabilityException, TimeRange, WeeklyHoursEntry } from '@/lib/booking/shared';

export type SlotComputationInput = {
  /** Venue-local date, "YYYY-MM-DD". */
  date: string;
  durationMinutes: number;
  bufferMinutes: number;
  weeklyHours: WeeklyHoursEntry[];
  exceptions: AvailabilityException[];
  /** Existing bookings (active statuses only) for the same resource, UTC. */
  existing: { startAt: Date; endAt: Date }[];
  timezone: string;
  slotGranularityMinutes: number;
  minLeadTimeHours: number;
  maxAdvanceDays: number;
  now: Date;
};

export type BookingSlot = { startAt: Date; endAt: Date };

function resolveWindows(input: SlotComputationInput): TimeRange[] {
  const exception = input.exceptions.find((entry) => entry.date === input.date);
  if (exception) {
    return exception.available ? exception.ranges : [];
  }
  const midday = wallTimeToUtc(input.date, '12:00', input.timezone);
  const weekday = weekdayInZone(midday, input.timezone);
  return input.weeklyHours.find((entry) => entry.day === weekday)?.ranges ?? [];
}

function overlaps(existing: { startAt: Date; endAt: Date }[], startMs: number, endMs: number) {
  return existing.some((booking) => startMs < booking.endAt.getTime() && endMs > booking.startAt.getTime());
}

/**
 * Pure slot computation: given a service duration, venue availability and the
 * bookings already holding time, return the bookable start times for one date.
 */
export function computeSlots(input: SlotComputationInput): BookingSlot[] {
  const durationMs = input.durationMinutes * 60_000;
  const occupiedMs = (input.durationMinutes + input.bufferMinutes) * 60_000;
  const stepMs = Math.max(5, input.slotGranularityMinutes) * 60_000;
  const minStartMs = input.now.getTime() + input.minLeadTimeHours * 3_600_000;
  const maxStartMs = input.now.getTime() + input.maxAdvanceDays * 86_400_000;

  const slots: BookingSlot[] = [];
  for (const window of resolveWindows(input)) {
    const windowStartMs = wallTimeToUtc(input.date, window.start, input.timezone).getTime();
    const windowEndMs = wallTimeToUtc(input.date, window.end, input.timezone).getTime();
    for (let cursor = windowStartMs; cursor + durationMs <= windowEndMs; cursor += stepMs) {
      if (cursor < minStartMs || cursor > maxStartMs) continue;
      if (overlaps(input.existing, cursor, cursor + occupiedMs)) continue;
      slots.push({ startAt: new Date(cursor), endAt: new Date(cursor + durationMs) });
    }
  }
  return slots;
}

/** True when `startAt` is one of the currently bookable slots for the date. */
export function isBookableSlot(input: SlotComputationInput, startAt: Date) {
  return computeSlots(input).some((slot) => slot.startAt.getTime() === startAt.getTime());
}
