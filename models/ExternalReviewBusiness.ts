import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/ExternalReviewBusiness.ts');

import { Schema, model, models } from 'mongoose';

const ExternalReviewBusinessSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    summary: { type: String, default: '', trim: true },
    websiteUrl: { type: String, default: '', trim: true },
    published: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
    googlePlaceId: { type: String, default: '', trim: true },
    tripadvisorLocationId: { type: String, default: '', trim: true },
    tripadvisorUrl: { type: String, default: '', trim: true },
    createdByUserId: { type: String, default: null },
    updatedByUserId: { type: String, default: null }
  },
  { timestamps: true }
);

ExternalReviewBusinessSchema.index({ published: 1, sortOrder: 1, name: 1 });

export const ExternalReviewBusiness =
  models.ExternalReviewBusiness || model('ExternalReviewBusiness', ExternalReviewBusinessSchema);
