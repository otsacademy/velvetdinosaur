import { assertServerOnly } from '@/lib/_server/guard'
assertServerOnly('models/WorkArticle.ts')

import { Schema, model, models } from 'mongoose'

const ArticleCalloutSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
  },
  { _id: false },
)

const ArticleTableSchema = new Schema(
  {
    headers: {
      type: [String],
      default: undefined,
    },
    rows: {
      type: [[String]],
      default: undefined,
    },
  },
  { _id: false },
)

const ArticleSectionSchema = new Schema(
  {
    id: { type: String },
    heading: { type: String, required: true },
    paragraphs: {
      type: [String],
      default: [],
    },
    quote: { type: String },
    listItems: {
      type: [String],
      default: undefined,
    },
    table: {
      type: ArticleTableSchema,
      default: undefined,
    },
    alert: {
      type: ArticleCalloutSchema,
      default: undefined,
    },
  },
  { _id: false },
)

const ArticleChapterSnapshotSchema = new Schema(
  {
    primaryChapterSlug: { type: String, default: '', trim: true },
    chapterSlugs: {
      type: [String],
      default: [],
    },
    capturedAt: { type: Date, default: null },
  },
  { _id: false },
)

const WorkArticleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    desc: { type: String, required: true },
    website: { type: String, default: '' },
    outcome: { type: String, default: '' },
    imageCaption: { type: String },
    tag: { type: String, required: true },
    tags: {
      type: [String],
      default: [],
    },
    img: { type: String, required: true },
    date: { type: String, required: true },
    readTime: { type: String, required: true },
    sourcePostId: { type: Number, default: undefined },
    sourceUrl: { type: String, default: '' },
    sourceSlug: { type: String, default: '' },
    sourceDate: { type: Date, default: null },
    sourceDateGmt: { type: Date, default: null },
    sourceModified: { type: Date, default: null },
    sourceModifiedGmt: { type: Date, default: null },
    photoUrls: {
      type: [String],
      default: [],
    },
    outboundLinks: {
      type: [String],
      default: [],
    },
    author: {
      name: { type: String, required: true },
      img: { type: String, default: '/dinosaur.webp' },
    },
    authorUserId: { type: String, default: null, index: true },
    primaryChapterSlug: { type: String, default: '', trim: true, index: true },
    chapterSlugs: {
      type: [String],
      default: [],
    },
    chapterSnapshot: {
      type: ArticleChapterSnapshotSchema,
      default: null,
    },
    authorSnapshot: {
      name: { type: String },
      img: { type: String, default: '/dinosaur.webp' },
      capturedAt: { type: Date, default: null },
    },
    pendingPublishRequest: {
      requestId: { type: String, default: null },
      baseRevision: { type: Number, default: null },
      requestedAt: { type: Date, default: null },
      requestedByUserId: { type: String, default: null },
      requestedByEmail: { type: String, default: null },
      requestedByName: { type: String, default: null },
      requestedMode: { type: String, enum: ['publish', 'scheduled'], default: 'publish' },
      requestedPublishAt: { type: Date, default: null },
    },
    revision: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastRejection: {
      reason: { type: String, default: null },
      rejectedAt: { type: Date, default: null },
      rejectedByUserId: { type: String, default: null },
      rejectedByEmail: { type: String, default: null },
      rejectedByName: { type: String, default: null },
    },
    sections: {
      type: [ArticleSectionSchema],
      default: [],
    },
    content: {
      type: Schema.Types.Mixed,
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'draft',
    },
    editorSettings: {
      fontFamily: {
        type: String,
        enum: ['sans', 'serif', 'mono'],
        default: 'sans',
      },
      fullWidth: { type: Boolean, default: false },
      smallText: { type: Boolean, default: false },
      lockPage: { type: Boolean, default: false },
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishAt: {
      type: Date,
      default: null,
      index: true,
    },
    openGraphTitle: { type: String },
    openGraphDescription: { type: String },
    openGraphImage: { type: String },
    twitterTitle: { type: String },
    twitterDescription: { type: String },
    twitterImage: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoSource: { type: String, enum: ['manual', 'auto', null], default: null },
    seoGeneratedAt: { type: Date, default: null },
    seoModel: { type: String, default: null },
    seoNeedsReview: { type: Boolean, default: false },
  },
  { timestamps: true },
)

WorkArticleSchema.index({ publishedAt: -1, createdAt: -1 })
WorkArticleSchema.index({ sourcePostId: 1 }, { unique: true, sparse: true })
WorkArticleSchema.index({ sourceSlug: 1 }, { sparse: true })

export const WorkArticle = models.WorkArticle || model('WorkArticle', WorkArticleSchema)
