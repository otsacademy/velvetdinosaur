import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { InboxMessage, inboxMailboxes, type InboxMailbox } from '@/models/InboxMessage';

const mailboxSet = new Set(inboxMailboxes);
type InboxMailboxOrAll = InboxMailbox | 'all';

const createMessageSchema = z.object({
  action: z.enum(['send', 'draft']).default('send'),
  to: z.union([z.string(), z.array(z.string())]).optional(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10000),
  threadId: z.string().trim().min(1).max(80).optional()
});

type InboxMessageShape = {
  _id?: unknown;
  mailbox?: unknown;
  fromName?: unknown;
  fromEmail?: unknown;
  to?: unknown;
  subject?: unknown;
  body?: unknown;
  preview?: unknown;
  threadId?: unknown;
  messageType?: unknown;
  snoozedUntil?: unknown;
  receivedAt?: unknown;
  isRead?: unknown;
  isStarred?: unknown;
  tags?: unknown;
};

function normalizeMailbox(raw: string | null): InboxMailboxOrAll {
  if (!raw) return 'inbox';
  const value = raw.trim().toLowerCase();
  if (value === 'all') return 'all';
  if (mailboxSet.has(value as InboxMailbox)) return value as InboxMailbox;
  return 'inbox';
}

function normalizeRecipients(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((value) => String(value || '').trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return [];
}

function makePreview(body: string) {
  return body.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function toIsoStringOrNull(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function mapItem(doc: InboxMessageShape) {
  const mailbox = typeof doc.mailbox === 'string' && mailboxSet.has(doc.mailbox as InboxMailbox)
    ? (doc.mailbox as InboxMailbox)
    : 'inbox';

  return {
    id: String(doc._id),
    mailbox,
    fromName: typeof doc.fromName === 'string' ? doc.fromName : '',
    fromEmail: typeof doc.fromEmail === 'string' ? doc.fromEmail : '',
    to: Array.isArray(doc.to) ? doc.to : [],
    subject: typeof doc.subject === 'string' ? doc.subject : '',
    body: typeof doc.body === 'string' ? doc.body : '',
    preview: typeof doc.preview === 'string' ? doc.preview : '',
    threadId: typeof doc.threadId === 'string' ? doc.threadId : null,
    messageType: doc.messageType === 'email' ? 'email' : 'email',
    snoozedUntil: toIsoStringOrNull(doc.snoozedUntil),
    receivedAt: toIsoStringOrNull(doc.receivedAt),
    isRead: Boolean(doc.isRead),
    isStarred: Boolean(doc.isStarred),
    tags: Array.isArray(doc.tags) ? doc.tags : []
  };
}

async function requireApiUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const rawUser = (session as { user?: { id?: string; name?: string | null; email?: string | null } } | null)?.user;
  if (!rawUser?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse };
  }

  const user = {
    id: rawUser.id,
    name: rawUser.name ?? null,
    email: rawUser.email ?? null
  };

  return { user };
}

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const url = new URL(request.url);
  const mailbox = normalizeMailbox(url.searchParams.get('mailbox'));
  const q = String(url.searchParams.get('q') || '').trim();
  const unreadOnly = url.searchParams.get('unread') === '1';
  const starredOnly = url.searchParams.get('starred') === '1';
  const tag = String(url.searchParams.get('tag') || '').trim();

  const query: Record<string, unknown> = { userId: authResult.user.id };
  if (mailbox !== 'all') query.mailbox = mailbox;
  if (unreadOnly) query.isRead = false;
  if (starredOnly) query.isStarred = true;
  if (tag) query.tags = tag;
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { fromName: { $regex: safe, $options: 'i' } },
      { fromEmail: { $regex: safe, $options: 'i' } },
      { subject: { $regex: safe, $options: 'i' } },
      { preview: { $regex: safe, $options: 'i' } },
      { body: { $regex: safe, $options: 'i' } }
    ];
  }

  const [itemsRaw, countsRaw, tagsRaw] = await Promise.all([
    InboxMessage.find(query).sort({ receivedAt: -1, _id: -1 }).limit(250).lean<InboxMessageShape[]>(),
    InboxMessage.find({ userId: authResult.user.id })
      .select({ mailbox: 1, isRead: 1, isStarred: 1 })
      .lean<Array<{ mailbox?: InboxMailbox; isRead?: boolean; isStarred?: boolean }>>(),
    InboxMessage.distinct('tags', { userId: authResult.user.id })
  ]);

  const counts = {
    all: 0,
    inbox: 0,
    sent: 0,
    drafts: 0,
    snoozed: 0,
    archive: 0,
    trash: 0,
    unread: 0,
    starred: 0
  };

  for (const entry of countsRaw) {
    counts.all += 1;
    const mailboxKey = entry.mailbox && mailboxSet.has(entry.mailbox) ? entry.mailbox : null;
    if (mailboxKey) counts[mailboxKey] += 1;
    if (!entry.isRead) counts.unread += 1;
    if (entry.isStarred) counts.starred += 1;
  }

  const items = itemsRaw.map(mapItem);
  const tags = (Array.isArray(tagsRaw) ? tagsRaw : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ items, counts, tags });
}

export async function POST(request: Request) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const recipients = normalizeRecipients(parsed.data.to);
  if (parsed.data.action === 'send' && recipients.length === 0) {
    return NextResponse.json({ error: 'Recipient is required to send' }, { status: 400 });
  }

  const userEmail = String(authResult.user.email || '').trim().toLowerCase();
  const userName = String(authResult.user.name || '').trim() || 'You';
  const messageBody = parsed.data.message.trim();
  const threadId = parsed.data.threadId ? parsed.data.threadId : crypto.randomUUID();
  const doc = await InboxMessage.create({
    userId: authResult.user.id,
    mailbox: parsed.data.action === 'draft' ? 'drafts' : 'sent',
    threadId,
    messageType: 'email',
    fromName: userName,
    fromEmail: userEmail,
    to: recipients,
    subject: parsed.data.subject.trim(),
    body: messageBody,
    preview: makePreview(messageBody),
    isRead: true,
    isStarred: false,
    receivedAt: new Date(),
    tags: []
  });

  return NextResponse.json({ item: mapItem(doc.toObject() as InboxMessageShape) }, { status: 201 });
}
