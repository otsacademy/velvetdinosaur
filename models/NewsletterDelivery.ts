import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/NewsletterDelivery.ts');

import { Schema, model, models } from 'mongoose';

const DELIVERY_STATUSES = [
  'pending',
  'sent',
  'failed',
  'skipped_no_consent',
  'skipped_unsubscribed',
  'skipped_suppressed'
] as const;

const NewsletterDeliverySchema = new Schema(
  {
    campaignId: { type: String, required: true, index: true },
    userId: { type: String, default: '', trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    firstName: { type: String, default: '', trim: true },
    status: { type: String, enum: DELIVERY_STATUSES, default: 'pending', index: true },
    postmarkMessageId: { type: String, default: '', trim: true },
    sentAt: { type: Date, default: null },
    error: { type: String, default: '', trim: true },
    attempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

NewsletterDeliverySchema.index({ campaignId: 1, email: 1 }, { unique: true });
NewsletterDeliverySchema.index({ campaignId: 1, status: 1, createdAt: 1 });

export const NewsletterDelivery =
  models.NewsletterDelivery || model('NewsletterDelivery', NewsletterDeliverySchema);

export const newsletterDeliveryStatuses = DELIVERY_STATUSES;
