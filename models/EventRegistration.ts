import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/EventRegistration.ts');

import { Schema, model, models } from 'mongoose';

const EVENT_REGISTRATION_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;

const EventRegistrationSchema = new Schema(
  {
    eventId: { type: String, required: true, index: true },
    eventSlug: { type: String, required: true, trim: true, index: true },
    eventTitle: { type: String, required: true, trim: true },
    userId: { type: String, default: '', trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: EVENT_REGISTRATION_STATUSES,
      default: 'pending',
      index: true
    },
    consentAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    source: { type: String, default: '', trim: true },
    legalTextVersion: { type: String, default: 'v1', trim: true },
    lastUpdatedBy: {
      actorType: { type: String, default: 'system', trim: true },
      actorId: { type: String, default: '', trim: true }
    }
  },
  { timestamps: true }
);

EventRegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });
EventRegistrationSchema.index({ eventId: 1, status: 1, updatedAt: -1 });

export const EventRegistration =
  models.EventRegistration || model('EventRegistration', EventRegistrationSchema);

export const eventRegistrationStatuses = EVENT_REGISTRATION_STATUSES;
