import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate'
import { newsTags } from '@/lib/cache-tags'
import { logAudit } from '@/lib/audit'
import { requireNewsArticleWriteAccess } from '@/lib/news-article-access'
import { connectDB } from '@/lib/db'
import { isAdminOnly } from '@/lib/site-config'
import { NewsArticle } from '@/models/NewsArticle'

function normalizeSlug(slug: string) {
  try {
    return decodeURIComponent(slug).trim().toLowerCase()
  } catch {
    return slug.trim().toLowerCase()
  }
}

export async function DELETE(
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

  const resolved = await params
  const slug = normalizeSlug(resolved.slug || '')

  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const conn = await connectDB()
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const deleted = await NewsArticle.findOneAndDelete({ slug })
    .select({ _id: 1, slug: 1, title: 1, status: 1, publishedAt: 1 })
    .lean()

  if (!deleted || Array.isArray(deleted)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await logAudit({
    action: 'news.article.delete',
    actorUserId: access.userId,
    metadata: {
      slug,
      title: deleted.title || null,
      previousStatus: deleted.status || null,
      previousPublishedAt: deleted.publishedAt || null,
    },
  })

  revalidatePath('/news')
  revalidatePath('/')
  revalidatePath(`/news/${slug}`)
  revalidateTag(newsTags.content)
  revalidateTag(newsTags.list)
  revalidateTag(newsTags.cards)
  revalidateTag(newsTags.article(slug))

  return NextResponse.json({ ok: true, slug })
}
