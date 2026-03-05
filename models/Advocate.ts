import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Advocate.ts');

import mongoose, { Schema, model } from 'mongoose';

const AdvocateSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String },
    description: { type: String },
    website: { type: String },
    category: { type: String },
    cta: {
      label: { type: String },
      href: { type: String },
      target: { type: String },
      rel: { type: String },
      variant: { type: String }
    },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

export const Advocate = mongoose.models.Advocate || model('Advocate', AdvocateSchema);

