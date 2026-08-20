import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/CalendarShare.ts');

import { Schema, model, models } from 'mongoose';

const CALENDAR_SHARE_ROLES = ['view', 'edit'] as const;

const CalendarShareSchema = new Schema(
  {
    ownerUserId: { type: String, required: true, index: true },
    calendarId: { type: String, required: true },
    recipientEmail: { type: String, required: true, index: true },
    role: { type: String, enum: CALENDAR_SHARE_ROLES, default: 'edit' },
    createdByUserId: { type: String, required: true }
  },
  { timestamps: true }
);

CalendarShareSchema.index({ ownerUserId: 1, calendarId: 1, recipientEmail: 1 }, { unique: true });

export const CalendarShare = models.CalendarShare || model('CalendarShare', CalendarShareSchema);

export type CalendarShareRole = (typeof CALENDAR_SHARE_ROLES)[number];
export const calendarShareRoles = CALENDAR_SHARE_ROLES;
