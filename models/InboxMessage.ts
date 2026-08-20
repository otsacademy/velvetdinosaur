import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/InboxMessage.ts');

import { Schema, model, models } from 'mongoose';

const INBOX_MAILBOXES = ['inbox', 'sent', 'drafts', 'snoozed', 'archive', 'trash'] as const;

const InboxMessageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    threadId: { type: String },
    messageType: { type: String, enum: ['email'], default: 'email' },
    snoozedUntil: { type: Date },
    mailbox: {
      type: String,
      enum: INBOX_MAILBOXES,
      default: 'inbox',
      index: true
    },
    fromName: { type: String, default: '' },
    fromEmail: { type: String, default: '' },
    to: [{ type: String }],
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    preview: { type: String, default: '' },
    receivedAt: { type: Date, default: Date.now, index: true },
    isRead: { type: Boolean, default: false, index: true },
    isStarred: { type: Boolean, default: false, index: true },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

InboxMessageSchema.index({ userId: 1, mailbox: 1, receivedAt: -1 });
InboxMessageSchema.index({ userId: 1, threadId: 1, receivedAt: 1 });
InboxMessageSchema.index({ userId: 1, tags: 1 });

export const InboxMessage = models.InboxMessage || model('InboxMessage', InboxMessageSchema);

export type InboxMailbox = (typeof INBOX_MAILBOXES)[number];
export const inboxMailboxes = INBOX_MAILBOXES;
