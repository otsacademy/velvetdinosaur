import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate'
import { newsTags } from '@/lib/cache-tags'
import { isAdminOnly } from '@/lib/site-config'
import { connectDB } from '@/lib/db'
import { requireNewsArticleWriteAccess } from '@/lib/news-article-access'
import { restoreNewsArticleSnapshot, listNewsArticleSnapshots } from '@/lib/news-article-history.server'

function normalizeSlug(slug: string) {
  try {
    return decodeURIComponent(slug).trim().toLowerCase()
  } catch {
    return slug.trim().toLowerCase()
  }
}

function parseSnapshotId(value: string) {
  const raw = value.trim()
  return raw || null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const access = await requireNewsArticleWriteAccess(request)
  if (!access.ok) {
    return access.response
  }

  const resolvedParams = await params
  const slug = normalizeSlug(resolvedParams.slug)

  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const conn = await connectDB()
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const items = await listNewsArticleSnapshots(slug)
  return NextResponse.json({ items })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const access = await requireNewsArticleWriteAccess(request)
  if (!access.ok) {
    return access.response
  }

  const resolvedParams = await params
  const slug = normalizeSlug(resolvedParams.slug)
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const payload = await request.json().catch(() => ({}))
  const snapshotId = parseSnapshotId(typeof payload?.snapshotId === 'string' ? payload.snapshotId : '')
  if (!snapshotId) {
    return NextResponse.json({ error: 'Missing snapshot id' }, { status: 400 })
  }

  const conn = await connectDB()
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const result = await restoreNewsArticleSnapshot(slug, snapshotId)
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 })
  }

  const article = result.ok ? result.article : undefined

  revalidatePath('/')
  revalidatePath('/news')
  revalidatePath(`/news/${slug}`)
  revalidateTag(newsTags.content)
  revalidateTag(newsTags.list)
  revalidateTag(newsTags.cards)
  revalidateTag(newsTags.article(slug))

  return NextResponse.json({ ok: true, slug: result.slug, article })
}
