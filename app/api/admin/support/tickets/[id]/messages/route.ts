import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { addSupportTicketMessage, getSupportTicketById, listSupportTicketMessages } from '@/lib/support/tickets';

const MessageSchema = z.object({
  bodyHtml: z.string().max(120000).optional(),
  bodyText: z.string().trim().min(1).max(120000),
  isInternal: z.boolean().optional(),
  attachments: z
    .array(
      z.object({
        key: z.string().trim().max(400).optional(),
        name: z.string().trim().max(200).optional(),
        url: z.string().trim().max(1500),
        mime: z.string().trim().max(120).optional(),
        size: z.number().int().min(0).max(500_000_000).optional()
      })
    )
    .max(20)
    .optional()
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = (await params).id;
  const [ticket, items] = await Promise.all([getSupportTicketById(id), listSupportTicketMessages(id, 600)]);
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  return NextResponse.json({ items });
}

export async function POST(request: Request, { params }: Params) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = MessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const id = (await params).id;
  const item = await addSupportTicketMessage({
    ticketId: id,
    actorUserId: admin.id,
    actorEmail: admin.email,
    actorName: admin.name,
    actorRole: admin.actorRole,
    bodyHtml: parsed.data.bodyHtml,
    bodyText: parsed.data.bodyText,
    isInternal: parsed.data.isInternal,
    attachments: parsed.data.attachments?.map((entry) => ({
      key: entry.key || '',
      name: entry.name || '',
      url: entry.url,
      mime: entry.mime || '',
      size: Number.isFinite(Number(entry.size)) ? Number(entry.size) : null
    }))
  });

  if (!item) {
    return NextResponse.json({ error: 'Ticket not found or message is empty' }, { status: 404 });
  }
  return NextResponse.json({ item }, { status: 201 });
}
