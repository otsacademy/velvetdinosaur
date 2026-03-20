const CARD_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

function tryFormatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return CARD_DATE_FORMATTER.format(parsed)
}

export function formatNewsCardDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'date tba') return trimmed

  const normalized = trimmed.replace(/^posted on\s+/i, '')
  const candidates = [
    normalized,
    normalized.replace(/\s+at\s+\d{1,2}:\d{2}(?::\d{2})?\s*(am|pm)?(?:\s+[a-z]{2,5})?$/i, ''),
  ]

  for (const candidate of candidates) {
    const formatted = tryFormatDate(candidate.trim())
    if (formatted) return formatted
  }

  return normalized
}
