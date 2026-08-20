import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/CalendarEvent.ts');

import { Schema, model, models } from 'mongoose';

const CalendarEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:mm
    durationMin: { type: Number, default: 60 },
    calendarId: { type: String, default: 'personal', index: true },
    calendarName: { type: String, default: 'Personal' },
    calendarColor: { type: String, default: 'primary' },
    eventType: {
      type: String,
      enum: ['event', 'task', 'reminder', 'out-of-office'],
      default: 'event',
      index: true
    },
    allDay: { type: Boolean, default: false },
    endDateKey: { type: String, default: '' },
    meetingType: {
      type: String,
      enum: ['', 'in-person', 'online', 'hybrid'],
      default: ''
    },
    category: { type: String, default: '' },
    reminderMinutes: { type: Number, default: 30 },
    location: { type: String, default: '' },
    attendees: [{ type: String }],
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

CalendarEventSchema.index({ userId: 1, dateKey: 1, time: 1 });
CalendarEventSchema.index({ userId: 1, calendarId: 1, dateKey: 1, time: 1 });

export const CalendarEvent = models.CalendarEvent || model('CalendarEvent', CalendarEventSchema);
