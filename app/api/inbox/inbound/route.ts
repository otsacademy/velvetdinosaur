import { NextResponse } from 'next/server';
import type { Connection } from 'mongoose';
import { connectDB } from '@/lib/db';
import { InboxMessage } from '@/models/InboxMessage';
import { UserRole } from '@/models/UserRole';

type PostmarkAddress = { Email?: string; Name?: string };

type PostmarkInboundPayload = {
  From?: string;
  FromFull?: PostmarkAddress;
  ToFull?: PostmarkAddress[];
  CcFull?: PostmarkAddress[];
  BccFull?: PostmarkAddress[];
  OriginalRecipient?: string;
  Subject?: string;
  TextBody?: string;
  HtmlBody?: string;
  StrippedTextReply?: string;
  MessageID?: string;
  Date?: string;
};

const MAX_BODY_LENGTH = 20000;

const ACTIVE_USER_FILTER = {
  $or: [{ accessRemovedAt: { $exists: false } }, { accessRemovedAt: null }]
};

function getProvidedToken(request: Request) {
  const url = new URL(request.url);
  return (
    request.headers.get('x-webhook-secret') ||
    url.searchParams.get('token') ||
    ''
  ).trim();
}

function htmlToText(html: string) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function resolveBody(payload: PostmarkInboundPayload) {
  const text = (payload.TextBody || '').trim();
  if (text) return text.slice(0, MAX_BODY_LENGTH);
  const html = (payload.HtmlBody || '').trim();
  if (html) return htmlToText(html).slice(0, MAX_BODY_LENGTH);
  return (payload.StrippedTextReply || '').trim().slice(0, MAX_BODY_LENGTH);
}

function collectRecipientEmails(payload: PostmarkInboundPayload) {
  const addresses = [
    ...(payload.ToFull || []),
    ...(payload.CcFull || []),
    ...(payload.BccFull || [])
  ]
    .map((entry) => String(entry?.Email || '').trim().toLowerCase())
    .filter(Boolean);
  const original = String(payload.OriginalRecipient || '').trim().toLowerCase();
  if (original) addresses.push(original);
  return Array.from(new Set(addresses));
}

function makePreview(body: string) {
  return body.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function parseReceivedAt(raw?: string) {
  if (!raw) return new Date();
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

type Db = NonNullable<Connection['db']>;

async function resolveTargetUserIds(db: Db, recipients: string[]) {
  const users = (await db
    .collection('user')
    .find(ACTIVE_USER_FILTER, { projection: { _id: 1, email: 1 } })
    .limit(1000)
    .toArray()) as Array<{ _id: unknown; email?: string }>;

  const usersByEmail = new Map(
    users.map((doc) => [String(doc.email || '').trim().toLowerCase(), String(doc._id)])
  );

  const targets = new Set<string>();
  let hasGenericRecipient = recipients.length === 0;
  for (const recipient of recipients) {
    const userId = usersByEmail.get(recipient);
    if (userId) {
      targets.add(userId);
    } else {
      // Not a personal account address (e.g. info@) — deliver to the shared admin pool.
      hasGenericRecipient = true;
    }
  }

  if (hasGenericRecipient) {
    const adminRoles = await UserRole.find({ role: 'admin' }).select({ userId: 1 }).lean<
      Array<{ userId?: string }>
    >();
    const activeUserIds = new Set(users.map((doc) => String(doc._id)));
    for (const role of adminRoles) {
      const userId = String(role.userId || '');
      if (userId && activeUserIds.has(userId)) targets.add(userId);
    }
  }

  return Array.from(targets);
}

export async function POST(request: Request) {
  const expectedToken = (process.env.INBOX_INBOUND_WEBHOOK_TOKEN || '').trim();
  if (!expectedToken) {
    console.error('[inbox-inbound] INBOX_INBOUND_WEBHOOK_TOKEN not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  if (getProvidedToken(request) !== expectedToken) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as PostmarkInboundPayload | null;
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const conn = await connectDB();
  const db = conn?.connection?.db;
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const recipients = collectRecipientEmails(payload);
  const targetUserIds = await resolveTargetUserIds(db, recipients);
  if (targetUserIds.length === 0) {
    console.warn('[inbox-inbound] no target users resolved', { recipients });
    return NextResponse.json({ ok: true, delivered: 0 });
  }

  const fromEmail = String(payload.FromFull?.Email || payload.From || '').trim().toLowerCase();
  const fromName = String(payload.FromFull?.Name || '').trim();
  const subject = String(payload.Subject || '').trim() || '(no subject)';
  const body = resolveBody(payload);
  const preview = makePreview(body);
  const receivedAt = parseReceivedAt(payload.Date);
  const threadId = String(payload.MessageID || '').trim() || crypto.randomUUID();
  const to = (payload.ToFull || [])
    .map((entry) => String(entry?.Email || '').trim().toLowerCase())
    .filter(Boolean);

  let delivered = 0;
  for (const userId of targetUserIds) {
    // Postmark retries on non-200; threadId doubles as an idempotency key.
    const existing = await InboxMessage.findOne({ userId, threadId }).select({ _id: 1 }).lean();
    if (existing) continue;
    await InboxMessage.create({
      userId,
      mailbox: 'inbox',
      threadId,
      messageType: 'email',
      fromName,
      fromEmail,
      to,
      subject,
      body,
      preview,
      receivedAt,
      isRead: false,
      isStarred: false,
      tags: ['inbound']
    });
    delivered += 1;
  }

  return NextResponse.json({ ok: true, delivered });
}
