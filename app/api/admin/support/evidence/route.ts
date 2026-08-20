import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { buildSupportEvidenceCsv } from '@/lib/support/export';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { getSupportTicketThread, listSupportTickets } from '@/lib/support/tickets';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const ticketId = clean(url.searchParams.get('ticketId'));
  const requesterEmail = normalizeEmail(url.searchParams.get('requesterEmail'));
  const requesterUserId = clean(url.searchParams.get('requesterUserId'));
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 80)));

  if (!ticketId && !requesterEmail && !requesterUserId) {
    return NextResponse.json(
      { error: 'Provide at least one filter: ticketId, requesterEmail, or requesterUserId' },
      { status: 400 }
    );
  }

  let ticketIds: string[] = [];
  if (ticketId) {
    ticketIds = [ticketId];
  } else {
    let items = await listSupportTickets({ statusGroup: 'all', limit: Math.max(limit * 4, 80) });
    if (requesterEmail) {
      items = items.filter((item) => normalizeEmail(item.createdByEmail) === requesterEmail);
    }
    if (requesterUserId) {
      items = items.filter((item) => item.createdByUserId === requesterUserId);
    }
    ticketIds = items.slice(0, limit).map((item) => item.id);
  }

  const threads = (
    await Promise.all(ticketIds.map((id) => getSupportTicketThread(id)))
  ).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const csv = buildSupportEvidenceCsv(threads);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="support-evidence-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
