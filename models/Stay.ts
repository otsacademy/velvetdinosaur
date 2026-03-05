import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Stay.ts');

import mongoose, { Schema, model } from 'mongoose';

const CtaSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    target: { type: String },
    rel: { type: String },
    variant: { type: String }
  },
  { _id: false }
);

const StaySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    sortOrder: { type: Number },
    name: { type: String, required: true },
    location: { type: String },
    type: { type: String },
    summary: { type: String },
    description: { type: String },
    heroImage: { type: String },
    gallery: [{ type: String }],
    videoId: { type: String },
    price: { type: Number },
    currency: { type: String, default: 'GBP' },
    isStartingFrom: { type: Boolean, default: false },
    badges: [{ type: String }],
    amenities: [{ type: String }],
    policies: [{ type: String }],
    ctas: [CtaSchema],
    details: {
      guests: { type: Number },
      bedrooms: { type: Number },
      bathrooms: { type: Number },
      size: { type: String },
      externalId: { type: Number }
    },
    address: {
      address: { type: String },
      city: { type: String },
      area: { type: String },
      county: { type: String },
      state: { type: String },
      country: { type: String },
      zip: { type: String }
    },
    metaNote: { type: String }
  },
  { timestamps: true }
);

export const Stay = mongoose.models.Stay || model('Stay', StaySchema);

