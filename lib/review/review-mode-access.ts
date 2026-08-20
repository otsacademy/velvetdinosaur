const REVIEW_MODE_PRODUCTION_EMAIL = 'ian.wickens@ontourism.academy'
const REVIEW_MODE_RESTRICTED_HOSTS = new Set(['academicsstand.org', 'www.academicsstand.org'])

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase()
}

function extractHostname(value?: string | null) {
  const normalized = clean(value)
  if (!normalized) return ''

  try {
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return new URL(normalized).hostname.toLowerCase()
    }
    return new URL(`https://${normalized}`).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function resolveRuntimeHostname(requestUrl?: string | null) {
  return (
    extractHostname(requestUrl) ||
    extractHostname(process.env.NEXT_PUBLIC_BASE_URL) ||
    extractHostname(process.env.PUBLIC_BASE_URL) ||
    extractHostname(process.env.BETTERAUTH_URL)
  )
}

export function reviewModeIsRestrictedInRuntime(requestUrl?: string | null) {
  return REVIEW_MODE_RESTRICTED_HOSTS.has(resolveRuntimeHostname(requestUrl))
}

export function canManageReviewMode(email?: string | null, requestUrl?: string | null) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return false
  if (!reviewModeIsRestrictedInRuntime(requestUrl)) return true
  return normalizedEmail === REVIEW_MODE_PRODUCTION_EMAIL
}

export function getReviewModeProductionEmail() {
  return REVIEW_MODE_PRODUCTION_EMAIL
}
