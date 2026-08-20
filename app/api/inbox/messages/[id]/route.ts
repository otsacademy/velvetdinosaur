import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { InboxMessage, inboxMailboxes, type InboxMailbox } from '@/models/InboxMessage';

const mailboxSet = new Set(inboxMailboxes);

const updateMessageSchema = z.object({
  mailbox: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || mailboxSet.has(value as InboxMailbox), {
      message: 'Invalid mailbox'
    }),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().min(1).max(10000).optional(),
  to: z.union([z.string(), z.array(z.string())]).optional(),
  snoozedUntil: z.string().trim().optional(),
  addTag: z.string().trim().min(1).max(40).optional(),
  removeTag: z.string().trim().min(1).max(40).optional()
});

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

function mapItem(doc: InboxMessageLean) {
  const mailbox = typeof doc.mailbox === 'string' && mailboxSet.has(doc.mailbox as InboxMailbox)
    ? (doc.mailbox as InboxMailbox)
    : 'inbox';

  const toIsoStringOrNull = (value: unknown) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    return null;
  };

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

async function requireApiUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const rawUser = (session as { user?: { id?: string } } | null)?.user;
  if (!rawUser?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse };
  }
  const user = { id: rawUser.id };
  return { user };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const { id } = await context.params;
  try {
    const doc = await InboxMessage.findOne({ _id: id, userId: authResult.user.id }).lean<InboxMessageLean | null>();
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ item: mapItem(doc) });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const doc = await InboxMessage.findOne({ _id: id, userId: authResult.user.id });
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (parsed.data.mailbox && mailboxSet.has(parsed.data.mailbox as InboxMailbox)) {
      doc.mailbox = parsed.data.mailbox as InboxMailbox;
    }
    if (typeof parsed.data.isRead === 'boolean') {
      doc.isRead = parsed.data.isRead;
    }
    if (typeof parsed.data.isStarred === 'boolean') {
      doc.isStarred = parsed.data.isStarred;
    }
    if (typeof parsed.data.subject === 'string') {
      doc.subject = parsed.data.subject.trim();
    }
    if (typeof parsed.data.body === 'string') {
      const messageBody = parsed.data.body.trim();
      doc.body = messageBody;
      doc.preview = makePreview(messageBody);
    }
    if (parsed.data.to !== undefined) {
      doc.to = normalizeRecipients(parsed.data.to);
    }
    if (parsed.data.snoozedUntil !== undefined) {
      const raw = parsed.data.snoozedUntil.trim();
      if (!raw) {
        doc.snoozedUntil = undefined;
      } else {
        const nextDate = new Date(raw);
        if (!Number.isNaN(nextDate.getTime())) {
          doc.snoozedUntil = nextDate;
        }
      }
    }
    if (parsed.data.addTag) {
      const next = parsed.data.addTag.trim().toLowerCase();
      const tags = new Set((Array.isArray(doc.tags) ? doc.tags : []).map((value: unknown) => String(value).trim().toLowerCase()));
      tags.add(next);
      doc.tags = Array.from(tags);
    }
    if (parsed.data.removeTag) {
      const remove = parsed.data.removeTag.trim().toLowerCase();
      doc.tags = (Array.isArray(doc.tags) ? doc.tags : []).filter(
        (value: unknown) => String(value).trim().toLowerCase() !== remove
      );
    }

    await doc.save();
    return NextResponse.json({ item: mapItem(doc.toObject() as InboxMessageLean) });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const { id } = await context.params;
  try {
    const doc = await InboxMessage.findOne({ _id: id, userId: authResult.user.id });
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (doc.mailbox !== 'trash') {
      doc.mailbox = 'trash';
      await doc.save();
      return NextResponse.json({ ok: true, item: mapItem(doc.toObject() as InboxMessageLean) });
    }

    await InboxMessage.deleteOne({ _id: id, userId: authResult.user.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
