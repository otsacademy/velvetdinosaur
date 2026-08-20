import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/retention.ts');

import { createHash } from 'crypto';
import { connectDB } from '@/lib/db';
import { SUPPORT_TICKET_CLOSED_STATUSES, SUPPORT_TICKET_OPEN_STATUSES } from '@/lib/support/constants';
import { SupportTicket } from '@/models/SupportTicket';
import { SupportTicketEvent } from '@/models/SupportTicketEvent';
import { SupportTicketMessage } from '@/models/SupportTicketMessage';

type TicketDoc = {
  _id?: unknown;
  ticketRef?: unknown;
  createdAt?: unknown;
  closedAt?: unknown;
  status?: unknown;
  createdByEmail?: unknown;
  assignedToEmail?: unknown;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIdString(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value && 'toString' in value) {
    const fn = (value as { toString?: () => string }).toString;
    if (typeof fn === 'function') return fn.call(value);
  }
  return '';
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function redactedEmail(input: string, salt: string) {
  const email = normalizeEmail(input);
  if (!email) return '';
  if (email.startsWith('redacted+')) return email;
  const hash = createHash('sha256').update(`${salt}:${email}`).digest('hex').slice(0, 16);
  return `redacted+${hash}@example.invalid`;
}

function retentionWindowDays() {
  const openDays = Math.max(30, Math.round(Number(process.env.VD_SUPPORT_OPEN_RETENTION_DAYS || 730)));
  const closedDays = Math.max(30, Math.round(Number(process.env.VD_SUPPORT_CLOSED_RETENTION_DAYS || 365)));
  return { openDays, closedDays };
}

export async function applySupportPiiRetention(now = new Date()) {
  await connectDB();

  const { openDays, closedDays } = retentionWindowDays();
  const openCutoff = new Date(now.getTime() - openDays * 24 * 60 * 60 * 1000);
  const closedCutoff = new Date(now.getTime() - closedDays * 24 * 60 * 60 * 1000);

  const query = {
    $and: [
      {
        $or: [
          {
            status: { $in: SUPPORT_TICKET_CLOSED_STATUSES },
            closedAt: { $lte: closedCutoff }
          },
          {
            status: { $in: SUPPORT_TICKET_OPEN_STATUSES },
            createdAt: { $lte: openCutoff }
          }
        ]
      },
      {
        $or: [
          { createdByEmail: { $exists: true, $ne: '', $not: { $regex: '^redacted\\+', $options: 'i' } } },
          { assignedToEmail: { $exists: true, $ne: '', $not: { $regex: '^redacted\\+', $options: 'i' } } }
        ]
      }
    ]
  };

  const candidates = (await SupportTicket.find(query)
    .limit(500)
    .sort({ closedAt: 1, createdAt: 1, _id: 1 })
    .lean()) as TicketDoc[];

  let redactedTickets = 0;
  let redactedMessages = 0;
  let redactedEvents = 0;

  for (const ticket of candidates) {
    const ticketId = toIdString(ticket._id);
    if (!ticketId) continue;

    const salt = clean(ticket.ticketRef) || ticketId;
    const createdByEmail = redactedEmail(ticket.createdByEmail as string, `${salt}:created`);
    const assignedToEmail = redactedEmail(ticket.assignedToEmail as string, `${salt}:assigned`);

    const ticketResult = await SupportTicket.updateOne(
      { _id: ticket._id },
      {
        $set: {
          createdByEmail,
          assignedToEmail,
          updatedAt: now
        }
      }
    );
    if (Number(ticketResult.modifiedCount || 0) > 0) redactedTickets += 1;

    const messageResult = await SupportTicketMessage.updateMany(
      { ticketId, authorEmail: { $exists: true, $ne: '' } },
      [{ $set: { authorEmail: { $concat: ['redacted+', { $substrBytes: [{ $toString: '$_id' }, 0, 16] }, '@example.invalid'] } } }]
    );
    redactedMessages += Number(messageResult.modifiedCount || 0);

    const eventResult = await SupportTicketEvent.updateMany(
      { ticketId, actorEmail: { $exists: true, $ne: '' } },
      [{ $set: { actorEmail: { $concat: ['redacted+', { $substrBytes: [{ $toString: '$_id' }, 0, 16] }, '@example.invalid'] } } }]
    );
    redactedEvents += Number(eventResult.modifiedCount || 0);

    await SupportTicketEvent.create({
      ticketId,
      eventType: 'updated',
      actorUserId: '',
      actorEmail: '',
      actorName: 'Retention Service',
      actorRole: 'system',
      fromStatus: clean(ticket.status),
      toStatus: clean(ticket.status),
      fromWaitingOn: '',
      toWaitingOn: '',
      message: 'PII retention redaction applied',
      metadata: {
        policy: {
          openDays,
          closedDays
        },
        appliedAt: now.toISOString(),
        createdAt: toDate(ticket.createdAt)?.toISOString() || null,
        closedAt: toDate(ticket.closedAt)?.toISOString() || null
      }
    });
  }

  return {
    scanned: candidates.length,
    redactedTickets,
    redactedMessages,
    redactedEvents,
    policy: {
      openDays,
      closedDays,
      openCutoff: openCutoff.toISOString(),
      closedCutoff: closedCutoff.toISOString()
    }
  };
}
