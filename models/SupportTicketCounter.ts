import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/SupportTicketCounter.ts');

import { Schema, model, models } from 'mongoose';

const SupportTicketCounterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const SupportTicketCounter =
  models.SupportTicketCounter || model('SupportTicketCounter', SupportTicketCounterSchema);
