import { assertServerOnly } from '@/lib/_server/guard'
assertServerOnly('models/WorkArticleSnapshot.ts')

import { Schema, model, models, type Types } from 'mongoose'

export type WorkArticleSnapshotDocument = {
  workArticle: Types.ObjectId
  slug: string
  actorUserId?: string | null
  authorUserId?: string | null
  title: string
  status: 'draft' | 'scheduled' | 'published'
  publishedAt: Date | null
  publishAt?: Date | null
  authorSnapshot?: {
    name?: string
    img?: string
    capturedAt?: Date | null
  }
  openGraphTitle?: string
  openGraphDescription?: string
  openGraphImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  article: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

const WorkArticleSnapshotSchema = new Schema(
  {
    workArticle: {
      type: Schema.Types.ObjectId,
      ref: 'WorkArticle',
      required: true,
      index: true,
    },
    slug: { type: String, required: true, index: true },
    actorUserId: { type: String },
    authorUserId: { type: String, default: null },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'draft',
    },
    publishedAt: { type: Date, default: null },
    publishAt: { type: Date, default: null },
    authorSnapshot: {
      name: { type: String },
      img: { type: String, default: '/dinosaur.webp' },
      capturedAt: { type: Date, default: null }
    },
    openGraphTitle: { type: String },
    openGraphDescription: { type: String },
    openGraphImage: { type: String },
    twitterTitle: { type: String },
    twitterDescription: { type: String },
    twitterImage: { type: String },
    article: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
)

WorkArticleSnapshotSchema.index({ slug: 1, createdAt: -1 })
WorkArticleSnapshotSchema.index({ workArticle: 1, createdAt: -1 })

export const WorkArticleSnapshot =
  models.WorkArticleSnapshot || model<WorkArticleSnapshotDocument>('WorkArticleSnapshot', WorkArticleSnapshotSchema)
