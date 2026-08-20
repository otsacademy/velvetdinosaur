import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SUPPORT_TICKET_STATUSES, SUPPORT_WAITING_ON } from '@/lib/support/constants';
import { requireAdminFromHeaders, requireSupportAgent } from '@/lib/support/auth';
import { updateSupportTicketStatus } from '@/lib/support/tickets';

const UpdateStatusSchema = z.object({
  status: z.enum(SUPPORT_TICKET_STATUSES),
  waitingOn: z.enum(SUPPORT_WAITING_ON).optional(),
  note: z.string().trim().max(400).optional()
});

const SUPPORT_AGENT_ONLY_STATUSES = new Set([
  'in_configuration',
  'pre_development',
  'development_list',
  'report_new_update',
  'second_line_support',
  'uat',
  'setup',
  'future_release'
]);

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (SUPPORT_AGENT_ONLY_STATUSES.has(parsed.data.status) && !requireSupportAgent(admin)) {
    return NextResponse.json({ error: 'Only support agents can apply this status' }, { status: 403 });
  }

  const id = (await params).id;
  const item = await updateSupportTicketStatus({
    ticketId: id,
    actorUserId: admin.id,
    actorEmail: admin.email,
    actorName: admin.name,
    actorRole: admin.actorRole,
    status: parsed.data.status,
    waitingOn: parsed.data.waitingOn,
    note: parsed.data.note
  });

  if (!item) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  return NextResponse.json({ item });
}
