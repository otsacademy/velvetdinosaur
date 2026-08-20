import type { ASAPEvent } from '@/lib/events'

const PROVIDER_DESCRIPTION_LIMIT = 1200

type CalendarEventInput = Pick<
  ASAPEvent,
  'slug' | 'title' | 'startDateTime' | 'endDateTime' | 'description' | 'fullDescription' | 'venue' | 'location' | 'ticketUrl'
> & {
  eventUrl?: string
}

type CalendarEventData = {
  slug: string
  title: string
  start: Date
  end: Date
  location: string
  providerDescription: string
  icsDescription: string
  eventUrl?: string
}

export type EventCalendarLinks = {
  googleUrl: string
  outlookUrl: string
  yahooUrl: string
  icsUrl: string
}

function parseDateTime(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function trimText(value: string | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  if (maxLength <= 1) return value.slice(0, maxLength)
  return `${value.slice(0, maxLength - 1)}…`
}

function compactUtcDateTime(value: Date) {
  const year = value.getUTCFullYear()
  const month = `${value.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${value.getUTCDate()}`.padStart(2, '0')
  const hours = `${value.getUTCHours()}`.padStart(2, '0')
  const minutes = `${value.getUTCMinutes()}`.padStart(2, '0')
  const seconds = `${value.getUTCSeconds()}`.padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

function escapeIcsText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replaceAll('\n', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;')
}

function safeSlugForFilename(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || 'event'
}

function readHostFromUrl(value: string | undefined) {
  if (!value) return null
  try {
    return new URL(value).host || null
  } catch {
    return null
  }
}

function buildDescriptionParts(input: CalendarEventInput) {
  const description = trimText(input.description)
  const fullDescription = trimText(input.fullDescription)
  const ticketUrl = trimText(input.ticketUrl)
  const eventUrl = trimText(input.eventUrl)

  const mainDescription = description || fullDescription
  const parts = [mainDescription]

  if (eventUrl) parts.push(`Event page: ${eventUrl}`)
  if (ticketUrl) parts.push(`Registration: ${ticketUrl}`)

  return parts.filter(Boolean)
}

function toCalendarEventData(input: CalendarEventInput): CalendarEventData | null {
  const start = parseDateTime(input.startDateTime)
  const end = parseDateTime(input.endDateTime)
  if (!start || !end || end.getTime() <= start.getTime()) return null

  const title = trimText(input.title) || 'ASAP Event'
  const slug = trimText(input.slug)
  if (!slug) return null
  const venue = trimText(input.venue)
  const location = trimText(input.location)
  const eventUrl = trimText(input.eventUrl)
  const descriptionParts = buildDescriptionParts(input)
  const description = descriptionParts.join('\n\n').trim()

  return {
    slug,
    title,
    start,
    end,
    location: [venue, location].filter(Boolean).join(', '),
    providerDescription: truncate(description, PROVIDER_DESCRIPTION_LIMIT),
    icsDescription: description,
    eventUrl: eventUrl || undefined,
  }
}

export function buildEventCalendarLinks(input: CalendarEventInput): EventCalendarLinks | null {
  const eventData = toCalendarEventData(input)
  if (!eventData) return null

  const startUtc = compactUtcDateTime(eventData.start)
  const endUtc = compactUtcDateTime(eventData.end)

  const googleParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    dates: `${startUtc}/${endUtc}`,
    details: eventData.providerDescription,
    location: eventData.location,
  })

  const outlookParams = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: eventData.title,
    body: eventData.providerDescription,
    location: eventData.location,
    startdt: eventData.start.toISOString(),
    enddt: eventData.end.toISOString(),
  })

  const yahooParams = new URLSearchParams({
    v: '60',
    view: 'd',
    type: '20',
    title: eventData.title,
    st: startUtc,
    et: endUtc,
    desc: eventData.providerDescription,
    in_loc: eventData.location,
  })

  return {
    googleUrl: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    outlookUrl: `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`,
    yahooUrl: `https://calendar.yahoo.com/?${yahooParams.toString()}`,
    icsUrl: `/api/events/${encodeURIComponent(eventData.slug)}/calendar`,
  }
}

export function createEventIcs(input: CalendarEventInput) {
  const eventData = toCalendarEventData(input)
  if (!eventData) return null

  const uidDomain = readHostFromUrl(eventData.eventUrl) || 'events.academicsstand.org'
  const uid = `${safeSlugForFilename(eventData.slug || eventData.title)}-${compactUtcDateTime(eventData.start)}@${uidDomain}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//ASAP//Events//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${compactUtcDateTime(new Date())}`,
    `DTSTART:${compactUtcDateTime(eventData.start)}`,
    `DTEND:${compactUtcDateTime(eventData.end)}`,
    `SUMMARY:${escapeIcsText(eventData.title)}`,
    `DESCRIPTION:${escapeIcsText(eventData.icsDescription)}`,
    `LOCATION:${escapeIcsText(eventData.location)}`,
  ]

  if (eventData.eventUrl) {
    lines.push(`URL:${escapeIcsText(eventData.eventUrl)}`)
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return {
    content: `${lines.join('\r\n')}\r\n`,
    filename: `${safeSlugForFilename(eventData.slug || eventData.title)}.ics`,
  }
}
