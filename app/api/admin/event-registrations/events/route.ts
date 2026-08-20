import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { listEventOutreachEvents } from '@/lib/event-registration/registrations';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 200)));
  const items = await listEventOutreachEvents(limit);
  return NextResponse.json({ items });
}
