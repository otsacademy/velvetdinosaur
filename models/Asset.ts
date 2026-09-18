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
    ownerSite: { type: String, index: true },
    ownershipSource: { type: String, enum: ['upload', 'reviewed-migration'] },
    ownershipVerifiedAt: Date,
    ownershipEvidence: String,
    uploadedBy: String,
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
    // Storage bookkeeping written by the upload/replace pipeline. These were
    // never declared, so Mongoose stripped them and a purge could not find the
    // private original (customer test, 13 Sep 2026).
    originalKey: { type: String },
    originalMime: { type: String },
    originalSize: { type: Number },
    optimizedSize: { type: Number },
    processingStatus: { type: String },
    processedAt: { type: Date },
    fallbackKey: { type: String },
    deletedAt: { type: Date, index: true },
    deletedBy: { type: String }
  },
  { timestamps: true }
);
AssetSchema.index({ tags: 1 });

export const Asset = mongoose.models.Asset || model('Asset', AssetSchema);
