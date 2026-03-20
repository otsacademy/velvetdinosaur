import { connection } from 'next/server'
import { assertServerOnly } from '@/lib/_server/guard'
import type { Article } from '@/lib/articles'
import { getChapterName, normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { connectDB } from '@/lib/db'
import { normalizeArticleAuthor } from '@/lib/work-presentation'
import { normalizeWorkEditorDocumentSettings } from '@/lib/work-editor-document-settings'
import { shouldExcludeFromWorkListings } from '@/lib/work-listing-filters'
import { WORK_FIXTURES, getWorkFixtureBySlug } from '@/lib/work-fixtures'
import { WorkArticle } from '@/models/WorkArticle'
import {
  extractHeroImageFromPlate,
  hasContent,
  isRealImageUrl,
  normalizePlateValue,
  plateToArticleSections,
} from '@/lib/work-plate-transform'

assertServerOnly('lib/work-articles.server.ts')

export type WorkArticleListRow = {
  slug: string
  title: string
  tag: string
  primaryChapterName: string
  date: string
  authorName: string
  status: WorkArticleStatus
  pendingPublishRequestedAt: string | null
  updatedAt: string | null
}

type WorkArticleStatus = 'draft' | 'scheduled' | 'published'

type DatabaseArticle = {
  slug: string
  title: string
  subtitle?: string
  desc: string
  website?: string
  outcome?: string
  imageCaption?: string
  tag?: string
  tags?: string[]
  img?: string
  date?: string
  readTime?: string
  author?: {
    name?: string
    img?: string
  }
  authorUserId?: string | null
  primaryChapterSlug?: string
  chapterSlugs?: string[]
  chapterSnapshot?: {
    primaryChapterSlug?: string
    chapterSlugs?: string[]
    capturedAt?: Date | string | null
  } | null
  authorSnapshot?: {
    name?: string
    img?: string
    capturedAt?: Date | string | null
  } | null
  pendingPublishRequest?: {
    requestedAt?: Date | string | null
  } | null
  status?: WorkArticleStatus
  publishAt?: Date | string | null
  publishedAt?: Date | string | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  sections?: Article['sections']
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
  seoGeneratedAt?: Date | string | null
  seoModel?: string | null
  seoNeedsReview?: boolean
  editorSettings?: unknown
}

export type ListPublishedWorkArticlesOptions = {
  limit?: number
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeSlug(slug: string) {
  try {
    return decodeURIComponent(slug).trim().toLowerCase()
  } catch {
    return slug.trim().toLowerCase()
  }
}

function normalizeDateField(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  }
  if (typeof value === 'string') {
    return value.trim()
  }
  return ''
}

function normalizeStatus(value: unknown): WorkArticleStatus {
  return value === 'published' ? 'published' : value === 'scheduled' ? 'scheduled' : 'draft'
}

function getDateLabel(row: DatabaseArticle) {
  const explicitDate = clean(row.date)
  if (explicitDate) return explicitDate

  const publishedAt = normalizeDateField(row.publishedAt)
  if (publishedAt) return publishedAt

  const createdAt = normalizeDateField(row.createdAt)
  if (createdAt) return createdAt

  return 'Date TBA'
}

function normalizeTags(row: DatabaseArticle) {
  const tags = Array.isArray(row.tags)
    ? row.tags.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean)
    : []
  const tag = clean(row.tag) || 'Case Study'
  return tags.length > 0 ? tags : [tag]
}

function normalizeContent(row: DatabaseArticle): Article['content'] {
  const rawPlateContent = normalizePlateValue(row.content)
  if (hasContent(rawPlateContent)) {
    const sections = plateToArticleSections(rawPlateContent)
    const hero = isRealImageUrl(clean(row.img)) ? clean(row.img) : extractHeroImageFromPlate(rawPlateContent) || '/images/placeholder.svg'
    const introSource =
      (sections[0] && Array.isArray(sections[0].paragraphs) ? sections[0].paragraphs[0] : '') || clean(row.desc)

    return {
      intro: introSource,
      heroImg: hero,
      sections: sections.map((section, index) => ({
        id: section.id || `section-${index + 1}`,
        title: section.heading || `Section ${index + 1}`,
        body: Array.isArray(section.paragraphs) ? section.paragraphs.join('\n\n') : '',
      })),
    }
  }

  const sections = Array.isArray(row.sections) ? row.sections : []
  const introSource =
    (sections[0] && Array.isArray(sections[0].paragraphs) ? sections[0].paragraphs[0] : '') || clean(row.desc)

  return {
    intro: introSource,
    heroImg: clean(row.img) || '/images/placeholder.svg',
    sections: sections.map((section, index) => ({
      id: section.id || `section-${index + 1}`,
      title: section.heading || `Section ${index + 1}`,
      body: Array.isArray(section.paragraphs) ? section.paragraphs.join('\n\n') : '',
    })),
  }
}

export function mapDbArticleToPublicArticle(row: DatabaseArticle): Article {
  const status = normalizeStatus(row.status)
  const authorSource =
    status === 'published' && row.authorSnapshot
      ? {
          name: row.authorSnapshot.name,
          img: row.authorSnapshot.img,
        }
      : row.author
  const author = normalizeArticleAuthor(authorSource)
  const primaryChapterSlug = normalizeChapterSlug(row.primaryChapterSlug || row.chapterSnapshot?.primaryChapterSlug)
  const chapterSlugs = normalizeChapterSlugs(row.chapterSlugs || row.chapterSnapshot?.chapterSlugs, primaryChapterSlug)

  return {
    slug: normalizeSlug(row.slug),
    title: clean(row.title) || 'Untitled article',
    subtitle: clean(row.subtitle) || undefined,
    desc: clean(row.desc),
    website: clean(row.website) || undefined,
    outcome: clean(row.outcome) || undefined,
    tag: clean(row.tag) || 'Case Study',
    tags: normalizeTags(row),
    img: clean(row.img) || '/images/placeholder.svg',
    imageCaption: clean(row.imageCaption) || undefined,
    date: getDateLabel(row),
    readTime: clean(row.readTime) || '1 min read',
    author,
    authorUserId: clean(row.authorUserId) || null,
    primaryChapterSlug,
    primaryChapterName: getChapterName(primaryChapterSlug),
    chapterSlugs,
    chapterSnapshot: row.chapterSnapshot
      ? {
          primaryChapterSlug: normalizeChapterSlug(row.chapterSnapshot.primaryChapterSlug),
          primaryChapterName: getChapterName(normalizeChapterSlug(row.chapterSnapshot.primaryChapterSlug)),
          chapterSlugs: normalizeChapterSlugs(row.chapterSnapshot.chapterSlugs, row.chapterSnapshot.primaryChapterSlug),
          capturedAt: normalizeDateField(row.chapterSnapshot.capturedAt) || null,
        }
      : null,
    authorProfile: null,
    authorSnapshot: row.authorSnapshot
      ? {
          name: clean(row.authorSnapshot.name) || author.name,
          img: clean(row.authorSnapshot.img) || author.img,
          capturedAt: normalizeDateField(row.authorSnapshot.capturedAt) || null,
        }
      : null,
    status,
    publishAt: normalizeDateField(row.publishAt),
    sections: Array.isArray(row.sections) ? row.sections : [],
    content: normalizeContent(row),
    openGraphTitle: clean(row.openGraphTitle) || undefined,
    openGraphDescription: clean(row.openGraphDescription) || undefined,
    openGraphImage: clean(row.openGraphImage) || undefined,
    twitterTitle: clean(row.twitterTitle) || undefined,
    twitterDescription: clean(row.twitterDescription) || undefined,
    twitterImage: clean(row.twitterImage) || undefined,
    seoTitle: clean(row.seoTitle) || null,
    seoDescription: clean(row.seoDescription) || null,
    seoSource: row.seoSource ?? null,
    seoGeneratedAt: normalizeDateField(row.seoGeneratedAt) || null,
    seoModel: clean(row.seoModel) || null,
    seoNeedsReview: row.seoNeedsReview ?? false,
    editorSettings: normalizeWorkEditorDocumentSettings(row.editorSettings),
  }
}

function createPublishedFilter() {
  return {
    $or: [
      { status: 'published' as const },
      { status: { $exists: false }, publishedAt: { $ne: null } },
    ],
  }
}

function mergeWithFixtures(articles: Article[]) {
  const bySlug = new Map<string, Article>()

  for (const article of articles) {
    bySlug.set(article.slug, article)
  }

  for (const fixture of WORK_FIXTURES) {
    if (!bySlug.has(fixture.slug)) {
      bySlug.set(fixture.slug, fixture)
    }
  }

  return Array.from(bySlug.values()).filter(
    (article) =>
      !shouldExcludeFromWorkListings({
        slug: article.slug,
        title: article.title,
      }),
  )
}

async function listDatabaseArticles(filter: Record<string, unknown>) {
  const conn = await connectDB()
  if (!conn) return []

  return (await WorkArticle.find(filter)
    .sort({ publishedAt: -1, createdAt: -1, updatedAt: -1 })
    .lean()
    .exec()) as unknown as DatabaseArticle[]
}

export async function listPublishedWorkArticles(options: ListPublishedWorkArticlesOptions = {}) {
  await connection()
  const rows = await listDatabaseArticles(createPublishedFilter())
  const articles = mergeWithFixtures(rows.map((row) => mapDbArticleToPublicArticle(row)))
  if (typeof options.limit === 'number' && options.limit > 0) {
    return articles.slice(0, Math.floor(options.limit))
  }
  return articles
}

export async function listLatestPublishedWorkArticles(limit = 4): Promise<Article[]> {
  return listPublishedWorkArticles({ limit })
}

export function deriveWorkTags(articles: Article[]) {
  const tags = new Set<string>()
  for (const article of articles) {
    const tag = clean(article.tag)
    if (tag) tags.add(tag)
  }
  return ['All', ...Array.from(tags)]
}

export async function getPublishedWorkArticleBySlug(slug: string) {
  const normalized = normalizeSlug(slug)
  const conn = await connectDB()
  if (!conn) {
    return getWorkFixtureBySlug(normalized)
  }

  const row = (await WorkArticle.findOne({
    slug: normalized,
    ...createPublishedFilter(),
  })
    .lean()
    .exec()) as unknown as DatabaseArticle | null

  return row ? mapDbArticleToPublicArticle(row) : getWorkFixtureBySlug(normalized)
}

export async function getPublishedWorkArticles() {
  return listPublishedWorkArticles()
}

export async function getWorkArticleBySlug(slug: string) {
  const normalized = normalizeSlug(slug)
  const conn = await connectDB()
  if (!conn) {
    return getWorkFixtureBySlug(normalized)
  }

  const row = (await WorkArticle.findOne({ slug: normalized }).lean().exec()) as unknown as DatabaseArticle | null
  return row ? mapDbArticleToPublicArticle(row) : getWorkFixtureBySlug(normalized)
}

function toListRow(article: Article, updatedAt?: string | null, pendingPublishRequestedAt?: string | null): WorkArticleListRow {
  return {
    slug: article.slug,
    title: article.title,
    tag: article.tag,
    primaryChapterName: article.primaryChapterName || '',
    date: article.date,
    authorName: article.author.name,
    status: article.status || 'draft',
    pendingPublishRequestedAt: pendingPublishRequestedAt || null,
    updatedAt: updatedAt || null,
  }
}

export async function getWorkArticlesForEdit(): Promise<WorkArticleListRow[]> {
  const conn = await connectDB()
  if (!conn) {
    return WORK_FIXTURES.map((article) => toListRow(article, null, null))
  }

  const rows = (await WorkArticle.find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean()
    .exec()) as unknown as DatabaseArticle[]

  const items = new Map<string, WorkArticleListRow>()

  for (const row of rows) {
    const article = mapDbArticleToPublicArticle(row)
    items.set(
      article.slug,
      toListRow(
        article,
        normalizeDateField(row.updatedAt) || normalizeDateField(row.createdAt) || null,
        normalizeDateField(row.pendingPublishRequest?.requestedAt) || null,
      ),
    )
  }

  for (const fixture of WORK_FIXTURES) {
    if (!items.has(fixture.slug)) {
      items.set(fixture.slug, toListRow(fixture, null, null))
    }
  }

  return Array.from(items.values()).filter(
    (row) =>
      !shouldExcludeFromWorkListings({
        slug: row.slug,
        title: row.title,
      }),
  )
}
