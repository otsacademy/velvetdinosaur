import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Asset.ts');

import mongoose, { Schema, model } from 'mongoose';

const AssetSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    bucket: { type: String, required: true },
    // Virtual folder path for UI organization (e.g. "blog/2026"). Empty/null means root.
    folder: { type: String, index: true },
    name: { type: String },
    caption: { type: String },
    alt: { type: String },
    width: { type: Number },
    height: { type: Number },
    url: { type: String },
    mime: { type: String },
    size: { type: Number },
    etag: { type: String }
  },
  { timestamps: true }
);

export const Asset = mongoose.models.Asset || model('Asset', AssetSchema);
