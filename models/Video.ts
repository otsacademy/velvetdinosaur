import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Video.ts');

import mongoose, { Schema, model } from 'mongoose';

const VideoSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    platform: { type: String },
    videoId: { type: String },
    url: { type: String },
    thumbnail: { type: String },
    category: { type: String },
    author: { type: String },
    likes: { type: Number },
    shares: { type: Number }
  },
  { timestamps: true }
);

export const Video = mongoose.models.Video || model('Video', VideoSchema);

