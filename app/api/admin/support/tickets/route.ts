import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSupportPriority,
  supportCategoryLabel,
  supportModuleLabel,
  supportPriorityLabel,
  isSupportTicketCategory,
  isSupportTicketModule,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_WAITING_ON,
  type SupportTicketCategory
} from '@/lib/support/constants';
import { resolveConfiguredSiteOrigin } from '@/lib/request-origin';
import { requireAdminFromHeaders, requireSupportUserFromHeaders } from '@/lib/support/auth';
import { forwardSupportTicketToDesigner } from '@/lib/support/forwarding';
import { sendSupportTicketCreatedNotification } from '@/lib/support/notifications';
import { enrichSupportTicketsWithIdentities } from '@/lib/support/portal-identities';
import { createSupportTicket, listSupportTickets } from '@/lib/support/tickets';

const CreateTicketSchema = z.object({
  subject: z.string().trim().min(1).max(220),
  category: z.string().trim().refine((value) => isSupportTicketCategory(value), {
    message: 'Invalid category'
  }),
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
  requestedDate: z.string().trim().optional(),
  pageUrl: z.string().trim().max(500).optional(),
  descriptionHtml: z.string().max(120000).optional(),
  descriptionText: z.string().trim().min(1).max(120000)
});

const StatusGroupSchema = z.enum(['all', 'open', 'closed']);
const StatusFilterSchema = z.enum(['all', ...SUPPORT_TICKET_STATUSES]);
const CategoryFilterSchema = z.enum(['all', ...SUPPORT_TICKET_CATEGORIES.map((item) => item.key)]);
const WaitingOnFilterSchema = z.enum(['all', ...SUPPORT_WAITING_ON]);

function resolveTicketOrganization(request: Request) {
  const configured = resolveConfiguredSiteOrigin(request.url);
  if (configured) return configured;
  return 'Website';
}

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusGroup = StatusGroupSchema.safeParse(url.searchParams.get('statusGroup') || 'open');
  const status = StatusFilterSchema.safeParse(url.searchParams.get('status') || 'all');
  const category = CategoryFilterSchema.safeParse(url.searchParams.get('category') || 'all');
  const waitingOn = WaitingOnFilterSchema.safeParse(url.searchParams.get('waitingOn') || 'all');
  const q = String(url.searchParams.get('q') || '').trim();
  const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 120)));

  const items = await listSupportTickets({
    statusGroup: statusGroup.success ? statusGroup.data : 'open',
    status: status.success ? status.data : 'all',
    category: category.success ? category.data : 'all',
    waitingOn: waitingOn.success ? waitingOn.data : 'all',
    q,
    limit
  });
  const enrichedItems = await enrichSupportTicketsWithIdentities(items);
  return NextResponse.json({ items: enrichedItems });
}

export async function POST(request: Request) {
  unstable_noStore();
  const user = await requireSupportUserFromHeaders(request.headers);
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const created = await createSupportTicket({
    createdByUserId: user.id,
    createdByEmail: user.email,
    createdByName: user.name,
    actorRole: user.actorRole,
    organization: resolveTicketOrganization(request),
    subject: parsed.data.subject,
    category: parsed.data.category as SupportTicketCategory,
    module: parsed.data.module,
    priority: parsed.data.priority,
    requestedDate: parsed.data.requestedDate,
    pageUrl: parsed.data.pageUrl,
    descriptionHtml: parsed.data.descriptionHtml,
    descriptionText: parsed.data.descriptionText
  });

  if (!created) {
    return NextResponse.json({ error: 'Unable to create ticket' }, { status: 500 });
  }

  const portalBase = resolveTicketOrganization(request);
  const portalUrl = `${portalBase}/account/support`;
  void Promise.allSettled([
    sendSupportTicketCreatedNotification({
      ticketRef: created.ticketRef,
      organization: created.organization,
      subject: created.subject,
      categoryLabel: supportCategoryLabel(created.category),
      priorityLabel: supportPriorityLabel(created.priority),
      moduleLabel: supportModuleLabel(created.module),
      requestedDate: created.requestedDate,
      pageUrl: created.pageUrl,
      descriptionText: parsed.data.descriptionText,
      requesterName: user.name,
      requesterEmail: user.email,
      portalUrl
    }),
    forwardSupportTicketToDesigner({
      ticketId: created.id,
      ticketRef: created.ticketRef,
      organization: created.organization,
      subject: created.subject,
      category: created.category,
      module: created.module,
      priority: created.priority,
      requestedDate: created.requestedDate,
      pageUrl: created.pageUrl,
      descriptionText: parsed.data.descriptionText,
      requester: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      source: {
        siteOrigin: portalBase,
        portalUrl
      }
    })
  ]);

  return NextResponse.json({ item: created }, { status: 201 });
}
