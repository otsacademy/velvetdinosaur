import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendSupportTicketSystemUpdateEmail } from '@/lib/email/support-ticket-system-update-email';
import { SUPPORT_TICKET_STATUSES, SUPPORT_WAITING_ON } from '@/lib/support/constants';
import { addSupportTicketMessage, getSupportTicketById, submitSupportTicketRating, updateSupportTicketStatus } from '@/lib/support/tickets';

const MessageOperationSchema = z.object({
  operation: z.literal('message_added'),
  ticketId: z.string().trim().min(1),
  payload: z.object({
    bodyHtml: z.string().max(120000).optional(),
    bodyText: z.string().trim().min(1).max(120000),
    isInternal: z.boolean().optional(),
    attachments: z
      .array(
        z.object({
          key: z.string().trim().max(400).optional(),
          name: z.string().trim().max(200).optional(),
          url: z.string().trim().max(1500).optional(),
          mime: z.string().trim().max(120).optional(),
          size: z.number().int().min(0).max(500_000_000).optional()
        })
      )
      .max(20)
      .optional(),
    actor: z
      .object({
        id: z.string().trim().max(160).optional(),
        email: z.string().trim().max(320).optional(),
        name: z.string().trim().max(160).optional()
      })
      .optional()
  })
});

const StatusOperationSchema = z.object({
  operation: z.literal('status_updated'),
  ticketId: z.string().trim().min(1),
  payload: z.object({
    status: z.enum(SUPPORT_TICKET_STATUSES),
    waitingOn: z.enum(SUPPORT_WAITING_ON).optional(),
    note: z.string().trim().max(400).optional(),
    actor: z
      .object({
        id: z.string().trim().max(160).optional(),
        email: z.string().trim().max(320).optional(),
        name: z.string().trim().max(160).optional()
      })
      .optional()
  })
});

const RatingOperationSchema = z.object({
  operation: z.literal('rating_submitted'),
  ticketId: z.string().trim().min(1),
  payload: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
    actor: z
      .object({
        id: z.string().trim().max(160).optional(),
        email: z.string().trim().max(320).optional(),
        name: z.string().trim().max(160).optional()
      })
      .optional()
  })
});

const SyncOperationSchema = z.union([MessageOperationSchema, StatusOperationSchema, RatingOperationSchema]);

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readSyncKey(headers: Headers) {
  const direct = clean(headers.get('x-vd-support-sync-key'));
  if (direct) return direct;

  const xApi = clean(headers.get('x-api-key'));
  if (xApi) return xApi;

  const auth = clean(headers.get('authorization'));
  if (auth.toLowerCase().startsWith('bearer ')) {
    return clean(auth.slice(7));
  }

  return '';
}

function isHttpsRequest(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim().toLowerCase() === 'https';
  }
  return new URL(request.url).protocol === 'https:';
}

function resolveActor(payload: { id?: string; email?: string; name?: string } | undefined) {
  return {
    id: clean(payload?.id) || 'central-support-sync',
    email: clean(payload?.email) || 'central-support-sync@local',
    name: clean(payload?.name),
    role: 'system' as const
  };
}

export async function POST(request: Request) {
  unstable_noStore();
  if (!isHttpsRequest(request)) {
    return NextResponse.json({ error: 'HTTPS required' }, { status: 400 });
  }

  const expectedKey = clean(process.env.VD_SUPPORT_SYNC_API_KEY);
  if (!expectedKey) {
    return NextResponse.json({ error: 'Support sync key not configured' }, { status: 500 });
  }

  const providedKey = readSyncKey(request.headers);
  if (!providedKey || providedKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SyncOperationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid sync payload' }, { status: 400 });
  }

  const operation = parsed.data;

  if (operation.operation === 'message_added') {
    const actor = resolveActor(operation.payload.actor);
    const item = await addSupportTicketMessage({
      ticketId: operation.ticketId,
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      bodyHtml: operation.payload.bodyHtml,
      bodyText: operation.payload.bodyText,
      isInternal: Boolean(operation.payload.isInternal),
      attachments: (operation.payload.attachments || []).map((entry) => ({
        key: entry.key || '',
        name: entry.name || '',
        url: entry.url || '',
        mime: entry.mime || '',
        size: Number.isFinite(Number(entry.size)) ? Number(entry.size) : null
      }))
    });

    if (!item) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!operation.payload.isInternal && actor.role === 'system') {
      try {
        const ticket = await getSupportTicketById(operation.ticketId);
        if (ticket) {
          await sendSupportTicketSystemUpdateEmail({
            ticketId: ticket.id,
            ticketRef: ticket.ticketRef,
            ticketSubject: ticket.subject,
            messageText: operation.payload.bodyText
          });
        }
      } catch (error) {
        console.error('[support-sync] admin update email failed', error);
      }
    }

    return NextResponse.json({ ok: true, operation: operation.operation, item });
  }

  if (operation.operation === 'status_updated') {
    const actor = resolveActor(operation.payload.actor);
    const item = await updateSupportTicketStatus({
      ticketId: operation.ticketId,
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      status: operation.payload.status,
      waitingOn: operation.payload.waitingOn,
      note: operation.payload.note
    });

    if (!item) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, operation: operation.operation, item });
  }

  const actor = resolveActor(operation.payload.actor);
  const item = await submitSupportTicketRating({
    ticketId: operation.ticketId,
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorName: actor.name,
    actorRole: actor.role,
    rating: operation.payload.rating,
    comment: operation.payload.comment
  });

  if (!item) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, operation: operation.operation, item });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
