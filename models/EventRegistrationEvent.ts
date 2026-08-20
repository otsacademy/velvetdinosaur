import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/EventRegistrationEvent.ts');

import { Schema, model, models } from 'mongoose';

const EVENT_REGISTRATION_EVENT_TYPES = ['request', 'confirm', 'cancel', 'resend-confirmation'] as const;

const EventRegistrationEventSchema = new Schema(
  {
    registrationId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    eventSlug: { type: String, default: '', trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    eventType: {
      type: String,
      enum: EVENT_REGISTRATION_EVENT_TYPES,
      required: true,
      index: true
    },
    source: { type: String, default: '', trim: true },
    legalTextVersion: { type: String, default: 'v1', trim: true },
    actorType: { type: String, default: 'system', trim: true },
    actorId: { type: String, default: '', trim: true },
    ipHash: { type: String, default: '', trim: true },
    userAgent: { type: String, default: '', trim: true },
    reason: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

EventRegistrationEventSchema.index({ registrationId: 1, createdAt: -1 });

export const EventRegistrationEvent =
  models.EventRegistrationEvent || model('EventRegistrationEvent', EventRegistrationEventSchema);

export const eventRegistrationEventTypes = EVENT_REGISTRATION_EVENT_TYPES;
