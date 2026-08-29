import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/VideoLiveCaptureToken.ts');

import mongoose, { Schema, model } from 'mongoose';

const VideoLiveCaptureTokenSchema = new Schema(
  {
    slug: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    createdByUserId: { type: String, required: true },
    allowedPrefix: { type: String, required: true, default: '/edit' },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// TTL cleanup once expired.
VideoLiveCaptureTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VideoLiveCaptureToken =
  mongoose.models.VideoLiveCaptureToken || model('VideoLiveCaptureToken', VideoLiveCaptureTokenSchema);
