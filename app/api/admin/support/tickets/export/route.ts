import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_WAITING_ON
} from '@/lib/support/constants';
import { buildSupportTicketsCsv, buildSupportTicketsExcelXml, buildSupportTicketsPdf } from '@/lib/support/export';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { getSupportTicketById, listSupportTickets } from '@/lib/support/tickets';

const StatusGroupSchema = z.enum(['all', 'open', 'closed']);
const StatusFilterSchema = z.enum(['all', ...SUPPORT_TICKET_STATUSES]);
const CategoryFilterSchema = z.enum(['all', ...SUPPORT_TICKET_CATEGORIES.map((item) => item.key)]);
const WaitingOnFilterSchema = z.enum(['all', ...SUPPORT_WAITING_ON]);
const ExportFormatSchema = z.enum(['csv', 'excel', 'pdf', 'json']);

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
  const parsedFormat = ExportFormatSchema.safeParse((clean(url.searchParams.get('format')) || 'csv').toLowerCase());
  const format = parsedFormat.success ? parsedFormat.data : 'csv';

  const ticketId = clean(url.searchParams.get('ticketId'));
  const requesterEmail = normalizeEmail(url.searchParams.get('requesterEmail'));
  const requesterUserId = clean(url.searchParams.get('requesterUserId'));
  const statusGroup = StatusGroupSchema.safeParse(url.searchParams.get('statusGroup') || 'all');
  const status = StatusFilterSchema.safeParse(url.searchParams.get('status') || 'all');
  const category = CategoryFilterSchema.safeParse(url.searchParams.get('category') || 'all');
  const waitingOn = WaitingOnFilterSchema.safeParse(url.searchParams.get('waitingOn') || 'all');
  const q = clean(url.searchParams.get('q'));

  const maxLimit = format === 'pdf' ? 600 : 5000;
  const limit = Math.max(1, Math.min(maxLimit, Number(url.searchParams.get('limit') || 1000)));

  let items: Awaited<ReturnType<typeof listSupportTickets>> = [];
  if (ticketId) {
    const detail = await getSupportTicketById(ticketId);
    if (!detail) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    items = [detail];
  } else {
    items = await listSupportTickets({
      statusGroup: statusGroup.success ? statusGroup.data : 'all',
      status: status.success ? status.data : 'all',
      category: category.success ? category.data : 'all',
      waitingOn: waitingOn.success ? waitingOn.data : 'all',
      q,
      limit
    });
  }

  if (requesterEmail) {
    items = items.filter((item) => normalizeEmail(item.createdByEmail) === requesterEmail);
  }
  if (requesterUserId) {
    items = items.filter((item) => item.createdByUserId === requesterUserId);
  }

  if (format === 'json') {
    return NextResponse.json({ items });
  }

  const datePart = new Date().toISOString().slice(0, 10);

  if (format === 'excel') {
    const xml = buildSupportTicketsExcelXml(items);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'content-type': 'application/vnd.ms-excel; charset=utf-8',
        'content-disposition': `attachment; filename="support-tickets-${datePart}.xls"`
      }
    });
  }

  if (format === 'pdf') {
    const pdf = await buildSupportTicketsPdf(items);
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="support-tickets-${datePart}.pdf"`
      }
    });
  }

  const csv = buildSupportTicketsCsv(items);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="support-tickets-${datePart}.csv"`
    }
  });
}
