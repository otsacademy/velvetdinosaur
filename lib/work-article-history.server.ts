import { assertServerOnly } from '@/lib/_server/guard'
assertServerOnly('lib/work-article-history.server.ts')

import { type Types } from 'mongoose'

import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { normalizeArticleAuthor } from '@/lib/work-presentation'
import { WorkArticle } from '@/models/WorkArticle'
import { WorkArticleSnapshot } from '@/models/WorkArticleSnapshot'

const SNAPSHOT_LIMIT = 10

type WorkArticleStatus = 'draft' | 'scheduled' | 'published'

type SnapshotModel = {
  _id: Types.ObjectId
  createdAt: Date
  actorUserId?: string | null
  authorUserId?: string | null
  title: string
  status: WorkArticleStatus
  authorSnapshot?: {
    name?: string
    img?: string
    capturedAt?: Date | null
  }
  article?: Record<string, unknown>
}

type UpsertArticle = {
  _id?: string | Types.ObjectId
  slug: string
  title: string
  subtitle?: string
  status?: WorkArticleStatus
  publishedAt?: Date | string | null
  publishAt?: Date | string | null
  desc?: string
  website?: string
  outcome?: string
  tag?: string
  tags?: string[]
  img?: string
  date?: string
  readTime?: string
  imageCaption?: string
  authorUserId?: string | null
  primaryChapterSlug?: string
  chapterSlugs?: string[]
  chapterSnapshot?: {
    primaryChapterSlug?: string
    chapterSlugs?: string[]
    capturedAt?: Date | string | null
  } | null
  author?: { name?: string; img?: string }
  authorSnapshot?: {
    name?: string
    img?: string
    capturedAt?: Date | string | null
  }
  sections?: unknown
  content?: unknown
  openGraphTitle?: string
  openGraphDescription?: string
  openGraphImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  seoTitle?: string | null
  seoDescription?: string | null
  seoSource?: 'manual' | 'auto' | null
  seoGeneratedAt?: Date | null
  seoModel?: string
  seoNeedsReview?: boolean
}

type SanitizedArticle = UpsertArticle & {
  publishedAt: Date | null
  publishAt: Date | null
}

type SnapshotPayload = {
  [key: string]: unknown
  slug?: unknown
  title?: unknown
  status?: unknown
  publishedAt?: unknown
  publishAt?: unknown
  desc?: unknown
  subtitle?: unknown
  website?: unknown
  outcome?: unknown
  tag?: unknown
  tags?: unknown
  img?: unknown
  date?: unknown
  readTime?: unknown
  imageCaption?: unknown
  authorUserId?: unknown
  primaryChapterSlug?: unknown
  chapterSlugs?: unknown
  chapterSnapshot?: unknown
  author?: unknown
  authorSnapshot?: unknown
  sections?: unknown
  content?: unknown
  openGraphTitle?: unknown
  openGraphDescription?: unknown
  openGraphImage?: unknown
  twitterTitle?: unknown
  twitterDescription?: unknown
  twitterImage?: unknown
  seoTitle?: unknown
  seoDescription?: unknown
  seoSource?: unknown
  seoGeneratedAt?: unknown
  seoModel?: unknown
  seoNeedsReview?: unknown
}

export type WorkArticleHistoryItem = {
  id: string
  slug: string
  title: string
  status: WorkArticleStatus
  actorUserId: string | null
  createdAt: string
  article: Record<string, unknown>
}

function toSafeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function clampStatus(value: unknown): WorkArticleStatus {
  return value === 'published'
    ? 'published'
    : value === 'scheduled'
      ? 'scheduled'
      : 'draft'
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

function sanitizeArticleData(value: UpsertArticle): SanitizedArticle {
  const article: SanitizedArticle = {
    slug: toSafeString(value.slug),
    title: toSafeString(value.title),
    subtitle: toSafeString(value.subtitle || ''),
    status: clampStatus(value.status),
    desc: toSafeString(value.desc || ''),
    website: toSafeString(value.website || ''),
    outcome: toSafeString(value.outcome || ''),
    tag: toSafeString(value.tag || 'Case Study'),
    tags: Array.isArray(value.tags)
      ? value.tags
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [],
    img: toSafeString(value.img || '/images/placeholder.svg'),
    date: toSafeString(value.date || ''),
    publishedAt: null,
    publishAt: null,
  }

  if (typeof value.readTime === 'string' && value.readTime.trim()) {
    article.readTime = value.readTime.trim()
  }

  if (typeof value.imageCaption === 'string' && value.imageCaption.trim()) {
    article.imageCaption = value.imageCaption.trim()
  }

  const rawAuthor = typeof value.author === 'object' && value.author
    ? (value.author as { name?: unknown; img?: unknown })
    : {}
  const rawChapterSnapshot = typeof value.chapterSnapshot === 'object' && value.chapterSnapshot
    ? (value.chapterSnapshot as { primaryChapterSlug?: unknown; chapterSlugs?: unknown; capturedAt?: unknown })
    : null
  const rawAuthorSnapshot = typeof value.authorSnapshot === 'object' && value.authorSnapshot
    ? (value.authorSnapshot as { name?: unknown; img?: unknown; capturedAt?: unknown })
    : null
  article.author = normalizeArticleAuthor({
    name: toSafeString(rawAuthor.name),
    img: toSafeString(rawAuthor.img)
  })
  article.authorUserId = toSafeString(value.authorUserId) || null
  article.primaryChapterSlug = normalizeChapterSlug(value.primaryChapterSlug)
  article.chapterSlugs = normalizeChapterSlugs(value.chapterSlugs, article.primaryChapterSlug)
  article.chapterSnapshot = {
    primaryChapterSlug: normalizeChapterSlug(rawChapterSnapshot?.primaryChapterSlug),
    chapterSlugs: normalizeChapterSlugs(rawChapterSnapshot?.chapterSlugs, rawChapterSnapshot?.primaryChapterSlug),
    capturedAt: normalizeDate(rawChapterSnapshot?.capturedAt),
  }
  const snapshotAuthor = normalizeArticleAuthor({
    name: toSafeString(rawAuthorSnapshot?.name),
    img: toSafeString(rawAuthorSnapshot?.img)
  })
  article.authorSnapshot = {
    name: snapshotAuthor.name,
    img: snapshotAuthor.img,
    capturedAt: normalizeDate(rawAuthorSnapshot?.capturedAt),
  }

  if (value.sections !== undefined) {
    article.sections = value.sections
  }

  if (value.content !== undefined) {
    article.content = value.content
  }

  if (typeof value.openGraphTitle === 'string' && value.openGraphTitle.trim()) {
    article.openGraphTitle = value.openGraphTitle.trim()
  }

  if (typeof value.openGraphDescription === 'string' && value.openGraphDescription.trim()) {
    article.openGraphDescription = value.openGraphDescription.trim()
  }

  if (typeof value.openGraphImage === 'string' && value.openGraphImage.trim()) {
    article.openGraphImage = value.openGraphImage.trim()
  }

  if (typeof value.twitterTitle === 'string' && value.twitterTitle.trim()) {
    article.twitterTitle = value.twitterTitle.trim()
  }

  if (typeof value.twitterDescription === 'string' && value.twitterDescription.trim()) {
    article.twitterDescription = value.twitterDescription.trim()
  }

  if (typeof value.twitterImage === 'string' && value.twitterImage.trim()) {
    article.twitterImage = value.twitterImage.trim()
  }

  if (typeof value.seoTitle === 'string') {
    article.seoTitle = value.seoTitle.trim() || null
  }

  if (typeof value.seoDescription === 'string') {
    article.seoDescription = value.seoDescription.trim() || null
  }

  if (value.seoSource === 'manual' || value.seoSource === 'auto' || value.seoSource === null) {
    article.seoSource = value.seoSource
  }

  if (value.seoNeedsReview === true) {
    article.seoNeedsReview = true
  } else if (value.seoNeedsReview === false) {
    article.seoNeedsReview = false
  }

  if (typeof value.seoGeneratedAt === 'string' || value.seoGeneratedAt instanceof Date) {
    const parsed = new Date(value.seoGeneratedAt)
    if (!Number.isNaN(parsed.getTime())) {
      article.seoGeneratedAt = parsed
    }
  }

  if (typeof value.seoModel === 'string' && value.seoModel.trim()) {
    article.seoModel = value.seoModel.trim()
  }

  const publishedAt = normalizeDate(value.publishedAt)
  if (publishedAt) {
    article.publishedAt = publishedAt
  }

  const publishAt = normalizeDate(value.publishAt)
  if (publishAt) {
    article.publishAt = publishAt
  }

  return article
}

async function pruneSnapshots(workArticleId: string) {
  const entries = await WorkArticleSnapshot.find({ workArticle: workArticleId })
    .sort({ createdAt: -1 })
    .skip(SNAPSHOT_LIMIT)
    .select('_id')
    .lean<Pick<SnapshotModel, '_id'>[]>()

  if (entries.length === 0) return

  await WorkArticleSnapshot.deleteMany({
    _id: { $in: entries.map((entry) => entry._id) },
  }).exec()
}

export async function saveWorkArticleSnapshot(input: {
  article: UpsertArticle
  actorUserId: string | null
}) {
  const article = sanitizeArticleData(input.article)
  const articleId = input.article._id ? String(input.article._id) : undefined
  if (!articleId) return

  await WorkArticleSnapshot.create({
    workArticle: articleId,
    slug: article.slug,
    actorUserId: input.actorUserId || null,
    authorUserId: article.authorUserId || null,
    title: article.title || 'Untitled',
    status: article.status,
    publishedAt: article.publishedAt || null,
    publishAt: article.publishAt || null,
    authorSnapshot: article.authorSnapshot,
    openGraphTitle: article.openGraphTitle,
    openGraphDescription: article.openGraphDescription,
    openGraphImage: article.openGraphImage,
    twitterTitle: article.twitterTitle,
    twitterDescription: article.twitterDescription,
    twitterImage: article.twitterImage,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    seoSource: article.seoSource,
    seoGeneratedAt: article.seoGeneratedAt || null,
    seoModel: article.seoModel,
    seoNeedsReview: article.seoNeedsReview ?? false,
    article,
  })

  await pruneSnapshots(articleId)
}

export async function listWorkArticleSnapshots(slug: string) {
  const rows = await WorkArticleSnapshot.find({ slug })
    .sort({ createdAt: -1 })
    .limit(SNAPSHOT_LIMIT)
    .lean<SnapshotModel[]>()

  return rows.map((entry) => ({
    id: String(entry._id),
    slug,
    title: entry.title || 'Untitled',
    status: entry.status || 'draft',
    actorUserId: entry.actorUserId ?? null,
    createdAt: entry.createdAt.toISOString(),
    article: (entry as { article?: Record<string, unknown> }).article || {},
  }))
}

export async function getWorkArticleSnapshot(slug: string, snapshotId: string) {
  return WorkArticleSnapshot.findOne({ slug, _id: snapshotId }).lean<{
    article?: Record<string, unknown>
    status?: WorkArticleStatus
    publishAt?: Date | null
    actorUserId?: string | null
    authorUserId?: string | null
    title?: string
    createdAt?: Date
    publishedAt?: Date | null
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
    seoTitle?: string | null
    seoDescription?: string | null
    seoSource?: 'manual' | 'auto' | null
    seoGeneratedAt?: Date | null
    seoModel?: string | null
    seoNeedsReview?: boolean
  }>()
}

export async function restoreWorkArticleSnapshot(slug: string, snapshotId: string) {
  const snapshot = await getWorkArticleSnapshot(slug, snapshotId)
  if (!snapshot || !snapshot.article) {
    return { ok: false as const, reason: 'Snapshot not found' }
  }

  const payload = snapshot.article
  const payloadRecord = payload as Record<string, unknown>
  const payloadSlug = typeof payloadRecord.slug === 'string' ? payloadRecord.slug.trim() : ''
  const payloadTitle = typeof payloadRecord.title === 'string' ? payloadRecord.title.trim() : ''
  const articleId = (await WorkArticle.findOne({ slug }).select({ _id: 1 }).lean<{ _id: Types.ObjectId }>())?._id

  if (!articleId) {
    return { ok: false as const, reason: 'Article not found' }
  }

  const normalizedPayload = sanitizeArticleData({
    _id: articleId,
    ...(payloadRecord as SnapshotPayload),
    slug: payloadSlug || slug,
    title: payloadTitle || 'Restored article',
    status: snapshot.status || 'draft',
    publishAt: snapshot.publishAt || null,
    authorUserId: snapshot.authorUserId || null,
    authorSnapshot: snapshot.authorSnapshot || null,
    openGraphTitle: snapshot.openGraphTitle,
    openGraphDescription: snapshot.openGraphDescription,
    openGraphImage: snapshot.openGraphImage,
    twitterTitle: snapshot.twitterTitle,
    twitterDescription: snapshot.twitterDescription,
    twitterImage: snapshot.twitterImage,
    seoTitle: snapshot.seoTitle || null,
    seoDescription: snapshot.seoDescription || null,
    seoSource: snapshot.seoSource ?? null,
    seoGeneratedAt: snapshot.seoGeneratedAt || null,
    seoModel: snapshot.seoModel || undefined,
    seoNeedsReview: snapshot.seoNeedsReview || false,
  } as UpsertArticle)

  await WorkArticle.updateOne(
    { _id: articleId },
    {
      $set: {
        slug: normalizedPayload.slug,
        title: normalizedPayload.title,
        subtitle: normalizedPayload.subtitle as string,
        status: normalizedPayload.status,
        desc: normalizedPayload.desc as string,
        website: normalizedPayload.website as string,
        outcome: normalizedPayload.outcome as string,
        tag: normalizedPayload.tag as string,
        tags: Array.isArray(normalizedPayload.tags) ? normalizedPayload.tags : [],
        img: normalizedPayload.img as string,
        date: normalizedPayload.date as string,
        readTime: typeof normalizedPayload.readTime === 'string' ? (normalizedPayload.readTime as string) : '1 min read',
        imageCaption: normalizedPayload.imageCaption as string | undefined,
        author: normalizedPayload.author as { name: string; img: string },
        authorUserId: normalizedPayload.authorUserId || null,
        authorSnapshot: normalizedPayload.authorSnapshot || null,
        sections: normalizedPayload.sections as unknown[],
        content: normalizedPayload.content as unknown,
        publishedAt: normalizedPayload.publishedAt || null,
        publishAt: normalizedPayload.publishAt || null,
        openGraphTitle: normalizedPayload.openGraphTitle,
        openGraphDescription: normalizedPayload.openGraphDescription,
        openGraphImage: normalizedPayload.openGraphImage,
        twitterTitle: normalizedPayload.twitterTitle,
        twitterDescription: normalizedPayload.twitterDescription,
        twitterImage: normalizedPayload.twitterImage,
        seoTitle: normalizedPayload.seoTitle,
        seoDescription: normalizedPayload.seoDescription,
        seoSource: normalizedPayload.seoSource,
        seoGeneratedAt: normalizedPayload.seoGeneratedAt || null,
        seoModel: normalizedPayload.seoModel,
        seoNeedsReview: normalizedPayload.seoNeedsReview,
      },
    },
    { runValidators: true },
  )

  await saveWorkArticleSnapshot({
    article: normalizedPayload,
    actorUserId: null,
  })

  const restored = (await WorkArticle.findOne({ _id: articleId }).lean()) as {
    slug?: string
    title?: string
    status?: WorkArticleStatus
  } | null

  if (!restored?.slug) {
    return { ok: false as const, reason: 'Restore failed' }
  }

  return {
    ok: true as const,
    slug: restored.slug,
    article: normalizedPayload,
  }
}
