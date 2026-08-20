import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/ReviewAnnotation.ts');

import { Schema, model, models } from 'mongoose';

const ReviewThreadEntrySchema = new Schema(
  {
    authorName: { type: String, required: true },
    authorUserId: { type: String, default: null },
    authorEmail: { type: String, default: null, lowercase: true, trim: true },
    body: { type: String, required: true },
    screenshotUrl: { type: String, default: null },
    createdAt: { type: Date, default: () => new Date() }
  },
  { _id: false }
);

const ReviewAnnotationSchema = new Schema(
  {
    slug: { type: String, required: true, index: true },
    reviewTokenId: { type: String, required: true, index: true },
    target: {
      x: { type: Number, default: null },
      y: { type: Number, default: null },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      viewportWidth: { type: Number, default: null },
      viewportHeight: { type: Number, default: null },
      elementTag: { type: String, default: null },
      blockId: { type: String, default: null }
    },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    statusUpdatedAt: { type: Date, default: () => new Date() },
    thread: { type: [ReviewThreadEntrySchema], default: [] }
  },
  { timestamps: true }
);

ReviewAnnotationSchema.index({ slug: 1, reviewTokenId: 1, createdAt: -1 });
ReviewAnnotationSchema.index({ 'thread.authorUserId': 1, 'thread.createdAt': -1 });
ReviewAnnotationSchema.index({ 'thread.authorEmail': 1, 'thread.createdAt': -1 });

export const ReviewAnnotation =
  models.ReviewAnnotation || model('ReviewAnnotation', ReviewAnnotationSchema);
