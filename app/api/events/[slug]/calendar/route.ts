import { NextResponse } from 'next/server'

import { normalizeEventSlug } from '@/lib/events'
import { createEventIcs } from '@/lib/event-calendar'
import { getPublishedEventBySlug } from '@/lib/events.server'

type CalendarRouteParams = {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, { params }: CalendarRouteParams) {
  const resolved = await params
  const slug = normalizeEventSlug(resolved.slug || '')
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const event = await getPublishedEventBySlug(slug)
  if (!event) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const origin = new URL(request.url).origin
  const eventUrl = `${origin}/events/${encodeURIComponent(event.slug)}`
  const ics = createEventIcs({ ...event, eventUrl })
  if (!ics) {
    return NextResponse.json({ error: 'Unable to generate calendar file' }, { status: 400 })
  }

  return new NextResponse(ics.content, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${ics.filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
