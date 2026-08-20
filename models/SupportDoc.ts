import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/SupportDoc.ts');

import { Schema, model, models } from 'mongoose';

const SUPPORT_DOC_LINK_TYPES = ['download', 'view'] as const;

const SupportDocSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '', trim: true },
    module: { type: String, default: '', trim: true, index: true },
    category: { type: String, default: '', trim: true, index: true },
    tags: { type: [String], default: [] },
    linkType: { type: String, enum: SUPPORT_DOC_LINK_TYPES, default: 'view', index: true },
    url: { type: String, required: true, trim: true },
    searchable: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdByUserId: { type: String, default: '', trim: true },
    createdByEmail: { type: String, default: '', trim: true, lowercase: true },
    publishedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

SupportDocSchema.index({ publishedAt: -1, _id: -1 });
SupportDocSchema.index({ title: 'text', description: 'text', module: 'text', category: 'text', tags: 'text' });

export const SupportDoc = models.SupportDoc || model('SupportDoc', SupportDocSchema);
export const supportDocLinkTypes = SUPPORT_DOC_LINK_TYPES;
