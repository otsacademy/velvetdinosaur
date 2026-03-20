import { assertServerOnly } from '@/lib/_server/guard'
import type { Article } from '@/lib/articles'
import { createArticleExcerpt } from '@/lib/work-presentation'
import { listPublishedWorkArticles } from '@/lib/work-articles.server'
import { shouldExcludeFromWorkListings } from '@/lib/work-listing-filters'

assertServerOnly('lib/work-feed.server.ts')

type PublicWorkOptions = {
  yearsBack?: number
  limit?: number
}

const DEFAULT_YEARS_BACK = 2
const DEFAULT_FEED_LIMIT = 30

const TAG_ALIASES = new Map<string, string>([
  ['awards', 'Awards'],
  ['award', 'Awards'],
  ['work and updates', 'Case Study'],
  ['announcements', 'Case Study'],
  ['activities', 'Events'],
  ['activity', 'Events'],
  ['events', 'Events'],
  ['initiatives and programs', 'Programs'],
  ['initiatives & programs', 'Programs'],
  ['get involved', 'Calls'],
  ['openings', 'Calls'],
  ['calls', 'Calls'],
  ['impact interviews', 'Impact Interviews'],
  ['publications', 'Publications'],
  ['blog', 'Blog'],
  ['chapters', 'Chapters'],
])

const GENERIC_DESCRIPTIONS = new Set([
  'no description available',
  'no description available.',
  'article body is empty',
  'article body is empty.',
  'event',
  'thank you for visiting the asap website.',
])

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function unescapeContentText(value: string) {
  return clean(
    value
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\u2018/gi, '‘')
      .replace(/\\u2019/gi, '’')
      .replace(/\\u201c/gi, '“')
      .replace(/\\u201d/gi, '”'),
  )
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : part))
    .join(' ')
}

function normalizeTag(tag: string) {
  const cleaned = clean(tag)
  if (!cleaned) return 'Case Study'
  const alias = TAG_ALIASES.get(cleaned.toLowerCase())
  if (alias) return alias
  return toTitleCase(cleaned)
}

function isMeaningfulDescription(value: string) {
  const cleaned = clean(value).toLowerCase()
  if (!cleaned) return false
  if (GENERIC_DESCRIPTIONS.has(cleaned)) return false
  return cleaned.length >= 18
}

function deriveDescription(article: Article) {
  if (isMeaningfulDescription(article.desc)) {
    return createArticleExcerpt(unescapeContentText(article.desc), { maxChars: 220, preferSentence: true })
  }

  const sectionParagraph =
    Array.isArray(article.sections) && article.sections.length > 0 && Array.isArray(article.sections[0].paragraphs)
      ? article.sections[0].paragraphs.find((paragraph) => clean(paragraph).length > 0) || ''
      : ''
  const intro = typeof article.content?.intro === 'string' ? article.content.intro : ''
  const fallbackSource =
    [sectionParagraph, intro].find((candidate) => isMeaningfulDescription(candidate)) || article.title
  const fallback = clean(fallbackSource) || article.title
  return createArticleExcerpt(unescapeContentText(fallback), { maxChars: 220, preferSentence: true })
}

function normalizeForFeed(article: Article): Article {
  const normalizedTag = normalizeTag(article.tag || 'Case Study')
  const normalizedTags = Array.isArray(article.tags)
    ? Array.from(new Set(article.tags.map((entry) => normalizeTag(entry)).filter(Boolean)))
    : [normalizedTag]

  return {
    ...article,
    title: unescapeContentText(article.title),
    desc: deriveDescription(article),
    tag: normalizedTag,
    tags: normalizedTags.length > 0 ? normalizedTags : [normalizedTag],
  }
}

function canonicalTitleKey(title: string) {
  return unescapeContentText(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function parseArticleDate(raw: string) {
  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct

  const withoutPrefix = raw.replace(/^posted on\s+/i, '')
  const fallback = new Date(withoutPrefix)
  if (!Number.isNaN(fallback.getTime())) return fallback
  return null
}

function shouldExcludeFromWorkFeed(article: Article) {
  return shouldExcludeFromWorkListings({
    slug: article.slug,
    title: article.title,
  })
}

function dedupeAndNormalize(articles: Article[]) {
  const seen = new Set<string>()
  const output: Article[] = []

  for (const source of articles) {
    const article = normalizeForFeed(source)
    if (shouldExcludeFromWorkFeed(article)) continue

    const key = canonicalTitleKey(article.title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(article)
  }

  return output
}

function splitFeedAndArchive(articles: Article[], yearsBack: number) {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - yearsBack)

  const feed: Article[] = []
  const archive: Article[] = []

  for (const article of articles) {
    const parsedDate = parseArticleDate(article.date)
    if (parsedDate && parsedDate < cutoff) {
      archive.push(article)
      continue
    }
    feed.push(article)
  }

  return { feed, archive }
}

async function getPublicCollections(options: PublicWorkOptions = {}) {
  const yearsBack =
    typeof options.yearsBack === 'number' && options.yearsBack > 0 ? Math.floor(options.yearsBack) : DEFAULT_YEARS_BACK
  const normalized = dedupeAndNormalize(await listPublishedWorkArticles())
  return splitFeedAndArchive(normalized, yearsBack)
}

export async function listPublicWorkFeed(options: PublicWorkOptions = {}) {
  const { feed } = await getPublicCollections(options)
  const limit = typeof options.limit === 'number' && options.limit > 0 ? Math.floor(options.limit) : DEFAULT_FEED_LIMIT
  return feed.slice(0, limit)
}

export async function listPublicWorkArchive(options: PublicWorkOptions = {}) {
  const { archive } = await getPublicCollections(options)
  const limit = typeof options.limit === 'number' && options.limit > 0 ? Math.floor(options.limit) : 0
  return limit > 0 ? archive.slice(0, limit) : archive
}

export async function getPublicWorkArchiveCount(yearsBack = DEFAULT_YEARS_BACK) {
  const { archive } = await getPublicCollections({ yearsBack })
  return archive.length
}
