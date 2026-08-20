import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/SupportExternalSnapshot.ts');

import { Schema, model, models } from 'mongoose';

const SUPPORT_EXTERNAL_SNAPSHOT_TYPES = ['system_status', 'development_hours'] as const;

const SupportExternalSnapshotSchema = new Schema(
  {
    snapshotType: {
      type: String,
      enum: SUPPORT_EXTERNAL_SNAPSHOT_TYPES,
      required: true,
      index: true
    },
    source: { type: String, default: '', trim: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    fetchedAt: { type: Date, required: true, default: Date.now, index: true }
  },
  { timestamps: true }
);

SupportExternalSnapshotSchema.index({ snapshotType: 1, fetchedAt: -1 });

export const SupportExternalSnapshot =
  models.SupportExternalSnapshot || model('SupportExternalSnapshot', SupportExternalSnapshotSchema);

export const supportExternalSnapshotTypes = SUPPORT_EXTERNAL_SNAPSHOT_TYPES;
