import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { dispatchQueuedEventRegistrationCampaigns } from '@/lib/event-registration/campaigns';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const batchSize = 300;
  const maxPasses = 25;
  const byCampaign = new Map<string, { campaignId: string; sent: number; failed: number; skipped: number; pending: number }>();
  const totals = {
    processedCampaigns: 0,
    sent: 0,
    failed: 0,
    skipped: 0
  };

  let passes = 0;
  for (; passes < maxPasses; ) {
    passes += 1;
    const summary = await dispatchQueuedEventRegistrationCampaigns({ batchSize });
    totals.processedCampaigns += summary.processedCampaigns;
    totals.sent += summary.sent;
    totals.failed += summary.failed;
    totals.skipped += summary.skipped;

    for (const item of summary.results) {
      const existing = byCampaign.get(item.campaignId);
      if (existing) {
        existing.sent += item.sent;
        existing.failed += item.failed;
        existing.skipped += item.skipped;
        existing.pending = item.pending;
      } else {
        byCampaign.set(item.campaignId, { ...item });
      }
    }

    const hasPending = summary.results.some((item) => item.pending > 0);
    if (!hasPending || summary.processedCampaigns === 0) break;
  }

  return NextResponse.json({
    ...totals,
    passes,
    drained: Array.from(byCampaign.values()).every((item) => item.pending === 0),
    results: Array.from(byCampaign.values())
  });
}
