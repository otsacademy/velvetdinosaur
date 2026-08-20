import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/NewsletterPreference.ts');

import { Schema, model, models } from 'mongoose';

const NEWSLETTER_STATUSES = ['not_consented', 'pending', 'subscribed', 'unsubscribed'] as const;

const NewsletterPreferenceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    firstName: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: NEWSLETTER_STATUSES,
      default: 'not_consented',
      index: true
    },
    consentAt: { type: Date, default: null },
    unsubscribedAt: { type: Date, default: null },
    source: { type: String, default: '', trim: true },
    legalTextVersion: { type: String, default: 'v1', trim: true },
    lastUpdatedBy: {
      actorType: { type: String, default: 'system', trim: true },
      actorId: { type: String, default: '', trim: true }
    }
  },
  { timestamps: true }
);

NewsletterPreferenceSchema.index({ status: 1, updatedAt: -1 });

export const NewsletterPreference =
  models.NewsletterPreference || model('NewsletterPreference', NewsletterPreferenceSchema);

export const newsletterStatuses = NEWSLETTER_STATUSES;
