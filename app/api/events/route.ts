import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { connectDB } from '@/lib/db'
import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import {
  EVENT_CATEGORIES,
  normalizeEventCategory,
  normalizeEventLocationType,
  normalizeEventRegistrationMode,
  normalizeEventSlug,
  normalizeEventStatus,
  normalizeEventTags,
  type EventLocationType,
} from '@/lib/events'
import { requireNewsArticleWriteAccess } from '@/lib/news-article-access'
import { isAdminOnly } from '@/lib/site-config'
import { slugifyArticleTitle } from '@/lib/news-slug'
import { cleanString } from '@/lib/string-sanitizer'
import { getUserProfileByUserId } from '@/lib/user-profile'
import { Event } from '@/models/Event'

type EventPayload = {
  title?: string
  slug?: string
  originalSlug?: string
  startDateTime?: string
  endDateTime?: string
  locationType?: string
  venueName?: string
  venueAddress?: string
  category?: string
  description?: string
  heroImage?: string
  registrationMode?: string
  ticketUrl?: string
  ticketPrice?: string
  registrationOpensAt?: string
  registrationClosesAt?: string
  joiningInstructions?: string
  isFree?: boolean | string
  organizer?: string
  primaryChapterSlug?: string
  chapterSlugs?: unknown
  tags?: unknown
  status?: string
  featured?: boolean | string
}

function clean(value: unknown) {
  return cleanString(value)
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
  }
  return false
}

function parseDate(value: unknown) {
  const raw = clean(value)
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function normalizeChapterListInput(value: unknown) {
  return Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []
}

function assertCategory(value: string) {
  if (!EVENT_CATEGORIES.includes(value as (typeof EVENT_CATEGORIES)[number])) {
    return null
  }
  return value
}

function normalizeLocationType(value: unknown): EventLocationType {
  return normalizeEventLocationType(clean(value) || 'in-person')
}

export async function POST(request: Request) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const access = await requireNewsArticleWriteAccess(request)
  if (!access.ok) {
    return access.response
  }

  const payload = (await request.json().catch(() => ({}))) as EventPayload

  const title = clean(payload.title)
  const requestedSlug = clean(payload.slug)
  const normalizedSlug = normalizeEventSlug(slugifyArticleTitle(requestedSlug || title))
  const originalSlug = normalizeEventSlug(clean(payload.originalSlug))
  const startDateTime = parseDate(payload.startDateTime)
  const endDateTime = parseDate(payload.endDateTime)
  const locationType = normalizeLocationType(payload.locationType)
  const category = normalizeEventCategory(clean(payload.category) || 'Conference')
  const validatedCategory = assertCategory(category)
  const description = clean(payload.description)
  const heroImage = clean(payload.heroImage) || '/images/placeholder.svg'
  const registrationMode = normalizeEventRegistrationMode(clean(payload.registrationMode), clean(payload.ticketUrl))
  const venueName = clean(payload.venueName)
  const venueAddress = clean(payload.venueAddress)
  const ticketUrl = clean(payload.ticketUrl)
  const ticketPrice = clean(payload.ticketPrice)
  const rawRegistrationOpensAt = clean(payload.registrationOpensAt)
  const rawRegistrationClosesAt = clean(payload.registrationClosesAt)
  const registrationOpensAt = parseDate(payload.registrationOpensAt)
  const registrationClosesAt = parseDate(payload.registrationClosesAt)
  const joiningInstructions = clean(payload.joiningInstructions)
  const organizer = clean(payload.organizer) || 'ASAP'
  const rawPrimaryChapterSlug = clean(payload.primaryChapterSlug)
  const rawChapterSlugs = normalizeChapterListInput(payload.chapterSlugs)
  const requestedPrimaryChapterSlug = rawPrimaryChapterSlug ? normalizeChapterSlug(rawPrimaryChapterSlug) : ''
  const unknownChapterInputs = rawChapterSlugs.filter((value) => clean(value) && !normalizeChapterSlug(value))
  const tags = normalizeEventTags(payload.tags)
  const status = normalizeEventStatus(clean(payload.status) || 'draft')
  const featured = parseBoolean(payload.featured)
  const isFree = parseBoolean(payload.isFree) || !ticketPrice

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (!normalizedSlug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  if (!startDateTime || !endDateTime) {
    return NextResponse.json({ error: 'Start and end date/time are required' }, { status: 400 })
  }

  if (endDateTime.getTime() <= startDateTime.getTime()) {
    return NextResponse.json({ error: 'End date/time must be after start date/time' }, { status: 400 })
  }
  if (rawRegistrationOpensAt && !registrationOpensAt) {
    return NextResponse.json({ error: 'Registration open time is invalid' }, { status: 400 })
  }
  if (rawRegistrationClosesAt && !registrationClosesAt) {
    return NextResponse.json({ error: 'Registration close time is invalid' }, { status: 400 })
  }
  if (registrationOpensAt && registrationClosesAt && registrationClosesAt.getTime() <= registrationOpensAt.getTime()) {
    return NextResponse.json({ error: 'Registration close time must be after the open time' }, { status: 400 })
  }
  if (registrationOpensAt && registrationOpensAt.getTime() >= endDateTime.getTime()) {
    return NextResponse.json({ error: 'Registration open time must be before the event ends' }, { status: 400 })
  }
  if (registrationClosesAt && registrationClosesAt.getTime() > endDateTime.getTime()) {
    return NextResponse.json({ error: 'Registration close time cannot be after the event ends' }, { status: 400 })
  }

  if (!validatedCategory) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }
  if (status === 'published' && registrationMode === 'external' && !ticketUrl) {
    return NextResponse.json({ error: 'External registration requires a ticket URL before publishing' }, { status: 400 })
  }
  if (rawPrimaryChapterSlug && !requestedPrimaryChapterSlug) {
    return NextResponse.json({ error: 'Primary chapter must be a valid ASAP chapter' }, { status: 400 })
  }
  if (unknownChapterInputs.length > 0) {
    return NextResponse.json({ error: 'Chapter affiliations must use valid ASAP chapters' }, { status: 400 })
  }

  const conn = await connectDB()
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const lookupSlug = originalSlug || normalizedSlug

  const existing = (await Event.findOne({ slug: lookupSlug })
    .select({
      _id: 1,
      slug: 1,
      status: 1,
      publishedAt: 1,
      createdByUserId: 1,
      primaryChapterSlug: 1,
      chapterSlugs: 1,
    })
    .lean()
    .exec()) as
    | {
        _id: string
        slug: string
        status?: 'draft' | 'published'
        publishedAt?: Date | string | null
        createdByUserId?: string | null
        primaryChapterSlug?: string | null
        chapterSlugs?: string[] | null
      }
    | null

  const authorProfile = await getUserProfileByUserId(access.userId)
  const existingPrimaryChapterSlug = normalizeChapterSlug(existing?.primaryChapterSlug)
  const existingChapterSlugs = normalizeChapterSlugs(existing?.chapterSlugs, existingPrimaryChapterSlug)
  const fallbackPrimaryChapterSlug = existingPrimaryChapterSlug || authorProfile?.primaryChapterSlug || ''
  const fallbackChapterSlugs =
    existingChapterSlugs.length > 0 || existingPrimaryChapterSlug ? existingChapterSlugs : authorProfile?.chapterSlugs || []
  const requestedChapterSlugs = normalizeChapterSlugs(rawChapterSlugs, requestedPrimaryChapterSlug)
  const primaryChapterSlug = requestedPrimaryChapterSlug || fallbackPrimaryChapterSlug
  const chapterSlugs = normalizeChapterSlugs(
    requestedChapterSlugs.length > 0 || requestedPrimaryChapterSlug ? requestedChapterSlugs : fallbackChapterSlugs,
    primaryChapterSlug,
  )

  if (existing && existing.slug !== normalizedSlug) {
    const conflict = await Event.findOne({ slug: normalizedSlug }).select({ _id: 1 }).lean().exec()
    if (conflict) {
      return NextResponse.json({ error: 'Slug is already in use' }, { status: 409 })
    }
  }

  let publishedAt: Date | null = null
  if (status === 'published') {
    const existingPublishedAt =
      existing?.publishedAt instanceof Date
        ? existing.publishedAt
        : typeof existing?.publishedAt === 'string'
          ? new Date(existing.publishedAt)
          : null

    publishedAt = existingPublishedAt && !Number.isNaN(existingPublishedAt.getTime()) ? existingPublishedAt : new Date()
  }

  const chapterSnapshotPatch =
    status === 'published'
      ? {
          chapterSnapshot: {
            primaryChapterSlug,
            chapterSlugs,
            capturedAt: new Date(),
          },
        }
      : existing?.status === 'published'
        ? {}
        : { chapterSnapshot: null }

  const updatePatch = {
    slug: normalizedSlug,
    title,
    startDateTime,
    endDateTime,
    locationType,
    venueName,
    venueAddress,
    category,
    description,
    heroImage,
    registrationMode,
    ticketUrl,
    ticketPrice,
    registrationOpensAt: registrationMode === 'local' ? registrationOpensAt : null,
    registrationClosesAt: registrationMode === 'local' ? registrationClosesAt : null,
    joiningInstructions,
    isFree,
    organizer,
    createdByUserId: existing?.createdByUserId || access.userId,
    primaryChapterSlug,
    chapterSlugs,
    tags,
    status,
    featured,
    publishedAt,
    ...(chapterSnapshotPatch as Record<string, unknown>),
  }

  try {
    const saved = existing
      ? await Event.findOneAndUpdate({ _id: existing._id }, { $set: updatePatch }, { new: true }).lean().exec()
      : await Event.findOneAndUpdate(
          { slug: normalizedSlug },
          { $set: updatePatch },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        )
          .lean()
          .exec()

    if (!saved) {
      return NextResponse.json({ error: 'Unable to save event' }, { status: 500 })
    }

    revalidatePath('/events')
    revalidatePath(`/events/${normalizedSlug}`)
    if (existing?.slug && existing.slug !== normalizedSlug) {
      revalidatePath(`/events/${existing.slug}`)
    }

    return NextResponse.json({ ok: true, slug: normalizedSlug })
  } catch (error) {
    const maybeError = error as { code?: number }
    if (maybeError?.code === 11000) {
      return NextResponse.json({ error: 'Slug is already in use' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Unable to save event' }, { status: 500 })
  }
}
