import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Booking.ts');

import { Schema, model, models } from 'mongoose';

const BOOKING_STATUSES = ['requested', 'confirmed', 'cancelled', 'completed', 'no_show'] as const;
const BOOKING_SOURCES = ['public', 'admin'] as const;

const BookingSchema = new Schema(
  {
    serviceId: { type: String, required: true, index: true },
    serviceName: { type: String, required: true, trim: true }, // snapshot
    resourceId: { type: String, default: '', index: true }, // '' = venue-level booking
    resourceName: { type: String, default: '', trim: true }, // snapshot
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, default: '', trim: true }
    },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'requested',
      index: true
    },
    manageTokenHash: { type: String, default: '', select: false, index: true },
    manageTokenExpiresAt: { type: Date, default: null },
    source: { type: String, enum: BOOKING_SOURCES, default: 'public' },
    notes: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

BookingSchema.index({ startAt: 1, status: 1 });
BookingSchema.index({ resourceId: 1, startAt: 1 });
BookingSchema.index({ 'customer.email': 1, startAt: -1 });

export const Booking = models.Booking || model('Booking', BookingSchema);

export const bookingStatuses = BOOKING_STATUSES;
export const bookingSources = BOOKING_SOURCES;
// Statuses that hold a slot (exclude from availability).
export const ACTIVE_BOOKING_STATUSES = ['requested', 'confirmed'] as const;
