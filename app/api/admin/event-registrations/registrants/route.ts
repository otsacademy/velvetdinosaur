import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { listEventRegistrations } from '@/lib/event-registration/registrations';
import { EVENT_REGISTRATION_STATUSES, clean } from '@/lib/event-registration/shared';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';

const REGISTRATION_STATUSES = new Set([...EVENT_REGISTRATION_STATUSES, 'all']);

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const eventId = clean(url.searchParams.get('eventId')) || null;
  const statusRaw = clean(url.searchParams.get('status')) || 'all';
  const status = REGISTRATION_STATUSES.has(statusRaw) ? statusRaw : 'all';
  const q = clean(url.searchParams.get('q')) || null;
  const limit = Math.max(1, Math.min(1000, Number(url.searchParams.get('limit') || 250)));

  const items = await listEventRegistrations({
    eventId,
    status: status as 'all' | 'pending' | 'confirmed' | 'cancelled',
    q,
    limit
  });

  return NextResponse.json({ items });
}
