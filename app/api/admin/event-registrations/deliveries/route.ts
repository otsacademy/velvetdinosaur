import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { listEventRegistrationDeliveries } from '@/lib/event-registration/campaigns';
import { EVENT_DELIVERY_STATUSES, clean } from '@/lib/event-registration/shared';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';

const DELIVERY_STATUSES = new Set([...EVENT_DELIVERY_STATUSES, 'all']);

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const eventId = clean(url.searchParams.get('eventId')) || null;
  const campaignId = clean(url.searchParams.get('campaignId')) || null;
  const statusRaw = clean(url.searchParams.get('status')) || 'all';
  const status = DELIVERY_STATUSES.has(statusRaw) ? statusRaw : 'all';
  const q = clean(url.searchParams.get('q')) || null;
  const limit = Math.max(1, Math.min(2000, Number(url.searchParams.get('limit') || 400)));

  const items = await listEventRegistrationDeliveries({
    eventId,
    campaignId,
    status: status as 'all' | 'pending' | 'sent' | 'failed' | 'skipped_unconfirmed',
    q,
    limit
  });

  return NextResponse.json({ items });
}
