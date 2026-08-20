import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/PageRedirect.ts');

import { Schema, model, models } from 'mongoose';

// Permanent redirects left behind when a page moves. fromPath is the old public
// path (no leading slash); toSlug is the page's stable identity, so chains
// auto-collapse: the redirect always resolves to the page's *current* location.
const PageRedirectSchema = new Schema(
  {
    fromPath: { type: String, required: true, unique: true },
    toSlug: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

export const PageRedirect = models.PageRedirect || model('PageRedirect', PageRedirectSchema);
