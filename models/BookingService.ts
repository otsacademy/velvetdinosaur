import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/BookingService.ts');

import { Schema, model, models } from 'mongoose';

const BookingServiceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '', trim: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 24 * 60 },
    bufferMinutes: { type: Number, default: 0, min: 0, max: 240 },
    pricePence: { type: Number, default: null, min: 0 },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

BookingServiceSchema.index({ active: 1, sortOrder: 1 });

export const BookingService =
  models.BookingService || model('BookingService', BookingServiceSchema);
