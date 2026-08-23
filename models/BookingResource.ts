import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/BookingResource.ts');

import { Schema, model, models } from 'mongoose';

// A bookable resource: a staff member, a table, a room — anything with its own
// availability. Resources with an empty weeklyHours inherit the venue-level
// hours from BookingSettings.
const TimeRangeSchema = new Schema(
  {
    start: { type: String, required: true }, // "09:00" venue-local
    end: { type: String, required: true } // "17:30" venue-local
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
    date: { type: String, required: true }, // "2026-09-14" venue-local
    available: { type: Boolean, default: false },
    ranges: { type: [TimeRangeSchema], default: [] } // used when available = true
  },
  { _id: false }
);

const BookingResourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    serviceIds: { type: [String], default: [] }, // empty = offers all services
    weeklyHours: { type: [WeeklyHoursSchema], default: [] },
    exceptions: { type: [ExceptionSchema], default: [] },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

BookingResourceSchema.index({ active: 1, sortOrder: 1 });

export const BookingResource =
  models.BookingResource || model('BookingResource', BookingResourceSchema);
