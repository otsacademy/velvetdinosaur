import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { connectDB } from '@/lib/db'
import { normalizeEventSlug } from '@/lib/events'
import { requireNewsArticleWriteAccess } from '@/lib/news-article-access'
import { isAdminOnly } from '@/lib/site-config'
import { Event } from '@/models/Event'

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const access = await requireNewsArticleWriteAccess(request)
  if (!access.ok) {
    return access.response
  }

  const resolved = await params
  const slug = normalizeEventSlug(resolved.slug || '')
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const conn = await connectDB()
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const deleted = await Event.findOneAndDelete({ slug }).select({ _id: 1, slug: 1 }).lean().exec()
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  revalidatePath('/events')
  revalidatePath(`/events/${slug}`)

  return NextResponse.json({ ok: true, slug })
}
