import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Review.ts');

import mongoose, { Schema, model } from 'mongoose';

const ReviewSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    author: { type: String, required: true },
    role: { type: String },
    dateLabel: { type: String },
    content: { type: String, required: true },
    avatar: { type: String },
    source: { type: String },
    rating: { type: Number },
    highlight: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Review = mongoose.models.Review || model('Review', ReviewSchema);

