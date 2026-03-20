import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { logAudit } from '@/lib/audit'
import { requireWorkArticleWriteAccess } from '@/lib/work-article-access'
import { connectDB } from '@/lib/db'
import { isAdminOnly } from '@/lib/site-config'
import { WorkArticle } from '@/models/WorkArticle'

function normalizeSlug(slug: string) {
  try {
    return decodeURIComponent(slug).trim().toLowerCase()
  } catch {
    return slug.trim().toLowerCase()
  }
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

  const resolved = await params
  const slug = normalizeSlug(resolved.slug || '')

  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const conn = await connectDB()
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const existing = await WorkArticle.findOne({ slug })
    .select({ _id: 1, slug: 1, title: 1, status: 1, publishedAt: 1 })
    .lean()

  if (!existing || Array.isArray(existing)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await WorkArticle.updateOne({ _id: existing._id }, { $set: { status: 'draft' } }).exec()

  await logAudit({
    action: 'work.article.unpublish',
    actorUserId: access.userId,
    metadata: {
      slug,
      title: existing.title || null,
      previousStatus: existing.status || null,
      previousPublishedAt: existing.publishedAt || null,
    },
  })

  revalidatePath('/work')
  revalidatePath('/')
  revalidatePath(`/work/${slug}`)

  return NextResponse.json({ ok: true, slug })
}
