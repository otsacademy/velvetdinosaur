import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/CalendarDefinition.ts');

import { Schema, model, models } from 'mongoose';

const CALENDAR_COLORS = ['primary', 'accent', 'destructive', 'muted'] as const;

const CalendarDefinitionSchema = new Schema(
  {
    ownerUserId: { type: String, required: true, index: true },
    calendarId: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, enum: CALENDAR_COLORS, default: 'primary' },
    archived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

CalendarDefinitionSchema.index({ ownerUserId: 1, calendarId: 1 }, { unique: true });

export const CalendarDefinition =
  models.CalendarDefinition || model('CalendarDefinition', CalendarDefinitionSchema);

export type CalendarColor = (typeof CALENDAR_COLORS)[number];
export const calendarColors = CALENDAR_COLORS;
