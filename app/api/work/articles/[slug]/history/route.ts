import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { isAdminOnly } from '@/lib/site-config'
import { connectDB } from '@/lib/db'
import { requireWorkArticleWriteAccess } from '@/lib/work-article-access'
import { restoreWorkArticleSnapshot, listWorkArticleSnapshots } from '@/lib/work-article-history.server'

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

  const access = await requireWorkArticleWriteAccess(request)
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

  const items = await listWorkArticleSnapshots(slug)
  return NextResponse.json({ items })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const access = await requireWorkArticleWriteAccess(request)
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

  const result = await restoreWorkArticleSnapshot(slug, snapshotId)
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 })
  }

  const article = result.ok ? result.article : undefined

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath(`/work/${slug}`)

  return NextResponse.json({ ok: true, slug: result.slug, article })
}
