import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import {
  getNewsletterCampaignComposerDefaults,
  listNewsletterCampaigns
} from '@/lib/newsletter/campaigns';
import {
  ensureNewsletterPreferencesForRegisteredUsers,
  getNewsletterPreferenceCounts
} from '@/lib/newsletter/consent';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { getNewsletterSuppressionCounts } from '@/lib/newsletter/suppression';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureNewsletterPreferencesForRegisteredUsers(10000);
  const [counts, campaigns, defaults, suppressions] = await Promise.all([
    getNewsletterPreferenceCounts(),
    listNewsletterCampaigns(30),
    getNewsletterCampaignComposerDefaults(),
    getNewsletterSuppressionCounts()
  ]);
  const statusCounts = {
      draft: 0,
      queued: 0,
      sending: 0,
      completed: 0,
      cancelled: 0
  };
  for (const campaign of campaigns) {
    statusCounts[campaign.status] += 1;
  }

  return NextResponse.json({
    counts: {
      ...counts,
      suppressed: suppressions.active
    },
    campaignStatus: statusCounts,
    recentCampaigns: campaigns.slice(0, 10),
    defaults
  });
}
