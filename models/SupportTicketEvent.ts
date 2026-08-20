import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/SupportTicketEvent.ts');

import { Schema, model, models } from 'mongoose';
import { SUPPORT_TICKET_STATUSES, SUPPORT_WAITING_ON } from '@/lib/support/constants';

const SupportTicketEventSchema = new Schema(
  {
    ticketId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ['ticket_created', 'message_added', 'status_changed', 'reopened', 'closed', 'updated'],
      required: true,
      index: true
    },
    actorUserId: { type: String, default: '', trim: true, index: true },
    actorEmail: { type: String, default: '', trim: true, lowercase: true, index: true },
    actorName: { type: String, default: '', trim: true },
    actorRole: {
      type: String,
      enum: ['admin-requester', 'support-agent', 'system'],
      default: 'admin-requester'
    },
    fromStatus: { type: String, enum: [...SUPPORT_TICKET_STATUSES, ''], default: '' },
    toStatus: { type: String, enum: [...SUPPORT_TICKET_STATUSES, ''], default: '' },
    fromWaitingOn: { type: String, enum: [...SUPPORT_WAITING_ON, ''], default: '' },
    toWaitingOn: { type: String, enum: [...SUPPORT_WAITING_ON, ''], default: '' },
    message: { type: String, default: '', trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

SupportTicketEventSchema.index({ ticketId: 1, createdAt: 1 });

export const SupportTicketEvent =
  models.SupportTicketEvent || model('SupportTicketEvent', SupportTicketEventSchema);
