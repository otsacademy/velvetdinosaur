import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/ContactSettings.ts');

import mongoose, { Schema, model } from 'mongoose';

const ContactSettingsSchema = new Schema(
  {
    contactEmailHtml: { type: String },
    contactEmailText: { type: String }
  },
  { timestamps: true }
);

export const ContactSettings =
  mongoose.models.ContactSettings || model('ContactSettings', ContactSettingsSchema);
