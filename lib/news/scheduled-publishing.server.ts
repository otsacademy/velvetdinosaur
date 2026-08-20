import { revalidatePath } from 'next/cache'
import { assertServerOnly } from '@/lib/_server/guard'
assertServerOnly('lib/news/scheduled-publishing.server.ts')

import { type Types } from 'mongoose'
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate'
import { newsTags } from '@/lib/cache-tags'
import { connectDB } from '@/lib/db'
import { rewriteInlineMediaForStorage } from '@/lib/inline-media.server'
import { saveNewsArticleSnapshot } from '@/lib/news-article-history.server'
import { cleanString } from '@/lib/string-sanitizer'
import { NewsArticle } from '@/models/NewsArticle'

type NewsArticleStatus = 'draft' | 'scheduled' | 'published'

type ScheduledArticleDoc = {
  _id: Types.ObjectId
  slug: string
  title: string
  status: NewsArticleStatus
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
  status: NewsArticleStatus
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
  return cleanString(value)
}

function cleanStatus(value: unknown): NewsArticleStatus {
  return value === 'published' ? 'published' : value === 'scheduled' ? 'scheduled' : 'draft'
}

export async function publishScheduledNewsArticles(now = new Date(), options?: { dryRun?: boolean }) {
  const conn = await connectDB()
  if (!conn) {
    return {
      checked: 0,
      published: 0,
      skipped: 0,
      failed: 0,
      checkedAt: now.toISOString(),
      results: [{ slug: 'news', status: 'skipped', reason: 'Database unavailable' }],
    } satisfies ScheduledPublishSummary
  }

  const candidates = (await NewsArticle.find({
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
      const media = await rewriteInlineMediaForStorage(
        {
          img: article.img,
          author: article.author,
          sections: article.sections,
          content: article.content,
          openGraphImage: article.openGraphImage,
          twitterImage: article.twitterImage,
        },
        {
          folder: 'news',
          label: `news:${payload.slug}`,
        },
      )

      const publishResult = await NewsArticle.updateOne(
        { _id: article._id, status: 'scheduled', publishAt: { $lte: now } },
        {
          $set: {
            status: 'published',
            publishedAt,
            publishAt: null,
            pendingPublishRequest: null,
            img: media.value.img,
            author: media.value.author,
            sections: media.value.sections,
            content: media.value.content,
            openGraphImage: media.value.openGraphImage,
            twitterImage: media.value.twitterImage,
          },
          $inc: { revision: 1 },
        },
      ).exec()
      if (!publishResult.modifiedCount) {
        summary.skipped += 1
        summary.results.push({ slug: payload.slug, status: 'skipped', reason: 'No longer due' })
        continue
      }

      await saveNewsArticleSnapshot({
        article: {
          _id: article._id,
          slug: article.slug,
          title: normalizeText(article.title),
          status: 'published',
          desc: normalizeText(article.desc) || 'Scheduled article',
          tag: normalizeText(article.tag) || 'Announcements',
          img: normalizeText(media.value.img) || '/images/placeholder.svg',
          date: normalizeText(article.date),
          readTime: normalizeText(article.readTime) || '1 min read',
          imageCaption: normalizeText(article.imageCaption),
          author: {
            name: normalizeText((media.value.author as { name?: unknown })?.name) || 'ASAP Editorial',
            img: normalizeText((media.value.author as { img?: unknown })?.img) || '/images/placeholder.svg',
          },
          sections: media.value.sections || [],
          content: media.value.content,
          publishedAt,
          publishAt: null,
          openGraphTitle: article.openGraphTitle,
          openGraphDescription: article.openGraphDescription,
          openGraphImage: media.value.openGraphImage,
          twitterTitle: article.twitterTitle,
          twitterDescription: article.twitterDescription,
          twitterImage: media.value.twitterImage,
        },
        actorUserId: null,
      })

      revalidatePath('/')
      revalidatePath('/news')
      revalidatePath(`/news/${payload.slug}`)
      revalidateTag(newsTags.content)
      revalidateTag(newsTags.list)
      revalidateTag(newsTags.cards)
      revalidateTag(newsTags.article(payload.slug))

      summary.published += 1
      summary.results.push({ slug: payload.slug, status: 'published' })
    } catch (error) {
      summary.failed += 1
      summary.results.push({ slug: payload.slug, status: 'failed', reason: error instanceof Error ? error.message : 'Publish failed' })
    }
  }

  return summary
}
