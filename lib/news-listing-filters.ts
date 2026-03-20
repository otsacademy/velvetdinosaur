export type NewsListingCandidate = {
  slug?: string | null
  title?: string | null
}

const NON_NEWS_SLUGS = new Set([
  'climate-change',
  'get-involved',
  'asap-journal',
  'institutional-reform',
  'linking-academics-and-researchers',
  'awards',
  'education',
  'global-health',
  'agape',
  'gdpr-consent-data-protection-agreement',
  'asap-gdpr-consent-data-protection-agreement',
])

const NON_NEWS_TITLE_KEYS = new Set([
  'climate change',
  'get involved',
  'asap journal',
  'institutional reform',
  'linking academics and researchers',
  'awards',
  'education',
  'global health',
  'agape',
  'gdpr consent data protection agreement',
  'asap gdpr consent data protection agreement',
])

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeSlug(rawSlug: string) {
  let slug = clean(rawSlug).toLowerCase()
  if (!slug) return ''

  try {
    slug = decodeURIComponent(slug)
  } catch {
    // Keep original when decode fails.
  }

  slug = slug
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
  return slug
}

function canonicalTitleKey(title: string) {
  return clean(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matchesExcludedSlug(rawSlug: string) {
  const normalized = normalizeSlug(rawSlug)
  if (!normalized) return false
  if (NON_NEWS_SLUGS.has(normalized)) return true

  const withoutNewsPrefix = normalized.replace(/^news\//, '')
  if (NON_NEWS_SLUGS.has(withoutNewsPrefix)) return true

  const leaf = withoutNewsPrefix.split('/').filter(Boolean).at(-1) || ''
  return NON_NEWS_SLUGS.has(leaf)
}

export function shouldExcludeFromNewsListings(candidate: NewsListingCandidate) {
  const slug = clean(candidate.slug)
  if (slug && matchesExcludedSlug(slug)) return true

  const titleKey = canonicalTitleKey(clean(candidate.title))
  if (!titleKey) return false
  return NON_NEWS_TITLE_KEYS.has(titleKey)
}
