import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/SupportTicket.ts');

import { Schema, model, models } from 'mongoose';
import {
  SUPPORT_PRIORITIES,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_WAITING_ON
} from '@/lib/support/constants';

const SupportTicketSchema = new Schema(
  {
    ticketRef: { type: String, required: true, unique: true, index: true },
    createdByUserId: { type: String, required: true, index: true },
    createdByEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    organization: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: SUPPORT_TICKET_CATEGORIES.map((item) => item.key),
      default: 'support_request',
      index: true
    },
    module: { type: String, default: '', trim: true, index: true },
    priority: {
      type: String,
      enum: SUPPORT_PRIORITIES,
      default: '5-standard',
      index: true
    },
    requestedDate: { type: Date, default: null },
    caseRefs: [{ type: String, trim: true }],
    pageUrl: { type: String, default: '', trim: true },
    subject: { type: String, required: true, trim: true },
    descriptionHtml: { type: String, default: '' },
    descriptionText: { type: String, default: '' },
    status: {
      type: String,
      enum: SUPPORT_TICKET_STATUSES,
      default: 'open',
      index: true
    },
    waitingOn: {
      type: String,
      enum: SUPPORT_WAITING_ON,
      default: 'support',
      index: true
    },
    notes: { type: String, default: '', trim: true },
    assignedToUserId: { type: String, default: '', trim: true, index: true },
    assignedToEmail: { type: String, default: '', trim: true, lowercase: true, index: true },
    messageCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    closedAt: { type: Date, default: null, index: true },
    satisfactionRating: { type: Number, default: null, min: 1, max: 5 },
    satisfactionComment: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

SupportTicketSchema.index({ status: 1, lastActivityAt: -1 });
SupportTicketSchema.index({ waitingOn: 1, lastActivityAt: -1 });
SupportTicketSchema.index({ category: 1, lastActivityAt: -1 });
SupportTicketSchema.index({ createdByUserId: 1, lastActivityAt: -1 });

export const SupportTicket = models.SupportTicket || model('SupportTicket', SupportTicketSchema);
