const NEWS_TIMEZONE = 'Europe/London'
const LONDON_PARTS_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: NEWS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

type LondonParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function pad2(value: number) {
  return `${value}`.padStart(2, '0')
}

function normalizeDateTimeInput(value: string | null | undefined) {
  const raw = value?.trim()
  if (!raw) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(raw)
  if (!match) return null

  const [_, year, month, day, hour, minute] = match
  const parsedYear = Number(year)
  const parsedMonth = Number(month)
  const parsedDay = Number(day)
  const parsedHour = Number(hour)
  const parsedMinute = Number(minute)

  if (
    Number.isNaN(parsedYear) ||
    Number.isNaN(parsedMonth) ||
    Number.isNaN(parsedDay) ||
    Number.isNaN(parsedHour) ||
    Number.isNaN(parsedMinute)
  ) {
    return null
  }

  if (
    parsedYear < 1970 ||
    parsedMonth < 1 ||
    parsedMonth > 12 ||
    parsedDay < 1 ||
    parsedDay > 31 ||
    parsedHour > 23 ||
    parsedMinute > 59
  ) {
    return null
  }

  return {
    year: parsedYear,
    month: parsedMonth,
    day: parsedDay,
    hour: parsedHour,
    minute: parsedMinute,
  } satisfies LondonParts
}

function extractLondonParts(date: Date) {
  const parts = Object.fromEntries(
    LONDON_PARTS_FORMAT.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  } satisfies LondonParts
}

function isSameLondonParts(left: LondonParts, right: LondonParts) {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  )
}

export function isPublishNowEnabled() {
  return true
}

export function toLondonDateTimeInput(value: string | null | undefined) {
  const parsed = new Date(value ?? '')
  if (Number.isNaN(parsed.getTime())) return ''
  const parts = extractLondonParts(parsed)
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`
}

export function londonDateTimeToUtc(value: string | null | undefined) {
  const parsed = normalizeDateTimeInput(value)
  if (!parsed) return null

  const target = Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute)
  const searchStart = target - 12 * 60 * 60 * 1000
  const searchEnd = target + 12 * 60 * 60 * 1000

  for (let candidate = searchStart; candidate <= searchEnd; candidate += 60 * 1000) {
    const current = extractLondonParts(new Date(candidate))
    if (isSameLondonParts(current, parsed)) {
      return new Date(candidate)
    }
  }

  return null
}
