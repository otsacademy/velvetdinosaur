import { Schema, model, models } from 'mongoose';

const schema = new Schema({
  key: { type: String, required: true, unique: true },
  kind: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'processing', 'sent', 'failed', 'needs_review', 'cancelled'], default: 'pending', index: true },
  attempts: { type: Number, default: 0 },
  availableAt: { type: Date, default: Date.now, index: true },
  claimToken: { type: String, default: null },
  claimedAt: { type: Date, default: null },
  messageId: { type: String, default: '' },
  error: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '' }
}, { timestamps: true });
schema.index({ status: 1, availableAt: 1 });
export const EmailNotification = models.EmailNotification || model('EmailNotification', schema);
