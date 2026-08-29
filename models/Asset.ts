import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Asset.ts');

import { clamp01 } from '@/lib/media/focal-point';
import mongoose, { Schema, model } from 'mongoose';

const AssetVariantSchema = new Schema(
  {
    key: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    mime: { type: String },
    size: { type: Number },
    format: { type: String },
    quality: { type: Number },
    fit: { type: String }
  },
  { _id: false }
);

const AssetSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    bucket: { type: String, required: true },
    // Virtual folder path for UI organization (e.g. "blog/2026"). Empty/null means root.
    folder: { type: String, index: true },
    name: { type: String },
    caption: { type: String },
    alt: { type: String },
    tags: [{ type: String }],
    variants: {
      thumbnail: AssetVariantSchema,
      card: AssetVariantSchema,
      inline: AssetVariantSchema,
      hero: AssetVariantSchema,
      avatar: AssetVariantSchema,
      social: AssetVariantSchema
    },
    altSource: { type: String, enum: ['manual', 'auto'] },
    altGeneratedAt: { type: Date },
    altModel: { type: String },
    altNeedsReview: { type: Boolean },
    focalX: {
      type: Number,
      min: 0,
      max: 1,
      set: clamp01
    },
    focalY: {
      type: Number,
      min: 0,
      max: 1,
      set: clamp01
    },
    focalSetAt: { type: Date },
    focalSetBy: { type: String },
    width: { type: Number },
    height: { type: Number },
    url: { type: String },
    mime: { type: String },
    size: { type: Number },
    etag: { type: String },
    deletedAt: { type: Date, index: true },
    deletedBy: { type: String }
  },
  { timestamps: true }
);
AssetSchema.index({ tags: 1 });

export const Asset = mongoose.models.Asset || model('Asset', AssetSchema);
