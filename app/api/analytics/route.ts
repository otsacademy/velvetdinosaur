import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { SiteAnalyticsEventSchema } from '@/lib/analytics/schema';
import { forwardAnalyticsEvent } from '@/lib/analytics/server';

export async function POST(request: Request) {
  unstable_noStore();
  const body = await request.json().catch(() => null);
  const parsed = SiteAnalyticsEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Invalid analytics payload.' }, { status: 400 });
  }

  await forwardAnalyticsEvent(request, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
