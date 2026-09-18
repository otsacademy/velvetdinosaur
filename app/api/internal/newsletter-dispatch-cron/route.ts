import { timingSafeEqual } from 'node:crypto';
import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { NewsletterDelivery } from '@/models/NewsletterDelivery';
import { dispatchQueuedNewsletterCampaigns } from '@/lib/newsletter/campaigns';
import { assertNewsletterSendingAllowed } from '@/lib/newsletter/send-policy';

export async function POST(request: Request) {
  unstable_noStore();
  const expected = Buffer.from((process.env.CRON_SECRET || '').trim());
  const supplied = Buffer.from((request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '').trim());
  if (!expected.length || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  // Missing or malformed dryRun never enables real dispatch.
  if (!body || typeof body !== 'object' || body.dryRun !== false) {
    await requireNewsletterDatabase();
    const [dueCampaigns, queuedCampaigns, sendingCampaigns, pendingDeliveries, processingDeliveries, needsReviewDeliveries] = await Promise.all([
      NewsletterCampaign.countDocuments({ status: { $in: ['queued', 'sending'] }, $or: [{ scheduledAt: null }, { scheduledAt: { $lte: new Date() } }] }),
      NewsletterCampaign.countDocuments({ status: 'queued' }), NewsletterCampaign.countDocuments({ status: 'sending' }),
      NewsletterDelivery.countDocuments({ status: 'pending' }), NewsletterDelivery.countDocuments({ status: 'processing' }), NewsletterDelivery.countDocuments({ status: 'needs_review' })
    ]);
    return NextResponse.json({ dryRun: true, dueCampaigns, queuedCampaigns, sendingCampaigns, pendingDeliveries, processingDeliveries, needsReviewDeliveries });
  }
  try { assertNewsletterSendingAllowed(); } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
  try {
    return NextResponse.json({ dryRun: false, ...await dispatchQueuedNewsletterCampaigns({ maxCampaigns: 25, batchSizePerCampaign: 80 }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dispatch failed' }, { status: 400 });
  }
}
