import { revalidatePath } from 'next/cache'
import { assertServerOnly } from '@/lib/_server/guard'
assertServerOnly('lib/work/scheduled-publishing.server.ts')

import { type Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { saveWorkArticleSnapshot } from '@/lib/work-article-history.server'
import { WorkArticle } from '@/models/WorkArticle'

type WorkArticleStatus = 'draft' | 'scheduled' | 'published'

type ScheduledArticleDoc = {
  _id: Types.ObjectId
  slug: string
  title: string
  status: WorkArticleStatus
  desc: string
  tag: string
  img: string
  date: string
  readTime: string
  imageCaption?: string
  author?: { name?: string; img?: string }
  sections?: unknown
  content?: unknown
  publishedAt?: Date | string | null
  publishAt?: Date | string | null
  openGraphTitle?: string
  openGraphDescription?: string
  openGraphImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

type RehydratePath = {
  slug: string
  status: WorkArticleStatus
}

type PublishResult = {
  slug: string
  status: 'published' | 'failed' | 'skipped'
  reason?: string
}

export type ScheduledPublishSummary = {
  checked: number
  published: number
  skipped: number
  failed: number
  checkedAt: string
  results: PublishResult[]
}

function readDate(value: unknown) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

function toDateOrNow(value: unknown) {
  const date = readDate(value)
  return date || new Date()
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanStatus(value: unknown): WorkArticleStatus {
  return value === 'published' ? 'published' : value === 'scheduled' ? 'scheduled' : 'draft'
}

export async function publishScheduledWorkArticles(now = new Date(), options?: { dryRun?: boolean }) {
  const conn = await connectDB()
  if (!conn) {
    return {
      checked: 0,
      published: 0,
      skipped: 0,
      failed: 0,
      checkedAt: now.toISOString(),
      results: [{ slug: 'work', status: 'skipped', reason: 'Database unavailable' }],
    } satisfies ScheduledPublishSummary
  }

  const candidates = (await WorkArticle.find({
    status: 'scheduled',
    publishAt: { $lte: now },
  })
    .select({
      slug: 1,
      title: 1,
      desc: 1,
      tag: 1,
      img: 1,
      date: 1,
      readTime: 1,
      imageCaption: 1,
      author: 1,
      sections: 1,
      content: 1,
      publishedAt: 1,
      publishAt: 1,
      openGraphTitle: 1,
      openGraphDescription: 1,
      openGraphImage: 1,
      twitterTitle: 1,
      twitterDescription: 1,
      twitterImage: 1,
      status: 1,
    })
    .lean<ScheduledArticleDoc[]>()
    .exec())

  const summary: ScheduledPublishSummary = {
    checked: candidates.length,
    published: 0,
    skipped: 0,
    failed: 0,
    checkedAt: now.toISOString(),
    results: [],
  }

  for (const article of candidates) {
    const payload: RehydratePath = { slug: article.slug, status: cleanStatus(article.status) }
    if (!payload.slug) {
      summary.skipped += 1
      summary.results.push({ slug: article.slug || 'unknown', status: 'skipped', reason: 'Missing slug' })
      continue
    }

    if (payload.status !== 'scheduled') {
      summary.skipped += 1
      summary.results.push({ slug: payload.slug, status: 'skipped', reason: 'Status changed' })
      continue
    }

    try {
      if (options?.dryRun) {
        summary.published += 1
        summary.results.push({ slug: payload.slug, status: 'published' })
        continue
      }

      const publishedAt = toDateOrNow(article.publishedAt)

      const publishResult = await WorkArticle.updateOne(
        { _id: article._id, status: 'scheduled', publishAt: { $lte: now } },
        {
          $set: {
            status: 'published',
            publishedAt,
            publishAt: null,
            pendingPublishRequest: null,
          },
          $inc: { revision: 1 },
        },
      ).exec()
      if (!publishResult.modifiedCount) {
        summary.skipped += 1
        summary.results.push({ slug: payload.slug, status: 'skipped', reason: 'No longer due' })
        continue
      }

      await saveWorkArticleSnapshot({
        article: {
          _id: article._id,
          slug: article.slug,
          title: normalizeText(article.title),
          status: 'published',
          desc: normalizeText(article.desc) || 'Scheduled article',
          tag: normalizeText(article.tag) || 'Case Study',
          img: normalizeText(article.img) || '/images/placeholder.svg',
          date: normalizeText(article.date),
          readTime: normalizeText(article.readTime) || '1 min read',
          imageCaption: normalizeText(article.imageCaption),
          author: {
            name: normalizeText((article.author as { name?: unknown })?.name) || 'Velvet Dinosaur',
            img: normalizeText((article.author as { img?: unknown })?.img) || '/images/placeholder.svg',
          },
          sections: article.sections || [],
          content: article.content,
          publishedAt,
          publishAt: null,
          openGraphTitle: article.openGraphTitle,
          openGraphDescription: article.openGraphDescription,
          openGraphImage: article.openGraphImage,
          twitterTitle: article.twitterTitle,
          twitterDescription: article.twitterDescription,
          twitterImage: article.twitterImage,
        },
        actorUserId: null,
      })

      revalidatePath('/')
      revalidatePath('/work')
      revalidatePath(`/work/${payload.slug}`)

      summary.published += 1
      summary.results.push({ slug: payload.slug, status: 'published' })
    } catch (error) {
      summary.failed += 1
      summary.results.push({ slug: payload.slug, status: 'failed', reason: error instanceof Error ? error.message : 'Publish failed' })
    }
  }

  return summary
}
