import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { enrichSupportTicketsWithIdentities } from '@/lib/support/portal-identities';
import { getSupportOverview } from '@/lib/support/tickets';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const overview = await getSupportOverview();
  const recentTickets = await enrichSupportTicketsWithIdentities(overview.recentTickets);
  return NextResponse.json({
    ...overview,
    recentTickets
  });
}
