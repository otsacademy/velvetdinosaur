import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/SupportTicketRating.ts');

import { Schema, model, models } from 'mongoose';

const SupportTicketRatingSchema = new Schema(
  {
    ticketId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    comment: { type: String, default: '', trim: true },
    submittedByUserId: { type: String, required: true, trim: true, index: true },
    submittedAt: { type: Date, required: true, default: Date.now, index: true }
  },
  { timestamps: true }
);

SupportTicketRatingSchema.index({ ticketId: 1, submittedAt: -1 });
SupportTicketRatingSchema.index({ submittedByUserId: 1, submittedAt: -1 });

export const SupportTicketRating =
  models.SupportTicketRating || model('SupportTicketRating', SupportTicketRatingSchema);
