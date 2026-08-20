import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/NewsletterSuppression.ts');

import { Schema, model, models } from 'mongoose';

const NewsletterSuppressionSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    active: { type: Boolean, default: true, index: true },
    source: { type: String, default: '', trim: true },
    reason: { type: String, default: '', trim: true },
    eventType: { type: String, default: '', trim: true },
    messageId: { type: String, default: '', trim: true },
    suppressedAt: { type: Date, default: Date.now, index: true },
    lastEventAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

NewsletterSuppressionSchema.index({ active: 1, lastEventAt: -1 });

export const NewsletterSuppression =
  models.NewsletterSuppression || model('NewsletterSuppression', NewsletterSuppressionSchema);
