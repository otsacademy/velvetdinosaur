import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/WaitlistSignup.ts');

import { Schema, model, models } from 'mongoose';

const WaitlistSignupSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    source: { type: String, trim: true },
    userAgent: { type: String, trim: true }
  },
  { timestamps: true }
);

export const WaitlistSignup = models.WaitlistSignup || model('WaitlistSignup', WaitlistSignupSchema);

