import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSupportPriority,
  isSupportTicketCategory,
  isSupportTicketModule,
  type SupportTicketCategory
} from '@/lib/support/constants';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { enrichSupportThreadWithIdentities } from '@/lib/support/portal-identities';
import { getSupportTicketThread, updateSupportTicketMetadata } from '@/lib/support/tickets';

const UpdateTicketSchema = z
  .object({
    organization: z.string().trim().min(1).max(160).optional(),
    subject: z.string().trim().min(1).max(220).optional(),
    category: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || isSupportTicketCategory(value), { message: 'Invalid category' }),
    module: z
      .string()
      .trim()
      .max(120)
      .optional()
      .refine((value) => !value || isSupportTicketModule(value), { message: 'Invalid module' }),
    priority: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || isSupportPriority(value), { message: 'Invalid priority' }),
    requestedDate: z.union([z.string().trim(), z.null()]).optional(),
    caseRefs: z.array(z.string().trim().max(80)).max(200).optional(),
    pageUrl: z.string().trim().max(500).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
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
  const thread = await getSupportTicketThread(id);
  if (!thread) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  const enrichedThread = await enrichSupportThreadWithIdentities(thread);
  return NextResponse.json(enrichedThread);
}

export async function PATCH(request: Request, { params }: Params) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const id = (await params).id;
  const item = await updateSupportTicketMetadata({
    ticketId: id,
    actorUserId: admin.id,
    actorEmail: admin.email,
    actorName: admin.name,
    actorRole: admin.actorRole,
    organization: parsed.data.organization,
    subject: parsed.data.subject,
    category: parsed.data.category as SupportTicketCategory | undefined,
    module: parsed.data.module,
    priority: parsed.data.priority,
    requestedDate: parsed.data.requestedDate ?? undefined,
    caseRefs: parsed.data.caseRefs,
    pageUrl: parsed.data.pageUrl
  });

  if (!item) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  return NextResponse.json({ item });
}
