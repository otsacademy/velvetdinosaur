import { assertServerOnly } from '@/lib/_server/guard';
import mongoose, { Schema, model } from 'mongoose';
assertServerOnly('models/NewsletterMedia.ts');

const NewsletterMediaSchema = new Schema({
  id: { type: String, required: true, unique: true },
  ownerSite: { type: String, required: true, index: true },
  kind: { type: String, enum: ['image', 'attachment'], required: true },
  assetKey: { type: String, required: true, index: true },
  bucket: { type: String, required: true },
  storageKey: { type: String, required: true },
  sha256: { type: String, required: true },
  name: { type: String, required: true },
  mime: { type: String, required: true },
  size: { type: Number, required: true },
  width: Number,
  height: Number,
  campaignId: { type: String, index: true },
  retained: { type: Boolean, default: false },
  // Persisted before storage PUT so interrupted writes remain discoverable.
  ready: { type: Boolean, default: false },
  writingUntil: Date,
  // This is deliberately not a TTL index: storage must be deleted first.
  expiresAt: { type: Date, index: true },
  deletingAt: Date,
}, { timestamps: true });

export const NewsletterMedia = mongoose.models.NewsletterMedia || model('NewsletterMedia', NewsletterMediaSchema);
