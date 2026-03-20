export const ASAP_CHAPTERS = [] as const

export const ASAP_CHAPTER_OPTIONS: Array<{ value: string; label: string }> = []

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function titleCase(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() || ''}${part.slice(1)}`)
    .join(' ')
}

export function normalizeChapterSlug(value: unknown) {
  return slugify(clean(value))
}

export function normalizeChapterSlugs(values: unknown, primaryChapterSlug?: unknown) {
  const rawValues = Array.isArray(values)
    ? values
    : typeof values === 'string'
      ? values.split(',')
      : []

  const seen = new Set<string>()
  const normalized: string[] = []
  const primary = normalizeChapterSlug(primaryChapterSlug)

  if (primary) {
    seen.add(primary)
    normalized.push(primary)
  }

  for (const value of rawValues) {
    const next = normalizeChapterSlug(value)
    if (!next || seen.has(next)) continue
    seen.add(next)
    normalized.push(next)
  }

  return normalized
}

export function getChapterName(slug: string) {
  const normalized = normalizeChapterSlug(slug)
  return normalized ? titleCase(normalized) : ''
}
