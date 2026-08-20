import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/EventRegistrationDelivery.ts');

import { Schema, model, models } from 'mongoose';

const EVENT_DELIVERY_STATUSES = ['pending', 'sent', 'failed', 'skipped_unconfirmed'] as const;

const EventRegistrationDeliverySchema = new Schema(
  {
    campaignId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    registrationId: { type: String, default: '', trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    firstName: { type: String, default: '', trim: true },
    status: { type: String, enum: EVENT_DELIVERY_STATUSES, default: 'pending', index: true },
    postmarkMessageId: { type: String, default: '', trim: true },
    sentAt: { type: Date, default: null },
    error: { type: String, default: '', trim: true },
    attempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

EventRegistrationDeliverySchema.index({ campaignId: 1, email: 1 }, { unique: true });
EventRegistrationDeliverySchema.index({ campaignId: 1, status: 1, createdAt: 1 });

export const EventRegistrationDelivery =
  models.EventRegistrationDelivery || model('EventRegistrationDelivery', EventRegistrationDeliverySchema);

export const eventRegistrationDeliveryStatuses = EVENT_DELIVERY_STATUSES;
