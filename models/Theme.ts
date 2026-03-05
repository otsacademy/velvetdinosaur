import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Theme.ts');

import { Schema, model, models } from 'mongoose';

const ThemeSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    tokens: { type: Schema.Types.Mixed },
    payload: { type: Schema.Types.Mixed },
    draft: { type: Schema.Types.Mixed },
    published: { type: Schema.Types.Mixed },
    publishedAt: { type: Date },
    revisions: {
      type: [
        {
          tokens: Schema.Types.Mixed,
          payload: Schema.Types.Mixed,
          note: String,
          createdAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const Theme = models.Theme || model('Theme', ThemeSchema);
