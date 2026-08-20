import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/NewsletterConsentEvent.ts');

import { Schema, model, models } from 'mongoose';

const CONSENT_EVENT_TYPES = ['subscribe', 'unsubscribe', 'resubscribe', 'set-not-consented', 'set-pending'] as const;

const NewsletterConsentEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    eventType: { type: String, enum: CONSENT_EVENT_TYPES, required: true, index: true },
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

NewsletterConsentEventSchema.index({ userId: 1, createdAt: -1 });

export const NewsletterConsentEvent =
  models.NewsletterConsentEvent || model('NewsletterConsentEvent', NewsletterConsentEventSchema);

export const newsletterConsentEventTypes = CONSENT_EVENT_TYPES;
