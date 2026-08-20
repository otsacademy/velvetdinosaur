import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Page.ts');

import { Schema, model, models } from 'mongoose';

const PageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    // Public URL path without leading slash (e.g. 'our-work/asap-award').
    // Absent on legacy pages: their public URL falls back to /<slug>.
    // Never write null — sparse unique indexes treat explicit null as a value; use $unset.
    path: { type: String, unique: true, sparse: true },
    title: { type: String },
    // Backward-compatible legacy fields.
    data: { type: Schema.Types.Mixed },
    status: { type: String, default: 'published' },

    // Draft/publish split.
    draftData: { type: Schema.Types.Mixed },
    publishedData: { type: Schema.Types.Mixed },
    draftUpdatedAt: { type: Date },
    publishedAt: { type: Date },
    primaryChapterSlug: { type: String, default: '' },
    chapterSlugs: { type: [String], default: [] },
    createdByUserId: { type: String, default: null },
    updatedByUserId: { type: String, default: null },
    pendingPublishRequest: {
      requestId: { type: String, default: null },
      baseRevision: { type: Number, default: null },
      requestedAt: { type: Date, default: null },
      requestedByUserId: { type: String, default: null },
      requestedByEmail: { type: String, default: null },
      requestedByName: { type: String, default: null }
    },
    revision: { type: Number, default: 1, min: 1 },
    lastRejection: {
      reason: { type: String, default: null },
      rejectedAt: { type: Date, default: null },
      rejectedByUserId: { type: String, default: null },
      rejectedByEmail: { type: String, default: null },
      rejectedByName: { type: String, default: null }
    },

    // Lightweight history used for editor migrations/rollback snapshots.
    history: [
      {
        action: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        snapshot: { type: Schema.Types.Mixed },
        meta: { type: Schema.Types.Mixed }
      }
    ],

    legacySnapshots: [
      {
        id: { type: String, required: true },
        timestamp: { type: String, required: true },
        userId: { type: String, required: true },
        draftPayload: { type: Schema.Types.Mixed },
        publishedPayload: { type: Schema.Types.Mixed },
        fromType: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const Page = models.Page || model('Page', PageSchema);
