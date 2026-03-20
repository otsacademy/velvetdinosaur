const DEFAULT_AUTHOR_NAME = 'ASAP Staff'
const DEFAULT_AUTHOR_IMAGE = '/images/asap-logo-trimmed.webp'

const GENERIC_AUTHOR_NAMES = new Set([
  'admin',
  'administrator',
  'asap editorial',
  'editorial',
  'editorial team'
])

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function isPlaceholderImage(value: string) {
  const normalized = value.trim().toLowerCase()
  return (
    normalized === '/placeholder.svg' ||
    normalized === '/images/placeholder.svg' ||
    normalized === 'placeholder.svg' ||
    normalized.includes('default-avatar') ||
    normalized.includes('avatar-default') ||
    normalized.includes('placeholder') ||
    normalized.includes('dinosaur')
  )
}

export function normalizeArticleAuthorName(value?: string | null) {
  const raw = typeof value === 'string' ? normalizeWhitespace(value) : ''
  if (!raw) return DEFAULT_AUTHOR_NAME
  if (GENERIC_AUTHOR_NAMES.has(raw.toLowerCase())) return DEFAULT_AUTHOR_NAME
  return raw
}

export function normalizeArticleAuthorImage(value?: string | null) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw || isPlaceholderImage(raw)) return DEFAULT_AUTHOR_IMAGE
  return raw
}

export function normalizeArticleAuthor(author?: { name?: string | null; img?: string | null }) {
  return {
    name: normalizeArticleAuthorName(author?.name),
    img: normalizeArticleAuthorImage(author?.img)
  }
}

export function createArticleExcerpt(
  input: string,
  options: {
    maxChars?: number
    preferSentence?: boolean
  } = {}
) {
  const maxChars = Math.max(40, options.maxChars ?? 220)
  const normalized = normalizeWhitespace(input)
  if (!normalized) return ''
  if (normalized.length <= maxChars) return normalized

  const preferSentence = options.preferSentence !== false
  if (preferSentence) {
    const firstSentence = normalized.match(/^(.+?[.!?])(?:\s|$)/)?.[1]?.trim() || ''
    if (firstSentence && firstSentence.length <= maxChars) {
      return firstSentence
    }
  }

  const preview = normalized.slice(0, maxChars + 1)
  const wordBoundary = preview.lastIndexOf(' ')
  const cutoff = wordBoundary > Math.floor(maxChars * 0.55) ? wordBoundary : maxChars
  const trimmed = preview.slice(0, cutoff).trim()

  return trimmed ? `${trimmed}…` : `${normalized.slice(0, maxChars).trim()}…`
}

export const NEWS_PRESENTATION_DEFAULTS = {
  authorName: DEFAULT_AUTHOR_NAME,
  authorImage: DEFAULT_AUTHOR_IMAGE
} as const
