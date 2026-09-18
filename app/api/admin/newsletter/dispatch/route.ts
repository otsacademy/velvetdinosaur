import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { dispatchQueuedNewsletterCampaigns } from '@/lib/newsletter/campaigns';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { assertNewsletterSendingAllowed } from '@/lib/newsletter/send-policy';

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try { assertNewsletterSendingAllowed(); } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
  try {
    // Bounded request. The scheduler continues remaining batches using atomic claims.
    return NextResponse.json(await dispatchQueuedNewsletterCampaigns({ maxCampaigns: 5, batchSizePerCampaign: 80 }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dispatch preparation failed' }, { status: 400 });
  }
}
