import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/ExternalReviewApiUsage.ts');

import { Schema, model, models } from 'mongoose';

const ExternalReviewApiUsageSchema = new Schema(
  {
    provider: { type: String, required: true },
    day: { type: String, required: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

ExternalReviewApiUsageSchema.index({ provider: 1, day: 1 }, { unique: true });
ExternalReviewApiUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ExternalReviewApiUsage =
  models.ExternalReviewApiUsage || model('ExternalReviewApiUsage', ExternalReviewApiUsageSchema);
