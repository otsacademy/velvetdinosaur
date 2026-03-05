import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/AssetFolder.ts');

import { Schema, model, models } from 'mongoose';

const AssetFolderSchema = new Schema(
  {
    path: { type: String, required: true, unique: true },
    label: { type: String }
  },
  { timestamps: true }
);

export const AssetFolder = models.AssetFolder || model('AssetFolder', AssetFolderSchema);

