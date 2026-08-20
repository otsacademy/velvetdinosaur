import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/SupportArticle.ts');

import { Schema, model, models } from 'mongoose';

const SUPPORT_ARTICLE_TYPES = ['knowledge', 'announcement', 'feature'] as const;

const SupportArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    type: { type: String, enum: SUPPORT_ARTICLE_TYPES, required: true, index: true },
    category: { type: String, default: '', trim: true, index: true },
    module: { type: String, default: '', trim: true, index: true },
    tags: { type: [String], default: [] },
    summary: { type: String, default: '', trim: true },
    bodyText: { type: String, default: '' },
    searchable: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdByUserId: { type: String, default: '', trim: true },
    createdByEmail: { type: String, default: '', trim: true, lowercase: true },
    publishedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

SupportArticleSchema.index({ type: 1, publishedAt: -1 });
SupportArticleSchema.index({ title: 'text', summary: 'text', bodyText: 'text', category: 'text', module: 'text', tags: 'text' });

export const SupportArticle = models.SupportArticle || model('SupportArticle', SupportArticleSchema);
export const supportArticleTypes = SUPPORT_ARTICLE_TYPES;
