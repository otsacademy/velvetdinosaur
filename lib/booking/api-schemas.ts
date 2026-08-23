import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/api-schemas.ts');

import { z } from 'zod';

const TimeRangeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/)
});

export const WeeklyHoursSchema = z.object({
  day: z.number().int().min(0).max(6),
  ranges: z.array(TimeRangeSchema).max(8)
});

export const ExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  available: z.boolean(),
  ranges: z.array(TimeRangeSchema).max(8).default([])
});

export const ServiceInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  durationMinutes: z.number().int().min(5).max(1440),
  bufferMinutes: z.number().int().min(0).max(240).optional(),
  pricePence: z.number().int().min(0).nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export const ResourceInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200).or(z.literal('')).optional(),
  serviceIds: z.array(z.string().trim().min(1).max(64)).max(100).optional(),
  weeklyHours: z.array(WeeklyHoursSchema).max(7).optional(),
  exceptions: z.array(ExceptionSchema).max(200).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export const BookingSettingsInputSchema = z.object({
  timezone: z.string().trim().max(64).optional(),
  slotGranularityMinutes: z.number().int().min(5).max(240).optional(),
  minLeadTimeHours: z.number().int().min(0).max(336).optional(),
  maxAdvanceDays: z.number().int().min(1).max(365).optional(),
  autoConfirm: z.boolean().optional(),
  notifyEmail: z.string().trim().email().max(200).or(z.literal('')).optional(),
  cancellationCutoffHours: z.number().int().min(0).max(720).optional(),
  retentionDays: z.number().int().min(30).max(3650).optional(),
  manageTokenTtlDays: z.number().int().min(1).max(365).optional(),
  weeklyHours: z.array(WeeklyHoursSchema).max(7).optional(),
  exceptions: z.array(ExceptionSchema).max(200).optional()
});

export const ManualBookingSchema = z.object({
  serviceId: z.string().trim().min(1).max(64),
  resourceId: z.string().trim().max(64).optional(),
  startAt: z.string().trim().min(10).max(40),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional()
});

export const BookingStatusSchema = z.object({
  status: z.enum(['requested', 'confirmed', 'cancelled', 'completed', 'no_show'])
});
