import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { listNewsletterDeliveries } from '@/lib/newsletter/campaigns';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { clean } from '@/lib/newsletter/shared';

const DELIVERY_STATUSES = new Set([
  'pending',
  'sent',
  'failed',
  'skipped_no_consent',
  'skipped_unsubscribed',
  'skipped_suppressed',
  'all'
]);

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const campaignId = clean(url.searchParams.get('campaignId')) || null;
  const statusRaw = clean(url.searchParams.get('status')) || 'all';
  const status = DELIVERY_STATUSES.has(statusRaw) ? statusRaw : 'all';
  const q = clean(url.searchParams.get('q')) || null;
  const limit = Math.max(1, Math.min(2000, Number(url.searchParams.get('limit') || 250)));

  const items = await listNewsletterDeliveries({
    campaignId,
    status: status as
      | 'all'
      | 'pending'
      | 'sent'
      | 'failed'
      | 'skipped_no_consent'
      | 'skipped_unsubscribed'
      | 'skipped_suppressed',
    q,
    limit
  });

  return NextResponse.json({ items });
}
