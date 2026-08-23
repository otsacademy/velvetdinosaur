import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/BookingSettings.ts');

import { Schema, model, models } from 'mongoose';

const TimeRangeSchema = new Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  { _id: false }
);

const WeeklyHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    ranges: { type: [TimeRangeSchema], default: [] }
  },
  { _id: false }
);

const ExceptionSchema = new Schema(
  {
    date: { type: String, required: true },
    available: { type: Boolean, default: false },
    ranges: { type: [TimeRangeSchema], default: [] }
  },
  { _id: false }
);

// Singleton document (key = 'default') holding venue-level booking behaviour.
const BookingSettingsSchema = new Schema(
  {
    key: { type: String, default: 'default', unique: true, index: true },
    timezone: { type: String, default: 'Europe/London', trim: true },
    slotGranularityMinutes: { type: Number, default: 30, min: 5, max: 240 },
    minLeadTimeHours: { type: Number, default: 2, min: 0, max: 24 * 14 },
    maxAdvanceDays: { type: Number, default: 60, min: 1, max: 365 },
    autoConfirm: { type: Boolean, default: false },
    notifyEmail: { type: String, default: '', lowercase: true, trim: true },
    cancellationCutoffHours: { type: Number, default: 24, min: 0, max: 24 * 30 },
    retentionDays: { type: Number, default: 365, min: 30, max: 3650 },
    manageTokenTtlDays: { type: Number, default: 30, min: 1, max: 365 },
    weeklyHours: { type: [WeeklyHoursSchema], default: [] },
    exceptions: { type: [ExceptionSchema], default: [] }
  },
  { timestamps: true }
);

export const BookingSettings =
  models.BookingSettings || model('BookingSettings', BookingSettingsSchema);
