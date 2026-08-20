import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { InboxMessage, inboxMailboxes, type InboxMailbox } from '@/models/InboxMessage';

const mailboxSet = new Set(inboxMailboxes);

type InboxMessageLean = {
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

function toIsoStringOrNull(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function mapItem(doc: InboxMessageLean) {
  const mailbox =
    typeof doc.mailbox === 'string' && mailboxSet.has(doc.mailbox as InboxMailbox)
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
  const rawUser = (session as { user?: { id?: string } } | null)?.user;
  if (!rawUser?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse };
  }
  return { user: { id: rawUser.id } };
}

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const url = new URL(request.url);
  const threadId = String(url.searchParams.get('threadId') || '').trim();
  const messageId = String(url.searchParams.get('messageId') || '').trim();
  if (!threadId && !messageId) {
    return NextResponse.json({ error: 'threadId or messageId is required' }, { status: 400 });
  }

  let sourceMessage: InboxMessageLean | null = null;
  if (messageId) {
    sourceMessage = await InboxMessage.findOne({ _id: messageId, userId: authResult.user.id }).lean<InboxMessageLean | null>();
    if (!sourceMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
  }

  const resolvedThreadId = threadId || String(sourceMessage?.threadId || '').trim();
  let itemsRaw: InboxMessageLean[] = [];

  if (resolvedThreadId) {
    itemsRaw = await InboxMessage.find({
      userId: authResult.user.id,
      threadId: resolvedThreadId
    })
      .sort({ receivedAt: 1, _id: 1 })
      .lean<InboxMessageLean[]>();
  } else if (sourceMessage) {
    const subject = String(sourceMessage.subject || '').trim();
    const fromEmail = String(sourceMessage.fromEmail || '').trim().toLowerCase();

    itemsRaw = await InboxMessage.find({
      userId: authResult.user.id,
      subject,
      $or: [{ fromEmail }, { to: fromEmail }]
    })
      .sort({ receivedAt: 1, _id: 1 })
      .lean<InboxMessageLean[]>();

    if (!itemsRaw.length) itemsRaw = [sourceMessage];
  }

  const items = itemsRaw.map(mapItem);
  return NextResponse.json({ items });
}
