import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/SupportTicketMessage.ts');

import { Schema, model, models } from 'mongoose';

const AttachmentSchema = new Schema(
  {
    key: { type: String, default: '', trim: true },
    name: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
    mime: { type: String, default: '', trim: true },
    size: { type: Number, default: null }
  },
  { _id: false }
);

const SupportTicketMessageSchema = new Schema(
  {
    ticketId: { type: String, required: true, index: true },
    authorUserId: { type: String, default: '', trim: true, index: true },
    authorEmail: { type: String, default: '', trim: true, lowercase: true, index: true },
    authorName: { type: String, default: '', trim: true },
    authorRole: {
      type: String,
      enum: ['admin-requester', 'support-agent', 'system'],
      default: 'admin-requester'
    },
    bodyHtml: { type: String, default: '' },
    bodyText: { type: String, default: '' },
    attachments: { type: [AttachmentSchema], default: [] },
    isInternal: { type: Boolean, default: false }
  },
  { timestamps: true }
);

SupportTicketMessageSchema.index({ ticketId: 1, createdAt: 1 });

export const SupportTicketMessage =
  models.SupportTicketMessage || model('SupportTicketMessage', SupportTicketMessageSchema);
