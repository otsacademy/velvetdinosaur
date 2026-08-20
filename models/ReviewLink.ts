import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/ReviewLink.ts');

import { Schema, model, models } from 'mongoose';

const ReviewLinkSchema = new Schema(
  {
    tokenId: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    slug: { type: String, required: true, index: true },
    recipientEmail: { type: String, default: null, lowercase: true, trim: true },
    startsAt: { type: Date, required: true, index: true, default: () => new Date() },
    deadlineAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    reminderSentAt: { type: Date, default: null },
    overrideLock: { type: Boolean, default: false },
    createdByUserId: { type: String, default: null },
    lastSentAt: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() }
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const safeRet = ret as {
          _id?: { toString?: () => string } | string;
          id?: string;
          __v?: unknown;
        };
        const rawId = safeRet._id;
        safeRet.id = typeof rawId === 'string' ? rawId : rawId?.toString?.();
        delete safeRet._id;
        delete safeRet.__v;
      }
    }
  }
);

ReviewLinkSchema.index({ slug: 1, createdAt: -1 });

export const ReviewLink = models.ReviewLink || model('ReviewLink', ReviewLinkSchema);
