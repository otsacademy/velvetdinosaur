import { cleanString } from '@/lib/string-sanitizer'

export const EVENT_CATEGORIES = ['Conference', 'Workshop', 'Awards', 'Forum', 'Chapter Event'] as const

export const EVENT_LOCATION_TYPES = ['in-person', 'virtual', 'hybrid'] as const

export const EVENT_STATUSES = ['draft', 'published'] as const
export const EVENT_REGISTRATION_MODES = ['none', 'external', 'local'] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]
export type EventLocationType = (typeof EVENT_LOCATION_TYPES)[number]
export type EventStatus = (typeof EVENT_STATUSES)[number]
export type EventRegistrationMode = (typeof EVENT_REGISTRATION_MODES)[number]
export type EventRegistrationWindowStatus = 'not-applicable' | 'opens-later' | 'open' | 'closed'

export interface SiteEvent {
  id?: string
  slug: string
  title: string
  startDateTime: string
  endDateTime: string
  date: string
  startTime: string
  endTime: string
  dayOfWeek: string
  location: string
  venue: string
  description: string
  fullDescription: string
  img: string
  category: EventCategory
  tags: string[]
  cost: string
  organizer: string
  createdByUserId?: string | null
  primaryChapterSlug?: string
  primaryChapterName?: string
  chapterSlugs?: string[]
  featured: boolean
  isHybrid?: boolean
  isVirtual?: boolean
  ticketUrl?: string
  registrationMode?: EventRegistrationMode
  registrationOpensAt?: string | null
  registrationClosesAt?: string | null
  joiningInstructions?: string
  status: EventStatus
  publishedAt?: string | null
  updatedAt?: string | null
}

type DateInput = Date | string | number | null | undefined

function toDate(value: DateInput) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatLocalTime(date: Date) {
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
}

function formatDayOfWeek(date: Date) {
  return date
    .toLocaleDateString('en-US', {
      weekday: 'short',
    })
    .toUpperCase()
}

export function normalizeEventSlug(slug: string) {
  try {
    return cleanString(decodeURIComponent(slug)).toLowerCase()
  } catch {
    return cleanString(slug).toLowerCase()
  }
}

export function normalizeEventCategory(value: string): EventCategory {
  const normalized = cleanString(value).toLowerCase()
  const found = EVENT_CATEGORIES.find((entry) => entry.toLowerCase() === normalized)
  return found || 'Conference'
}

export function normalizeEventLocationType(value: string): EventLocationType {
  const normalized = cleanString(value).toLowerCase()
  const found = EVENT_LOCATION_TYPES.find((entry) => entry === normalized)
  return found || 'in-person'
}

export function normalizeEventStatus(value: string): EventStatus {
  return value === 'published' ? 'published' : 'draft'
}

export function normalizeEventRegistrationMode(
  value: string,
  fallbackTicketUrl?: string | null
): EventRegistrationMode {
  if (value === 'local') return 'local'
  if (value === 'external') return 'external'
  const hasFallbackTicketUrl = typeof fallbackTicketUrl === 'string' && fallbackTicketUrl.trim().length > 0
  return hasFallbackTicketUrl ? 'external' : 'none'
}

export function normalizeEventTags(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  const seen = new Set<string>()
  const output: string[] = []

  for (const entry of source) {
    const next = cleanString(entry)
    if (!next) continue
    const key = next.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(next)
  }

  return output
}

export function deriveEventDateParts(startDateTime: DateInput, endDateTime: DateInput) {
  const startDate = toDate(startDateTime)
  const endDate = toDate(endDateTime)

  if (!startDate || !endDate) {
    return {
      date: '',
      startTime: 'Time TBA',
      endTime: 'Time TBA',
      dayOfWeek: 'TBA',
    }
  }

  return {
    date: formatLocalDate(startDate),
    startTime: formatLocalTime(startDate),
    endTime: formatLocalTime(endDate),
    dayOfWeek: formatDayOfWeek(startDate),
  }
}

export function isEventPast(event: Pick<SiteEvent, 'endDateTime'>, now = new Date()) {
  const endDate = toDate(event.endDateTime)
  if (!endDate) return false
  return endDate.getTime() < now.getTime()
}

export function isEventUpcoming(event: Pick<SiteEvent, 'endDateTime'>, now = new Date()) {
  return !isEventPast(event, now)
}

export function getEventRegistrationWindow(
  event: Pick<SiteEvent, 'registrationMode' | 'registrationOpensAt' | 'registrationClosesAt' | 'endDateTime'>,
  now = new Date(),
) {
  const opensAt = toDate(event.registrationOpensAt)
  const explicitClosesAt = toDate(event.registrationClosesAt)
  const eventEndDate = toDate(event.endDateTime)
  const closesAt =
    explicitClosesAt && eventEndDate
      ? new Date(Math.min(explicitClosesAt.getTime(), eventEndDate.getTime()))
      : explicitClosesAt || eventEndDate

  if (event.registrationMode !== 'local') {
    return {
      status: 'not-applicable' as EventRegistrationWindowStatus,
      opensAt,
      closesAt,
    }
  }

  if (closesAt && closesAt.getTime() < now.getTime()) {
    return {
      status: 'closed' as EventRegistrationWindowStatus,
      opensAt,
      closesAt,
    }
  }

  if (opensAt && opensAt.getTime() > now.getTime()) {
    return {
      status: 'opens-later' as EventRegistrationWindowStatus,
      opensAt,
      closesAt,
    }
  }

  return {
    status: 'open' as EventRegistrationWindowStatus,
    opensAt,
    closesAt,
  }
}

export function isEventRegistrationOpen(
  event: Pick<SiteEvent, 'registrationMode' | 'registrationOpensAt' | 'registrationClosesAt' | 'endDateTime'>,
  now = new Date(),
) {
  return getEventRegistrationWindow(event, now).status === 'open'
}

export function isEventCategory(value: string): value is EventCategory {
  return EVENT_CATEGORIES.includes(value as EventCategory)
}

export function hasEventRegistration(
  event: Pick<SiteEvent, 'registrationMode' | 'ticketUrl' | 'registrationOpensAt' | 'registrationClosesAt' | 'endDateTime'>,
) {
  return isEventRegistrationOpen(event) || (event.registrationMode === 'external' && Boolean(event.ticketUrl))
}

export function eventRegistrationHref(event: Pick<SiteEvent, 'slug' | 'registrationMode' | 'ticketUrl'>) {
  if (event.registrationMode === 'external' && event.ticketUrl) return event.ticketUrl
  if (event.registrationMode === 'local') return `/events/${event.slug}#register`
  return `/events/${event.slug}`
}

export function eventRegistrationLabel(
  event: Pick<SiteEvent, 'registrationMode' | 'ticketUrl' | 'registrationOpensAt' | 'registrationClosesAt' | 'endDateTime'>,
) {
  return hasEventRegistration(event) ? 'Register' : 'Details'
}

export function eventRegistrationExternal(event: Pick<SiteEvent, 'registrationMode' | 'ticketUrl'>) {
  return event.registrationMode === 'external' && Boolean(event.ticketUrl)
}
