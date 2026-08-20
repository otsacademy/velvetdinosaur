import { assertServerOnly } from '@/lib/_server/guard'
import { getChapterName, normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { connectDB } from '@/lib/db'
import { toIdString } from '@/lib/event-registration/shared'
import {
  type ASAPEvent,
  deriveEventDateParts,
  normalizeEventCategory,
  normalizeEventLocationType,
  normalizeEventRegistrationMode,
  normalizeEventSlug,
  normalizeEventStatus,
  normalizeEventTags,
} from '@/lib/events'
import { cleanString } from '@/lib/string-sanitizer'
import { Event } from '@/models/Event'

assertServerOnly('lib/events.server.ts')

export type EventListRow = {
  slug: string
  title: string
  category: string
  primaryChapterName: string
  startDateTime: string
  endDateTime: string
  location: string
  organizer: string
  status: 'draft' | 'published'
  featured: boolean
  updatedAt: string | null
  publishedAt: string | null
}

type DatabaseEvent = {
  _id?: unknown
  slug: string
  title: string
  startDateTime: Date | string
  endDateTime: Date | string
  locationType?: string
  venueName?: string
  venueAddress?: string
  category?: string
  description?: string
  heroImage?: string
  registrationMode?: string
  ticketUrl?: string
  ticketPrice?: string
  registrationOpensAt?: Date | string | null
  registrationClosesAt?: Date | string | null
  joiningInstructions?: string
  isFree?: boolean
  organizer?: string
  createdByUserId?: string | null
  primaryChapterSlug?: string
  chapterSlugs?: string[]
  chapterSnapshot?: {
    primaryChapterSlug?: string
    chapterSlugs?: string[]
    capturedAt?: Date | string | null
  } | null
  tags?: unknown
  status?: string
  featured?: boolean
  publishedAt?: Date | string | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
}

type ListPublishedEventsOptions = {
  limit?: number
}

export type EventSitemapEntry = {
  slug: string
  startDateTime: string | null
  publishedAt: string | null
  updatedAt: string | null
}

function clean(value: unknown) {
  return cleanString(value)
}

function toIsoString(value: Date | string | null | undefined) {
  if (!value) return ''
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  }

  const trimmed = clean(value)
  if (!trimmed) return ''
  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return trimmed
}

function resolveLocation(row: DatabaseEvent, locationType: 'in-person' | 'virtual' | 'hybrid') {
  const venueAddress = clean(row.venueAddress)
  if (locationType === 'virtual') return 'Virtual'
  if (locationType === 'hybrid') {
    return venueAddress ? `Hybrid / ${venueAddress}` : 'Hybrid'
  }
  return venueAddress || 'Location TBA'
}

function resolveChapterFields(row: DatabaseEvent, useSnapshot: boolean) {
  const livePrimaryChapterSlug = normalizeChapterSlug(row.primaryChapterSlug)
  const liveChapterSlugs = normalizeChapterSlugs(row.chapterSlugs, livePrimaryChapterSlug)
  if (!useSnapshot) {
    return {
      primaryChapterSlug: livePrimaryChapterSlug,
      primaryChapterName: getChapterName(livePrimaryChapterSlug),
      chapterSlugs: liveChapterSlugs,
    }
  }

  const snapshotPrimaryChapterSlug = normalizeChapterSlug(row.chapterSnapshot?.primaryChapterSlug)
  const snapshotChapterSlugs = normalizeChapterSlugs(row.chapterSnapshot?.chapterSlugs, snapshotPrimaryChapterSlug)
  const primaryChapterSlug = snapshotPrimaryChapterSlug || livePrimaryChapterSlug
  const chapterSlugs =
    snapshotChapterSlugs.length > 0 || snapshotPrimaryChapterSlug
      ? snapshotChapterSlugs
      : liveChapterSlugs

  return {
    primaryChapterSlug,
    primaryChapterName: getChapterName(primaryChapterSlug),
    chapterSlugs,
  }
}

function mapDbEventToEvent(row: DatabaseEvent, options?: { usePublishedSnapshot?: boolean }): ASAPEvent {
  const usePublishedSnapshot = options?.usePublishedSnapshot === true
  const normalizedSlug = normalizeEventSlug(row.slug)
  const locationType = normalizeEventLocationType(clean(row.locationType))
  const category = normalizeEventCategory(clean(row.category) || 'Conference')
  const status = normalizeEventStatus(clean(row.status) || 'draft')
  const startDateTime = toIsoString(row.startDateTime)
  const endDateTime = toIsoString(row.endDateTime)
  const description = clean(row.description)
  const venue = clean(row.venueName) || (locationType === 'virtual' ? 'Online' : 'Venue TBA')
  const location = resolveLocation(row, locationType)
  const tags = normalizeEventTags(row.tags)
  const heroImage = clean(row.heroImage) || '/images/placeholder.svg'
  const organizer = clean(row.organizer) || 'ASAP'
  const createdByUserId = clean(row.createdByUserId) || null
  const registrationMode = normalizeEventRegistrationMode(clean(row.registrationMode), clean(row.ticketUrl))
  const ticketPrice = clean(row.ticketPrice)
  const ticketUrl = clean(row.ticketUrl)
  const registrationOpensAt = toIsoString(row.registrationOpensAt) || null
  const registrationClosesAt = toIsoString(row.registrationClosesAt) || null
  const joiningInstructions = clean(row.joiningInstructions)
  const isFree = row.isFree !== false
  const dateParts = deriveEventDateParts(startDateTime, endDateTime)
  const chapterFields = resolveChapterFields(row, usePublishedSnapshot)

  return {
    id: toIdString(row._id),
    slug: normalizedSlug,
    title: clean(row.title) || 'Untitled event',
    startDateTime,
    endDateTime,
    date: dateParts.date,
    startTime: dateParts.startTime,
    endTime: dateParts.endTime,
    dayOfWeek: dateParts.dayOfWeek,
    location,
    venue,
    description,
    fullDescription: description,
    img: heroImage,
    category,
    tags,
    cost: isFree ? 'Free' : ticketPrice || 'Paid',
    organizer,
    createdByUserId,
    primaryChapterSlug: chapterFields.primaryChapterSlug,
    primaryChapterName: chapterFields.primaryChapterName,
    chapterSlugs: chapterFields.chapterSlugs,
    featured: row.featured === true,
    isHybrid: locationType === 'hybrid',
    isVirtual: locationType === 'virtual',
    ticketUrl,
    registrationMode,
    registrationOpensAt,
    registrationClosesAt,
    joiningInstructions,
    status,
    publishedAt: toIsoString(row.publishedAt) || null,
    updatedAt: toIsoString(row.updatedAt) || toIsoString(row.createdAt) || null,
  }
}

function createPublishedFilter() {
  return {
    $or: [{ status: 'published' as const }, { status: { $exists: false }, publishedAt: { $ne: null } }],
  }
}

export async function listPublishedEvents(options: ListPublishedEventsOptions = {}) {
  const conn = await connectDB()
  if (!conn) return []

  const query = Event.find(createPublishedFilter()).sort({ startDateTime: 1, createdAt: 1 }).lean()
  if (typeof options.limit === 'number' && options.limit > 0) {
    query.limit(Math.floor(options.limit))
  }

  const rows = (await query.exec()) as unknown as DatabaseEvent[]
  return rows.map((row) => mapDbEventToEvent(row, { usePublishedSnapshot: true }))
}

export async function listPublishedEventSitemapEntries(limit = 1000): Promise<EventSitemapEntry[]> {
  const conn = await connectDB()
  if (!conn) return []

  const rows = (await Event.find(createPublishedFilter())
    .select({
      slug: 1,
      startDateTime: 1,
      publishedAt: 1,
      updatedAt: 1,
    })
    .sort({ startDateTime: 1, createdAt: 1 })
    .limit(Math.max(1, Math.floor(limit)))
    .lean()
    .exec()) as unknown as Pick<DatabaseEvent, 'slug' | 'startDateTime' | 'publishedAt' | 'updatedAt'>[]

  return rows
    .map((row) => ({
      slug: normalizeEventSlug(row.slug || ''),
      startDateTime: toIsoString(row.startDateTime) || null,
      publishedAt: toIsoString(row.publishedAt) || null,
      updatedAt: toIsoString(row.updatedAt) || null,
    }))
    .filter((entry) => entry.slug.length > 0)
}

export async function getPublishedEventBySlug(slug: string) {
  const normalizedSlug = normalizeEventSlug(slug)
  if (!normalizedSlug) return null

  const conn = await connectDB()
  if (!conn) return null

  const row = (await Event.findOne({ slug: normalizedSlug, ...createPublishedFilter() }).lean().exec()) as
    | DatabaseEvent
    | null

  if (!row) return null
  return mapDbEventToEvent(row, { usePublishedSnapshot: true })
}

export async function getEventBySlugForEdit(slug: string) {
  const normalizedSlug = normalizeEventSlug(slug)
  if (!normalizedSlug) return null

  const conn = await connectDB()
  if (!conn) return null

  const row = (await Event.findOne({ slug: normalizedSlug }).lean().exec()) as DatabaseEvent | null
  if (!row) return null
  return mapDbEventToEvent(row)
}

export async function getEventsForEdit(): Promise<EventListRow[]> {
  const conn = await connectDB()
  if (!conn) return []

  const rows = (await Event.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean().exec()) as unknown as DatabaseEvent[]

  return rows.map((row) => {
    const event = mapDbEventToEvent(row)
    return {
      slug: event.slug,
      title: event.title,
      category: event.category,
      primaryChapterName: event.primaryChapterName || '',
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      location: event.location,
      organizer: event.organizer,
      status: event.status,
      featured: event.featured,
      updatedAt: event.updatedAt || null,
      publishedAt: event.publishedAt || null,
    }
  })
}
