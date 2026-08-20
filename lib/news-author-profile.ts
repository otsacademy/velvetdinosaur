import type { ArticleAuthorProfile } from '@/lib/articles'

const LEADING_TITLES = new Set([
  'mr',
  'mrs',
  'ms',
  'miss',
  'mx',
  'dr',
  'prof',
  'professor',
  'sir',
  'dame',
])

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeComparableName(value: string) {
  const normalized = clean(value)
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  if (!normalized) return ''

  const words = normalized.split(' ').filter(Boolean)
  while (words.length > 1 && LEADING_TITLES.has(words[0])) {
    words.shift()
  }

  return words.join(' ')
}

export function profileMatchesArticleByline(name: string, profile?: ArticleAuthorProfile | null) {
  const byline = normalizeComparableName(name)
  if (!byline || !profile) return false

  const firstLast = `${clean(profile.firstName)} ${clean(profile.lastName)}`.replace(/\s+/g, ' ').trim()
  const titledFirstLast = [clean(profile.academicTitle), firstLast].filter(Boolean).join(' ')
  const titledDisplayName = [clean(profile.academicTitle), clean(profile.displayName)].filter(Boolean).join(' ')

  const candidates = new Set(
    [clean(profile.displayName), firstLast, titledFirstLast, titledDisplayName]
      .map((value) => normalizeComparableName(value))
      .filter(Boolean),
  )

  return candidates.has(byline)
}

