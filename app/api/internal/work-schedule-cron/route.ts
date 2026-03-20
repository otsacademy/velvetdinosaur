import { unstable_noStore } from 'next/cache'
import { NextResponse } from 'next/server'

import { publishScheduledWorkArticles } from '@/lib/work/scheduled-publishing.server'

function extractCronSecret(request: Request) {
  const direct = request.headers.get('x-cron-secret')
  if (direct) return direct.trim()
  const authorization = request.headers.get('authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  return match ? match[1].trim() : ''
}

function isAuthorized(request: Request) {
  const expected = (process.env.CRON_SECRET || '').trim()
  if (!expected) return false
  const received = extractCronSecret(request)
  return Boolean(received) && received === expected
}

export async function POST(request: Request) {
  unstable_noStore()

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const summary = await publishScheduledWorkArticles(new Date(), { dryRun: false })
  return NextResponse.json(summary)
}
