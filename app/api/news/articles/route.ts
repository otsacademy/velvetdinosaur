import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'

import { logAudit } from '@/lib/audit'
import { getAuth } from '@/lib/auth'
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate'
import { newsTags } from '@/lib/cache-tags'
import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { connectDB } from '@/lib/db'
import { requireNewsArticleWriteAccess } from '@/lib/news-article-access'
import {
  estimateReadTime,
  extractPlainTextFromPlate,
  formatDisplayDate,
  plateToArticleSections,
  stripLeadingHeroImageNode,
} from '@/lib/news-plate-transform'
import { applyEditorialFixesToPlateContent } from '@/lib/news-editorial-fixes'
import { saveNewsArticleSnapshot } from '@/lib/news-article-history.server'
import { checkNewsLinks } from '@/lib/news/link-checker'
import { createArticleExcerpt, normalizeArticleAuthorImage, normalizeArticleAuthorName } from '@/lib/news-presentation'
import { slugifyArticleTitle } from '@/lib/news-slug'
import { isAdminOnly } from '@/lib/site-config'
import { getUserProfileByUserId, resolveAuthorIdentity } from '@/lib/user-profile'
import { getUserRole } from '@/lib/roles'
import { normalizeNewsEditorDocumentSettings } from '@/lib/news-editor-document-settings'
import { rewriteInlineMediaForStorage } from '@/lib/inline-media.server'
import { cleanString } from '@/lib/string-sanitizer'
import { NewsArticle } from '@/models/NewsArticle'

type NewsArticleStatus = 'draft' | 'scheduled' | 'published'
type PublishMode = 'draft' | 'publish' | 'scheduled'

type ArticlePayload = {
  title?: string
  slug?: string
  desc?: string
  tag?: string
  tags?: unknown
  img?: string
  imageCaption?: string
  authorName?: string
  authorImage?: string
  primaryChapterSlug?: string
  chapterSlugs?: unknown
  publishMode?: PublishMode
  action?: 'publish' | 'draft'
  publishDate?: string
  content?: unknown
  publishAt?: string
  forcePublish?: boolean | string
  seoTitle?: string
  seoDescription?: string
  openGraphTitle?: string
  openGraphDescription?: string
  openGraphImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  editorSettings?: unknown
}

function trimOrEmpty(value: unknown) {
  return cleanString(value)
}

function parsePublishDate(value: unknown) {
  const raw = trimOrEmpty(value)
  if (!raw) {
    return { provided: false as const, valid: true as const, value: null as Date | null }
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return { provided: true as const, valid: false as const, value: null as Date | null }
  }

  return { provided: true as const, valid: true as const, value: parsed }
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
  }
  return false
}

function normalizePublishMode(value: unknown) {
  return value === 'publish' || value === 'scheduled' ? value : 'draft'
}

function normalizeTags(value: unknown) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  const seen = new Set<string>()
  const normalized: string[] = []
  for (const raw of rawValues) {
    const next = trimOrEmpty(raw)
    if (!next) continue
    const key = next.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(next)
  }

  return normalized
}

function normalizeChapterListInput(value: unknown) {
  return Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []
}

function readDate(value: unknown) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

function nextRevision(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.floor(value) + 1
  }
  return 1
}

export async function POST(request: Request) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const auth = getAuth()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const access = await requireNewsArticleWriteAccess(request)
  if (!access.ok) {
    return access.response
  }
  const sessionUser = (session as { user?: { id?: string; email?: string; name?: string } } | null)?.user
  const userRole = await getUserRole(access.userId, sessionUser?.email || null)
  const isAdminUser = userRole === 'admin'

  const payload = (await request.json().catch(() => ({}))) as ArticlePayload
  const publishMode = normalizePublishMode(payload.publishMode ?? payload.action)
  const forcePublish = parseBoolean(payload.forcePublish)
  const title = trimOrEmpty(payload.title)
  const requestedSlug = trimOrEmpty(payload.slug)
  const slug = slugifyArticleTitle(requestedSlug || title)
  const publishDate = parsePublishDate(payload.publishDate)
  const publishAt = parsePublishDate(payload.publishAt)

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  if (!publishDate.valid) {
    return NextResponse.json({ error: 'Invalid publish date' }, { status: 400 })
  }
  if (publishMode === 'scheduled' && !publishAt.valid) {
    return NextResponse.json({ error: 'Invalid scheduled publish date' }, { status: 400 })
  }

  const tag = trimOrEmpty(payload.tag) || 'Announcements'
  const normalizedTags = normalizeTags(payload.tags)
  const tags = normalizedTags.length > 0 ? normalizedTags : [tag]
  const requestedAuthorName = trimOrEmpty(payload.authorName)
  const requestedAuthorImage = trimOrEmpty(payload.authorImage)
  const rawPrimaryChapterSlug = trimOrEmpty(payload.primaryChapterSlug)
  const rawChapterSlugs = normalizeChapterListInput(payload.chapterSlugs)
  const requestedPrimaryChapterSlug = rawPrimaryChapterSlug ? normalizeChapterSlug(rawPrimaryChapterSlug) : ''
  const unknownChapterInputs = rawChapterSlugs.filter((value) => trimOrEmpty(value) && !normalizeChapterSlug(value))
  if (rawPrimaryChapterSlug && !requestedPrimaryChapterSlug) {
    return NextResponse.json({ error: 'Primary chapter must be a valid ASAP chapter' }, { status: 400 })
  }
  if (unknownChapterInputs.length > 0) {
    return NextResponse.json({ error: 'Chapter affiliations must use valid ASAP chapters' }, { status: 400 })
  }
  const authorIdentity = await resolveAuthorIdentity(session, {
    name: requestedAuthorName || undefined,
    image: requestedAuthorImage || undefined
  })
  const authorName = normalizeArticleAuthorName(requestedAuthorName || authorIdentity.name)
  let authorImage = normalizeArticleAuthorImage(requestedAuthorImage || authorIdentity.image)
  let heroImage = trimOrEmpty(payload.img)
  const imageCaption = trimOrEmpty(payload.imageCaption)
  const incomingSeoTitle = trimOrEmpty(payload.seoTitle)
  const incomingSeoDescription = trimOrEmpty(payload.seoDescription)
  const editorSettings = normalizeNewsEditorDocumentSettings(payload.editorSettings)
  const hasIncomingSeoTitle = Object.prototype.hasOwnProperty.call(payload, 'seoTitle')
  const hasIncomingSeoDescription = Object.prototype.hasOwnProperty.call(payload, 'seoDescription')

  let normalizedContent = applyEditorialFixesToPlateContent(payload.content).content
  const openGraphTitle = trimOrEmpty(payload.openGraphTitle)
  const openGraphDescription = trimOrEmpty(payload.openGraphDescription)
  let openGraphImage = trimOrEmpty(payload.openGraphImage)
  const twitterTitle = trimOrEmpty(payload.twitterTitle)
  const twitterDescription = trimOrEmpty(payload.twitterDescription)
  let twitterImage = trimOrEmpty(payload.twitterImage)

  try {
    const media = await rewriteInlineMediaForStorage(
      {
        heroImage,
        authorImage,
        content: normalizedContent,
        openGraphImage,
        twitterImage,
      },
      {
        folder: 'news',
        label: `news:${slug}`,
      },
    )
    heroImage = media.value.heroImage
    authorImage = media.value.authorImage
    normalizedContent = media.value.content
    openGraphImage = media.value.openGraphImage
    twitterImage = media.value.twitterImage
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process inline media'
    const status =
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : 400
    return NextResponse.json({ error: message }, { status })
  }

  // The hero belongs to the img field only; never persist it as a leading body
  // block, or the article layout renders it twice.
  normalizedContent = stripLeadingHeroImageNode(normalizedContent, heroImage)

  const plainText = extractPlainTextFromPlate(normalizedContent)
  const descSource = trimOrEmpty(payload.desc) || plainText
  const desc = createArticleExcerpt(descSource, { maxChars: 220, preferSentence: true })

  if (!plainText.trim()) {
    return NextResponse.json({ error: 'Article body cannot be empty' }, { status: 400 })
  }

  const sections = plateToArticleSections(normalizedContent)
  const readTime = estimateReadTime(plainText)

  const conn = await connectDB()
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const existing = (await NewsArticle.findOne({ slug })
    .select({
      revision: 1,
      status: 1,
      primaryChapterSlug: 1,
      chapterSlugs: 1,
      publishedAt: 1,
      publishAt: 1,
      pendingPublishRequest: 1,
      seoTitle: 1,
      seoDescription: 1,
      seoSource: 1,
      seoNeedsReview: 1,
      seoGeneratedAt: 1,
      seoModel: 1,
    })
    .lean()
    .exec()) as unknown as {
    revision?: number
    status?: NewsArticleStatus
    primaryChapterSlug?: string | null
    chapterSlugs?: string[] | null
    publishAt?: Date | string | null
    publishedAt?: Date | string | null
    pendingPublishRequest?: {
      requestId?: string | null
      baseRevision?: number | null
      requestedAt?: Date | string | null
      requestedByUserId?: string | null
      requestedByEmail?: string | null
      requestedByName?: string | null
      requestedMode?: 'publish' | 'scheduled'
      requestedPublishAt?: Date | string | null
    } | null
    seoTitle?: string | null
    seoDescription?: string | null
  } | null

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
    primaryChapterSlug
  )

  const nextRevisionValue = nextRevision(existing?.revision)
  const existingRawSeoTitle = typeof existing?.seoTitle === 'string' ? existing.seoTitle.trim() : ''
  const existingRawSeoDescription = typeof existing?.seoDescription === 'string' ? existing.seoDescription.trim() : ''
  const existingSeoTitle = trimOrEmpty(existing?.seoTitle)
  const existingSeoDescription = trimOrEmpty(existing?.seoDescription)
  const existingSeoTitleWasPlaceholder = Boolean(existingRawSeoTitle && !existingSeoTitle)
  const existingSeoDescriptionWasPlaceholder = Boolean(existingRawSeoDescription && !existingSeoDescription)
  const shouldMarkSeoManual =
    (hasIncomingSeoTitle && (incomingSeoTitle !== existingSeoTitle || existingSeoTitleWasPlaceholder)) ||
    (hasIncomingSeoDescription &&
      (incomingSeoDescription !== existingSeoDescription || existingSeoDescriptionWasPlaceholder))

  const manualSeoPatch = shouldMarkSeoManual
    ? {
        seoTitle: incomingSeoTitle || null,
        seoDescription: incomingSeoDescription || null,
        seoSource: 'manual' as const,
        seoGeneratedAt: null,
        seoModel: null,
        seoNeedsReview: false,
      }
    : {}

  const existingPublishedAt = readDate(existing?.publishedAt)
  if (!isAdminUser && existing?.status === 'published') {
    return NextResponse.json(
      {
        error:
          'Only admins can modify published articles. Ask an admin to update or approve changes.'
      },
      { status: 403 }
    )
  }

  const shouldRequestApproval = !isAdminUser && publishMode !== 'draft'
  const requestedPublishMode = publishMode === 'scheduled' ? 'scheduled' : 'publish'
  const requestedPublishAt = publishMode === 'scheduled' ? publishAt.value : null

  const nextStatus = shouldRequestApproval
    ? 'draft'
    : publishMode === 'scheduled'
      ? 'scheduled'
      : publishMode === 'publish'
        ? 'published'
        : 'draft'
  let nextPublishedAt: Date | null = existingPublishedAt
  let nextPublishAt: Date | null = null

  if (!shouldRequestApproval && publishMode === 'publish') {
    const shouldPreservePublishedAt = existing?.status === 'published' && existingPublishedAt
    nextPublishedAt = shouldPreservePublishedAt ? existingPublishedAt : new Date()
    if (!nextPublishedAt && publishDate.value) {
      nextPublishedAt = publishDate.value
    }
  }

  if (publishMode === 'draft' && !existingPublishedAt && publishDate.value) {
    nextPublishedAt = publishDate.value
  }

  if (!shouldRequestApproval && publishMode === 'scheduled') {
    if (!publishAt.value) {
      return NextResponse.json({ error: 'Scheduled publish date is required' }, { status: 400 })
    }

    if (publishAt.value.getTime() <= new Date().getTime()) {
      return NextResponse.json(
        { error: 'Scheduled publish date must be in the future' },
        { status: 400 },
      )
    }

    nextPublishAt = publishAt.value
  }

  const shouldCheckLinks = publishMode !== 'draft'
  if (shouldCheckLinks) {
    const linkCheck = await checkNewsLinks({
      content: normalizedContent,
      title,
      desc,
      img: heroImage,
      socialImage: openGraphImage || twitterImage || heroImage,
    })

    if (linkCheck.warnings.length > 0 && !forcePublish) {
      return NextResponse.json(
        {
          error: 'Broken links detected. Publish anyway.',
          warnings: linkCheck.warnings,
          checkedInternal: linkCheck.checkedInternal,
          checkedExternal: linkCheck.checkedExternal,
        },
        { status: 409 },
      )
    }
  }

  const dateSource = publishMode === 'draft'
    ? publishDate.value || nextPublishedAt || new Date()
    : nextPublishedAt || new Date()
  const date = formatDisplayDate(dateSource)
  const shouldCaptureAuthorSnapshot = nextStatus === 'published' || nextStatus === 'scheduled'
  const authorSnapshotPatch = shouldCaptureAuthorSnapshot
    ? {
        authorSnapshot: {
          name: authorName,
          img: authorImage,
          capturedAt: new Date()
        }
      }
      : {}
  const chapterSnapshotPatch = shouldCaptureAuthorSnapshot
    ? {
        chapterSnapshot: {
          primaryChapterSlug,
          chapterSlugs,
          capturedAt: new Date()
        }
      }
    : {}
  const pendingPublishPatch = shouldRequestApproval
    ? {
        pendingPublishRequest: {
          requestId: randomUUID(),
          baseRevision: nextRevisionValue,
          requestedAt: new Date(),
          requestedByUserId: access.userId,
          requestedByEmail: sessionUser?.email || null,
          requestedByName: sessionUser?.name || null,
          requestedMode: requestedPublishMode,
          requestedPublishAt: requestedPublishAt ?? null
        }
      }
    : { pendingPublishRequest: null }

  const saved = await NewsArticle.findOneAndUpdate(
    { slug },
    {
      $set: {
        slug,
        title,
        desc,
        tag,
        tags,
        img: heroImage,
        imageCaption,
        date,
        readTime,
        author: {
          name: authorName,
          img: authorImage,
        },
        authorUserId: authorIdentity.userId,
        primaryChapterSlug,
        chapterSlugs,
        sections,
        content: normalizedContent,
        status: nextStatus,
        revision: nextRevisionValue,
        publishedAt: nextPublishedAt,
        publishAt: nextPublishAt,
        openGraphTitle,
        openGraphDescription,
        openGraphImage,
        twitterTitle,
        twitterDescription,
        twitterImage,
        editorSettings,
        ...(pendingPublishPatch as Record<string, unknown>),
        lastRejection: null,
        ...(authorSnapshotPatch as Record<string, unknown>),
        ...(chapterSnapshotPatch as Record<string, unknown>),
        ...(manualSeoPatch as Record<string, unknown>),
      },
    },
    {
      new: true,
      upsert: true,
      // Manual articles should not inherit legacy import defaults like sourcePostId on insert.
      setDefaultsOnInsert: false,
    },
  )
    .lean() as
    | ({
        _id: string
        slug: string
        title: string
        status: NewsArticleStatus
        desc: string
        tag: string
        img: string
        date: string
        readTime: string
        imageCaption?: string
        author?: { name: string; img: string }
        primaryChapterSlug?: string
        chapterSlugs?: string[]
        chapterSnapshot?: {
          primaryChapterSlug?: string
          chapterSlugs?: string[]
          capturedAt?: Date | null
        } | null
        sections?: unknown[]
        content?: unknown
        publishedAt: Date | null
        publishAt: Date | null
        openGraphTitle?: string
        openGraphDescription?: string
        openGraphImage?: string
        twitterTitle?: string
        twitterDescription?: string
        twitterImage?: string
      } | null)

  if (!saved) {
    return NextResponse.json({ error: 'Unable to save article' }, { status: 500 })
  }

  await saveNewsArticleSnapshot({
    article: saved,
    actorUserId: access.userId,
  })

  if (shouldRequestApproval) {
    await logAudit({
      action: 'news.article.publish.request',
      actorUserId: access.userId,
      metadata: {
        slug,
        title,
        primaryChapterSlug,
        requestedMode: requestedPublishMode,
        requestedPublishAt: requestedPublishAt ? requestedPublishAt.toISOString() : null
      }
    })
  }

  revalidatePath('/')
  revalidatePath('/news')
  revalidatePath(`/news/${slug}`)
  revalidateTag(newsTags.content)
  revalidateTag(newsTags.list)
  revalidateTag(newsTags.cards)
  revalidateTag(newsTags.article(slug))

  return NextResponse.json({ ok: true, slug, pendingApproval: shouldRequestApproval })
}
