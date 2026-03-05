import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Page.ts');

import { Schema, model, models } from 'mongoose';

const PageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String },
    // Backward-compatible legacy fields.
    data: { type: Schema.Types.Mixed },
    status: { type: String, default: 'published' },

    // Draft/publish split.
    draftData: { type: Schema.Types.Mixed },
    publishedData: { type: Schema.Types.Mixed },
    draftUpdatedAt: { type: Date },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

export const Page = models.Page || model('Page', PageSchema);
