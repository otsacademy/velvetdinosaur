import { assertServerOnly } from '@/lib/_server/guard'
import type { Article, PublicNewsCard } from '@/lib/articles'
import { getChapterName, normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { connectDB } from '@/lib/db'
import { sanitizePublicInlineMedia } from '@/lib/inline-media'
import { normalizeArticleAuthor } from '@/lib/news-presentation'
import { profileMatchesArticleByline } from '@/lib/news-author-profile'
import { normalizeNewsEditorDocumentSettings } from '@/lib/news-editor-document-settings'
import { shouldExcludeFromNewsListings } from '@/lib/news-listing-filters'
import { NewsArticle } from '@/models/NewsArticle'
import { UserProfile } from '@/models/UserProfile'
import {
  extractHeroImageFromPlate,
  isRealImageUrl,
  hasContent,
  normalizePlateValue,
  plateToArticleSections,
} from '@/lib/news-plate-transform'
import { cleanString, optionalString } from '@/lib/string-sanitizer'
assertServerOnly('lib/news-articles.server.ts')
export type NewsArticleListRow = {
  slug: string
  title: string
  tag: string
  primaryChapterName: string
  date: string
  authorName: string
  status: NewsArticleStatus
  pendingPublishRequestedAt: string | null
  updatedAt: string | null
}
type NewsArticleStatus = 'draft' | 'scheduled' | 'published'
type DatabaseArticle = {
  slug: string
  title: string
  desc: string
  imageCaption?: string
  tag?: string
  tags?: string[]
  img?: string
  date?: string
  readTime?: string
  status?: NewsArticleStatus
  publishAt?: Date | string | null
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
  }
  pendingPublishRequest?: {
    requestedAt?: Date | string | null
  } | null
  openGraphTitle?: string
  openGraphDescription?: string
  openGraphImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  seoTitle?: string
  seoDescription?: string
  seoSource?: 'manual' | 'auto' | null
  seoGeneratedAt?: Date | string | null
  seoModel?: string
  seoNeedsReview?: boolean
  editorSettings?: unknown
  sections?: Article['sections']
  content?: unknown
  publishedAt?: Date | string | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
}
type AuthorProfileRow = {
  userId?: string
  displayName?: string
  firstName?: string
  lastName?: string
  academicTitle?: string
  primaryChapterSlug?: string
  chapterSlugs?: string[]
  institution?: string
  department?: string
  country?: string
  location?: string
  bio?: string
  orcidId?: string
  orcidUrl?: string
  scholarId?: string
  scholarUrl?: string
}
export type NewsSitemapEntry = {
  slug: string
  publishedAt: string | null
  updatedAt: string | null
  createdAt: string | null
}
export type ListPublishedNewsArticlesOptions = {
  limit?: number
}

export type ListPublicNewsCardsOptions = ListPublishedNewsArticlesOptions & {
  publishedAfter?: Date
  publishedBefore?: Date
  tagValues?: string[]
}

export type CountPublicNewsCardsOptions = Omit<ListPublicNewsCardsOptions, 'limit'>

export type ListPublicNewsTagValuesOptions = CountPublicNewsCardsOptions & {
  limit?: number
}
export const PUBLIC_NEWS_CARD_SELECT = {
  slug: 1,
  title: 1,
  desc: 1,
  imageCaption: 1,
  tag: 1,
  tags: 1,
  img: 1,
  date: 1,
  readTime: 1,
  status: 1,
  publishAt: 1,
  author: 1,
  authorUserId: 1,
  primaryChapterSlug: 1,
  chapterSlugs: 1,
  chapterSnapshot: 1,
  authorSnapshot: 1,
  openGraphTitle: 1,
  openGraphDescription: 1,
  openGraphImage: 1,
  twitterTitle: 1,
  twitterDescription: 1,
  twitterImage: 1,
  publishedAt: 1,
  createdAt: 1,
  updatedAt: 1,
} as const
function clean(value: unknown) {
  return cleanString(value)
}
function normalizeArticleContent(row: DatabaseArticle): Article['content'] {
  const raw = row.content
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const candidate = raw as {
      intro?: unknown
      heroImg?: unknown
      sections?: unknown
    }
    if (typeof candidate.intro === 'string' && typeof candidate.heroImg === 'string' && Array.isArray(candidate.sections)) {
      return {
        intro: clean(candidate.intro),
        heroImg: clean(candidate.heroImg) || '/images/placeholder.svg',
        sections: candidate.sections
          .map((section) => {
            if (!section || typeof section !== 'object') return null
            const current = section as { id?: unknown; title?: unknown; body?: unknown }
            if (typeof current.id !== 'string' || typeof current.title !== 'string' || typeof current.body !== 'string') {
              return null
            }
            const id = clean(current.id)
            return {
              id: id || 'section',
              title: clean(current.title) || 'Section',
              body: clean(current.body),
            }
          })
          .filter(Boolean) as Article['content']['sections']
      }
    }
  }
  const sections = Array.isArray(row.sections) ? row.sections : ([] as NonNullable<Article['sections']>)
  const firstParagraph =
    (sections[0] && Array.isArray(sections[0].paragraphs) && clean(sections[0].paragraphs[0])) || clean(row.desc) || ''
  return {
    intro: firstParagraph,
    heroImg: clean(row.img) || '/images/placeholder.svg',
    sections: sections.map((section, index) => ({
      id: clean(section.id) || `section-${index + 1}`,
      title: clean(section.heading) || `Section ${index + 1}`,
      body: Array.isArray(section.paragraphs) ? section.paragraphs.map((paragraph) => clean(paragraph)).filter(Boolean).join('\n\n') : ''
    }))
  }
}
function normalizeSlug(slug: string) {
  try {
    return clean(decodeURIComponent(slug)).toLowerCase()
  } catch {
    return clean(slug).toLowerCase()
  }
}
function getDateLabel(row: DatabaseArticle) {
  const explicitDate = clean(row.date)
  if (explicitDate) return explicitDate
  if (typeof row.publishedAt === 'string') {
    const trimmed = clean(row.publishedAt)
    if (trimmed) return trimmed
  }
  if (typeof row.createdAt === 'string') {
    const trimmed = clean(row.createdAt)
    if (trimmed) return trimmed
  }
  return 'Date TBA'
}
function normalizePublishedStatus(value: unknown): NewsArticleStatus {
  return value === 'published' ? 'published' : value === 'scheduled' ? 'scheduled' : 'draft'
}
function normalizeDateField(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  }
  if (typeof value === 'string') {
    const trimmed = clean(value)
    return trimmed
  }
  return ''
}
function mapAuthorProfileRow(row: AuthorProfileRow) {
  const userId = clean(row.userId)
  if (!userId) return null
  const orcidId = clean(row.orcidId)
  const rawOrcidUrl = clean(row.orcidUrl)
  const scholarId = clean(row.scholarId)
  const primaryChapterSlug = normalizeChapterSlug(row.primaryChapterSlug)
  const country = clean(row.country) || clean(row.location)
  const location = clean(row.location) || country
  const orcidUrl = rawOrcidUrl || (orcidId ? `https://orcid.org/${orcidId}` : '')
  const scholarUrl = clean(row.scholarUrl) || (scholarId ? `https://scholar.google.com/citations?user=${encodeURIComponent(scholarId)}` : '')
  return {
    userId,
    displayName: clean(row.displayName),
    firstName: clean(row.firstName),
    lastName: clean(row.lastName),
    academicTitle: clean(row.academicTitle),
    primaryChapterSlug,
    primaryChapterName: getChapterName(primaryChapterSlug),
    chapterSlugs: normalizeChapterSlugs(row.chapterSlugs, primaryChapterSlug),
    institution: clean(row.institution),
    department: clean(row.department),
    country,
    location,
    bio: clean(row.bio),
    orcidId,
    orcidUrl,
    scholarUrl
  } as NonNullable<Article['authorProfile']>
}
async function getAuthorProfileLookup(rows: DatabaseArticle[]) {
  const userIds = Array.from(
    new Set(
      rows
        .map((row) => clean(row.authorUserId))
        .filter(Boolean)
    )
  )
  const profilesByUserId = new Map<string, NonNullable<Article['authorProfile']>>()
  if (userIds.length === 0) return profilesByUserId
  const profileRows = (await UserProfile.find({ userId: { $in: userIds } })
    .select({
      userId: 1,
      displayName: 1,
      firstName: 1,
      lastName: 1,
      academicTitle: 1,
      primaryChapterSlug: 1,
      chapterSlugs: 1,
      institution: 1,
      department: 1,
      country: 1,
      location: 1,
      bio: 1,
      orcidId: 1,
      orcidUrl: 1,
      scholarId: 1,
      scholarUrl: 1
    })
    .lean()) as unknown as AuthorProfileRow[]
  for (const row of profileRows) {
    const normalized = mapAuthorProfileRow(row)
    if (!normalized) continue
    profilesByUserId.set(normalized.userId, normalized)
  }
  return profilesByUserId
}
export function mapDbArticleToPublicArticle(
  row: DatabaseArticle,
  authorProfilesByUserId?: Map<string, NonNullable<Article['authorProfile']>>
): Article {
  row = sanitizePublicInlineMedia(row, {
    label: `news:${clean(row.slug) || 'unknown'}`,
  }).value
  const normalizedContent = normalizeArticleContent(row)
  const rawPlateContent = normalizePlateValue(row.content)
  const sourceSections = Array.isArray(row.sections) ? row.sections : []
  const hasPlateContent = hasContent(rawPlateContent)
  const derivedSections = hasPlateContent ? plateToArticleSections(rawPlateContent) : sourceSections
  const sourceHero = clean(row.img)
  const inferredHero = hasPlateContent ? extractHeroImageFromPlate(rawPlateContent) : null
  const resolvedHero = isRealImageUrl(sourceHero) ? sourceHero : inferredHero
  const publicContent = hasPlateContent ? rawPlateContent : normalizedContent
  const normalizedStatus = normalizePublishedStatus(row.status)
  const normalizedTags = Array.isArray(row.tags)
    ? row.tags
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => clean(entry))
        .filter(Boolean)
    : []
  const authorSource =
    normalizedStatus === 'published' && row.authorSnapshot
      ? {
          name: row.authorSnapshot.name,
          img: row.authorSnapshot.img
        }
      : row.author
  const normalizedAuthor = normalizeArticleAuthor(authorSource)
  const normalizedSnapshot = row.authorSnapshot ? normalizeArticleAuthor(row.authorSnapshot) : null
  const normalizedAuthorUserId =
    clean(row.authorUserId) || null
  const linkedAuthorProfile =
    normalizedAuthorUserId && authorProfilesByUserId
      ? authorProfilesByUserId.get(normalizedAuthorUserId) || null
      : null
  const resolvedAuthorProfile = profileMatchesArticleByline(normalizedAuthor.name, linkedAuthorProfile)
    ? linkedAuthorProfile
    : null
  const livePrimaryChapterSlug = normalizeChapterSlug(row.primaryChapterSlug)
  const liveChapterSlugs = normalizeChapterSlugs(row.chapterSlugs, livePrimaryChapterSlug)
  const snapshotPrimaryChapterSlug = normalizeChapterSlug(row.chapterSnapshot?.primaryChapterSlug)
  const snapshotChapterSlugs = normalizeChapterSlugs(row.chapterSnapshot?.chapterSlugs, snapshotPrimaryChapterSlug)
  const resolvedPrimaryChapterSlug =
    normalizedStatus === 'published' && snapshotPrimaryChapterSlug ? snapshotPrimaryChapterSlug : livePrimaryChapterSlug
  const resolvedChapterSlugs =
    normalizedStatus === 'published' && snapshotPrimaryChapterSlug ? snapshotChapterSlugs : liveChapterSlugs
  const resolvedChapterName = getChapterName(resolvedPrimaryChapterSlug)
  const tag = clean(row.tag) || 'Announcements'
  const openGraphTitle = optionalString(row.openGraphTitle)
  const openGraphDescription = optionalString(row.openGraphDescription)
  const openGraphImage = optionalString(row.openGraphImage)
  const twitterTitle = optionalString(row.twitterTitle)
  const twitterDescription = optionalString(row.twitterDescription)
  const twitterImage = optionalString(row.twitterImage)
  const imageCaption = optionalString(row.imageCaption)
  const seoTitle = optionalString(row.seoTitle)
  const seoDescription = optionalString(row.seoDescription)
  const seoModel = optionalString(row.seoModel)
  const article: Article = {
    slug: normalizeSlug(row.slug),
    title: clean(row.title) || 'Untitled article',
    desc: clean(row.desc),
    status: normalizedStatus,
    publishAt: normalizeDateField(row.publishAt),
    tag,
    tags: normalizedTags.length > 0 ? normalizedTags : [tag],
    img: resolvedHero || '/images/placeholder.svg',
    date: getDateLabel(row),
    readTime: clean(row.readTime) || '1 min read',
    author: normalizedAuthor,
    authorUserId: normalizedAuthorUserId,
    primaryChapterSlug: resolvedPrimaryChapterSlug,
    primaryChapterName: resolvedChapterName,
    chapterSlugs: resolvedChapterSlugs,
    chapterSnapshot: row.chapterSnapshot
      ? {
          primaryChapterSlug: snapshotPrimaryChapterSlug,
          primaryChapterName: getChapterName(snapshotPrimaryChapterSlug),
          chapterSlugs: snapshotChapterSlugs,
          capturedAt:
            row.chapterSnapshot.capturedAt instanceof Date
              ? row.chapterSnapshot.capturedAt.toISOString()
              : typeof row.chapterSnapshot.capturedAt === 'string'
                ? row.chapterSnapshot.capturedAt
                : null
        }
      : null,
    authorProfile: resolvedAuthorProfile,
    authorSnapshot: row.authorSnapshot
      ? {
          name: normalizedSnapshot?.name || normalizedAuthor.name,
          img: normalizedSnapshot?.img || normalizedAuthor.img,
          capturedAt:
            row.authorSnapshot.capturedAt instanceof Date
              ? row.authorSnapshot.capturedAt.toISOString()
              : typeof row.authorSnapshot.capturedAt === 'string'
                ? row.authorSnapshot.capturedAt
                : null
        }
      : null,
    sections: derivedSections,
    content: publicContent as Article['content'],
    seoSource: row.seoSource ?? null,
    seoGeneratedAt:
      row.seoGeneratedAt instanceof Date
        ? row.seoGeneratedAt.toISOString()
        : typeof row.seoGeneratedAt === 'string'
          ? row.seoGeneratedAt
          : null,
    seoNeedsReview: row.seoNeedsReview ?? false,
    editorSettings: normalizeNewsEditorDocumentSettings(row.editorSettings),
  }
  if (imageCaption) article.imageCaption = imageCaption
  if (openGraphTitle) article.openGraphTitle = openGraphTitle
  if (openGraphDescription) article.openGraphDescription = openGraphDescription
  if (openGraphImage) article.openGraphImage = openGraphImage
  if (twitterTitle) article.twitterTitle = twitterTitle
  if (twitterDescription) article.twitterDescription = twitterDescription
  if (twitterImage) article.twitterImage = twitterImage
  if (seoTitle) article.seoTitle = seoTitle
  if (seoDescription) article.seoDescription = seoDescription
  if (seoModel) article.seoModel = seoModel
  return article
}
export function mapDbArticleToPublicNewsCard(
  row: DatabaseArticle,
  authorProfilesByUserId?: Map<string, NonNullable<Article['authorProfile']>>
): PublicNewsCard {
  const article = mapDbArticleToPublicArticle(row, authorProfilesByUserId)
  return {
    slug: article.slug,
    title: article.title,
    desc: article.desc,
    status: article.status,
    publishAt: article.publishAt,
    imageCaption: article.imageCaption,
    tag: article.tag,
    tags: article.tags,
    img: article.img,
    date: article.date,
    readTime: article.readTime,
    author: article.author,
    authorUserId: article.authorUserId,
    primaryChapterSlug: article.primaryChapterSlug,
    primaryChapterName: article.primaryChapterName,
    chapterSlugs: article.chapterSlugs,
    chapterSnapshot: article.chapterSnapshot,
    authorProfile: article.authorProfile,
    authorSnapshot: article.authorSnapshot,
    openGraphTitle: article.openGraphTitle,
    openGraphDescription: article.openGraphDescription,
    openGraphImage: article.openGraphImage,
    twitterTitle: article.twitterTitle,
    twitterDescription: article.twitterDescription,
    twitterImage: article.twitterImage,
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function createDateRangeFilter(field: 'publishedAt' | 'createdAt', options: CountPublicNewsCardsOptions) {
  const range: Record<string, Date> = {}
  if (options.publishedAfter instanceof Date && !Number.isNaN(options.publishedAfter.getTime())) {
    range.$gte = options.publishedAfter
  }
  if (options.publishedBefore instanceof Date && !Number.isNaN(options.publishedBefore.getTime())) {
    range.$lt = options.publishedBefore
  }
  return Object.keys(range).length > 0 ? { [field]: range } : null
}

function createPublicNewsDateFilter(options: CountPublicNewsCardsOptions) {
  const publishedAtRange = createDateRangeFilter('publishedAt', options)
  if (!publishedAtRange) return null
  const createdAtRange = createDateRangeFilter('createdAt', options)
  if (!createdAtRange) return null

  return {
    $or: [
      publishedAtRange,
      {
        $and: [
          { $or: [{ publishedAt: null }, { publishedAt: { $exists: false } }] },
          createdAtRange,
        ],
      },
    ],
  }
}

function createPublicNewsTagFilter(tagValues?: string[]) {
  const cleaned = Array.from(
    new Set(
      (tagValues || [])
        .map((value) => clean(value))
        .filter(Boolean)
    )
  )
  if (cleaned.length === 0) return null

  const exactOrCaseInsensitive = cleaned.flatMap((value) => [value, new RegExp(`^${escapeRegExp(value)}$`, 'i')])
  return {
    $or: [
      { tag: { $in: exactOrCaseInsensitive } },
      { tags: { $in: exactOrCaseInsensitive } },
    ],
  }
}

function createPublicNewsCardsFilter(options: CountPublicNewsCardsOptions = {}) {
  const filters: Record<string, unknown>[] = [createPublishedFilter()]
  const dateFilter = createPublicNewsDateFilter(options)
  const tagFilter = createPublicNewsTagFilter(options.tagValues)
  if (dateFilter) filters.push(dateFilter)
  if (tagFilter) filters.push(tagFilter)
  return filters.length === 1 ? filters[0] : { $and: filters }
}

function normalizeQueryLimit(limit?: number) {
  return typeof limit === 'number' && Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0
}

async function listPublishedNewsArticlesUncached(options: ListPublishedNewsArticlesOptions = {}) {
  const conn = await connectDB()
  if (!conn) return []
  const query = NewsArticle.find(createPublishedFilter())
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean()
  if (typeof options.limit === 'number' && options.limit > 0) {
    query.limit(Math.floor(options.limit))
  }
  const rows = (await query.exec()) as unknown as DatabaseArticle[]
  const authorProfilesByUserId = await getAuthorProfileLookup(rows)
  return rows
    .map((row) => mapDbArticleToPublicArticle(row, authorProfilesByUserId))
    .filter((article) =>
      !shouldExcludeFromNewsListings({
        slug: article.slug,
        title: article.title,
      })
    )
}
export async function listPublishedNewsArticles(options: ListPublishedNewsArticlesOptions = {}) {
  return listPublishedNewsArticlesUncached(options)
}
async function listPublicNewsCardsUncached(options: ListPublicNewsCardsOptions = {}): Promise<PublicNewsCard[]> {
  const conn = await connectDB()
  if (!conn) return []
  const query = NewsArticle.find(createPublicNewsCardsFilter(options))
    .select(PUBLIC_NEWS_CARD_SELECT)
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean()
  const limit = normalizeQueryLimit(options.limit)
  if (limit > 0) {
    query.limit(limit)
  }
  const rows = (await query.exec()) as unknown as DatabaseArticle[]
  const authorProfilesByUserId = await getAuthorProfileLookup(rows)
  return rows
    .map((row) => mapDbArticleToPublicNewsCard(row, authorProfilesByUserId))
    .filter((article) =>
      !shouldExcludeFromNewsListings({
        slug: article.slug,
        title: article.title,
      })
    )
}
export async function listPublicNewsCards(options: ListPublicNewsCardsOptions = {}) {
  return listPublicNewsCardsUncached(options)
}
export async function countPublicNewsCards(options: CountPublicNewsCardsOptions = {}) {
  const conn = await connectDB()
  if (!conn) return 0
  return NewsArticle.countDocuments(createPublicNewsCardsFilter(options)).exec()
}
export async function listPublicNewsTagValues(options: ListPublicNewsTagValuesOptions = {}) {
  const conn = await connectDB()
  if (!conn) return []
  const query = NewsArticle.find(createPublicNewsCardsFilter(options))
    .select({
      slug: 1,
      title: 1,
      tag: 1,
      tags: 1,
    })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean()
  const limit = normalizeQueryLimit(options.limit)
  if (limit > 0) {
    query.limit(limit)
  }
  const rows = (await query.exec()) as unknown as Pick<DatabaseArticle, 'slug' | 'title' | 'tag' | 'tags'>[]
  const values: string[] = []
  for (const row of rows) {
    if (
      shouldExcludeFromNewsListings({
        slug: row.slug,
        title: row.title,
      })
    ) {
      continue
    }
    const primary = clean(row.tag)
    if (primary) values.push(primary)
    if (Array.isArray(row.tags)) {
      for (const tag of row.tags) {
        const normalized = clean(tag)
        if (normalized) values.push(normalized)
      }
    }
  }
  return values
}
export async function listPublishedNewsSitemapEntries(limit = 1000): Promise<NewsSitemapEntry[]> {
  const conn = await connectDB()
  if (!conn) return []
  const rows = (await NewsArticle.find(createPublishedFilter())
    .select({
      slug: 1,
      publishedAt: 1,
      updatedAt: 1,
      createdAt: 1
    })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(Math.max(1, Math.floor(limit)))
    .lean()
    .exec()) as unknown as Pick<DatabaseArticle, 'slug' | 'publishedAt' | 'updatedAt' | 'createdAt'>[]
  return rows
    .map((row) => ({
      slug: normalizeSlug(row.slug || ''),
      publishedAt: normalizeDateField(row.publishedAt) || null,
      updatedAt: normalizeDateField(row.updatedAt) || null,
      createdAt: normalizeDateField(row.createdAt) || null
    }))
    .filter((entry) => entry.slug.length > 0)
}
export async function listLatestPublishedNewsArticles(limit = 4): Promise<Article[]> { return listPublishedNewsArticles({ limit }) }
export async function listLatestPublicNewsCards(limit = 4): Promise<PublicNewsCard[]> { return listPublicNewsCards({ limit }) }
export function deriveNewsTags(articles: Article[]) {
  const tags = new Set<string>()
  for (const article of articles) {
    const tag = article.tag?.trim()
    if (tag) tags.add(tag)
  }
  return ['All', ...Array.from(tags)]
}
async function getPublishedNewsArticleBySlugUncached(slug: string) {
  const normalized = normalizeSlug(slug)
  const connection = await connectDB()
  if (!connection) return null
  const row = (await NewsArticle.findOne({
    slug: normalized,
    ...createPublishedFilter(),
  })
    .lean()
    .exec()) as unknown as DatabaseArticle | null
  if (!row) return null
  const authorProfilesByUserId = await getAuthorProfileLookup([row])
  return mapDbArticleToPublicArticle(row, authorProfilesByUserId)
}
export async function getPublishedNewsArticleBySlug(slug: string) {
  return getPublishedNewsArticleBySlugUncached(slug)
}
export async function getPublishedNewsArticles() {
  return listPublishedNewsArticles()
}
export async function getNewsArticleBySlug(slug: string) {
  const normalized = normalizeSlug(slug)
  const connection = await connectDB()
  if (!connection) return null
  const row = (await NewsArticle.findOne({ slug: normalized }).lean().exec()) as unknown as DatabaseArticle | null
  if (!row) return null
  const authorProfilesByUserId = await getAuthorProfileLookup([row])
  return mapDbArticleToPublicArticle(row, authorProfilesByUserId)
}
export async function getNewsArticlesForEdit(): Promise<NewsArticleListRow[]> {
  const connection = await connectDB()
  if (!connection) return []
  const rows = (await NewsArticle.find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean()
    .exec()) as unknown as DatabaseArticle[]
  return rows
    .map((row) => {
      const article = mapDbArticleToPublicArticle(row)
      const pendingRequestedAt =
        row.pendingPublishRequest?.requestedAt instanceof Date
          ? row.pendingPublishRequest.requestedAt.toISOString()
          : typeof row.pendingPublishRequest?.requestedAt === 'string'
            ? row.pendingPublishRequest.requestedAt
            : null
      return {
        slug: article.slug,
        title: article.title,
        tag: article.tag,
        primaryChapterName: article.primaryChapterName || '',
        date: article.date,
        authorName: article.author.name,
        status: article.status || 'draft',
        pendingPublishRequestedAt: pendingRequestedAt,
        updatedAt: normalizeDateField(row.updatedAt) || normalizeDateField(row.createdAt) || null
      }
    })
    .filter(
      (row) =>
        !shouldExcludeFromNewsListings({
          slug: row.slug,
          title: row.title,
        })
    )
}
