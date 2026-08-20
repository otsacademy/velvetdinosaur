import { ObjectId } from 'mongodb';
import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { canManageReviewMode } from '@/lib/review/review-mode-access';
import { requireAdmin } from '@/lib/roles';
import { sendReviewLinkEmail } from '@/lib/email/review-email';
import {
  isReviewPathBlocked,
  normalizeReviewPathname,
  pathnameToReviewSlug,
  previewSlugToPathname
} from '@/lib/review/pathname-slug';
import { getDefaultReviewDeadline, isReviewExpired } from '@/lib/security/review-deadlines';
import {
  buildReviewUrl,
  createReviewLink,
  listReviewLinks,
  markReviewLinkSent
} from '@/lib/security/review-links';
import { listAccessibleCalendars } from '@/lib/calendar-access';
import { CalendarEvent } from '@/models/CalendarEvent';
import { UserProfile } from '@/models/UserProfile';

const createSchema = z.object({
  slug: z.string().trim().min(1),
  recipientEmail: z.string().trim().email().optional().or(z.literal('')),
  startsAt: z.string().trim().optional().or(z.literal('')),
  deadlineAt: z.string().trim().optional().or(z.literal('')),
  sendEmail: z.boolean().optional(),
  createTaskEvent: z.boolean().optional(),
  notifyAllUsers: z.boolean().optional(),
  draftRecipientEmail: z.string().trim().email().optional().or(z.literal(''))
});

function inferBaseURL(request: Request) {
  const url = new URL(request.url);
  const envBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || '';
  return envBase || `${url.protocol}//${url.host}`;
}

function normalizeSlug(input: string) {
  return input.trim().toLowerCase();
}

function resolveReviewTarget(input: string) {
  const raw = (input || '').trim();
  if (!raw) return null;

  const asPathname = raw.startsWith('/') ? normalizeReviewPathname(raw) : null;
  const asSlug = asPathname ? null : normalizeSlug(raw);
  const pathname = asPathname || previewSlugToPathname(asSlug || '');
  if (!pathname) return null;
  if (isReviewPathBlocked(pathname)) return null;
  const slug = pathnameToReviewSlug(pathname);
  if (!slug) return null;

  return { slug, pathname };
}

function parseDeadline(raw?: string | null) {
  if (!raw) return getDefaultReviewDeadline();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseStart(raw?: string | null) {
  if (!raw) return new Date();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toIdString(value: ObjectId | string | null | undefined) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.toHexString();
}

function toFirstName(value: string) {
  const normalized = clean(value)
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ');
  const first = normalized.split(' ').find(Boolean) || '';
  if (!first) return '';
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}`;
}

type ReviewEmailRecipient = {
  email: string;
  firstName: string;
};

async function listRegisteredReviewRecipients() {
  const conn = await connectDB();
  const db = conn?.connection?.db;
  if (!db) return [] as ReviewEmailRecipient[];

  const userDocs = (await db
    .collection<{ _id: ObjectId | string; email?: string | null; name?: string | null }>('user')
    .find({}, { projection: { _id: 1, email: 1, name: 1 } })
    .limit(1000)
    .toArray()) as Array<{ _id: ObjectId | string; email?: string | null; name?: string | null }>;

  const userIds = userDocs.map((doc) => toIdString(doc._id)).filter(Boolean);
  const profileRows = (await UserProfile.find(
    { userId: { $in: userIds } },
    { userId: 1, firstName: 1, displayName: 1, lastName: 1 }
  ).lean()) as Array<{ userId?: string; firstName?: string; displayName?: string; lastName?: string }>;
  const profileByUserId = new Map<string, { firstName?: string; displayName?: string; lastName?: string }>();
  for (const row of profileRows) {
    const userId = clean(row.userId);
    if (!userId) continue;
    profileByUserId.set(userId, row);
  }

  const recipientByEmail = new Map<string, ReviewEmailRecipient>();
  for (const user of userDocs) {
    const email = clean(user.email).toLowerCase();
    if (!email.includes('@')) continue;
    const userId = toIdString(user._id);
    const profile = profileByUserId.get(userId);
    const firstName =
      toFirstName(clean(profile?.firstName)) ||
      toFirstName(clean(profile?.displayName)) ||
      toFirstName(clean(user.name)) ||
      toFirstName(email.split('@')[0] || '');
    recipientByEmail.set(email, { email, firstName });
  }

  return [...recipientByEmail.values()];
}

async function createReviewTaskEvent(input: {
  userId: string | null;
  email: string | null;
  pathname: string;
  startsAt: Date;
  deadlineAt: Date;
  reviewUrl: string;
}) {
  if (!input.userId) return null;
  const scopes = await listAccessibleCalendars({ userId: input.userId, email: input.email });
  const editableScopes = scopes.filter((scope) => scope.role === 'edit');
  const preferredScope =
    editableScopes.find((scope) => scope.owned && scope.calendarId === 'tasks') ||
    editableScopes.find((scope) => scope.owned && scope.calendarId === 'personal') ||
    editableScopes[0];
  if (!preferredScope) return null;

  const startsOn = toDateKey(input.startsAt);
  const deadlineOn = toDateKey(input.deadlineAt);
  const taskTitle = input.pathname === '/' ? 'Review window: Home page' : `Review window: ${input.pathname}`;
  const taskDoc = await CalendarEvent.create({
    userId: preferredScope.ownerUserId,
    title: taskTitle,
    dateKey: startsOn,
    time: '09:00',
    durationMin: 60,
    calendarId: preferredScope.calendarId,
    calendarName: preferredScope.label,
    calendarColor: preferredScope.color,
    eventType: 'task',
    allDay: true,
    endDateKey: deadlineOn,
    meetingType: '',
    category: 'Review',
    reminderMinutes: 60,
    location: 'Sauro CMS',
    attendees: [],
    notes: [
      `Review target: ${input.pathname}`,
      `Window: ${startsOn} to ${deadlineOn}`,
      `Share link: ${input.reviewUrl}`
    ].join('\n')
  });

  return {
    id: String(taskDoc._id),
    title: taskTitle,
    startsOn,
    deadlineOn,
    calendarId: preferredScope.calendarId
  };
}

async function requireAdminSession(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;
  const userEmail = user?.email || null;
  if (!session || !(await requireAdmin(userId, user?.email || null)) || !canManageReviewMode(userEmail, request.url)) {
    return { ok: false as const, userId: null, userEmail: null };
  }
  return { ok: true as const, userId, userEmail };
}

export async function GET(request: Request) {
  unstable_noStore();
  const gate = await requireAdminSession(request);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const mode = new URL(request.url).searchParams.get('mode');
  if (mode === 'capability') {
    return NextResponse.json({ canManageReviewLinks: true });
  }

  const links = await listReviewLinks(200);
  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const gate = await requireAdminSession(request);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsedBody = createSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const resolvedTarget = resolveReviewTarget(parsedBody.data.slug);
  if (!resolvedTarget) {
    return NextResponse.json({ error: 'Invalid review start path or slug' }, { status: 400 });
  }

  const deadlineAt = parseDeadline(parsedBody.data.deadlineAt || null);
  if (!deadlineAt) {
    return NextResponse.json({ error: 'Invalid deadline date' }, { status: 400 });
  }
  const startsAt = parseStart(parsedBody.data.startsAt || null);
  if (!startsAt) {
    return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
  }
  if (isReviewExpired(deadlineAt)) {
    return NextResponse.json({ error: 'Deadline must be in the future' }, { status: 400 });
  }
  if (startsAt.getTime() > deadlineAt.getTime()) {
    return NextResponse.json({ error: 'Start date must be before the deadline date' }, { status: 400 });
  }

  const recipientEmail = parsedBody.data.recipientEmail ? parsedBody.data.recipientEmail.toLowerCase() : null;
  const draftRecipientEmail = parsedBody.data.draftRecipientEmail
    ? parsedBody.data.draftRecipientEmail.toLowerCase()
    : null;
  const sendEmail = parsedBody.data.sendEmail === true;
  const notifyAllUsers = parsedBody.data.notifyAllUsers === true;
  const createTaskEvent = parsedBody.data.createTaskEvent === true;
  if (sendEmail && !recipientEmail) {
    return NextResponse.json({ error: 'Recipient email is required to send' }, { status: 400 });
  }

  const created = await createReviewLink({
    slug: resolvedTarget.slug,
    startsAt,
    deadlineAt,
    recipientEmail,
    createdByUserId: gate.userId
  });

  const base = inferBaseURL(request).replace(/\/+$/, '');
  const reviewUrl = buildReviewUrl(base, resolvedTarget.slug, created.token);

  let emailSent = false;
  let draftSent = false;
  let emailFailureCount = 0;
  let notifiedUsers = 0;
  let reviewTaskEvent: {
    id: string;
    title: string;
    startsOn: string;
    deadlineOn: string;
    calendarId: string;
  } | null = null;

  if (sendEmail && recipientEmail) {
    const delivery = await sendReviewLinkEmail({
      to: recipientEmail,
      reviewUrl,
      startsAt: created.record.startsAt,
      deadlineAt: created.record.deadlineAt
    });
    if (delivery.sent) {
      emailSent = true;
    }
  }
  if (draftRecipientEmail) {
    try {
      const draftDelivery = await sendReviewLinkEmail({
        to: draftRecipientEmail,
        firstName: 'Ian',
        reviewUrl,
        startsAt: created.record.startsAt,
        deadlineAt: created.record.deadlineAt
      });
      if (draftDelivery.sent) {
        draftSent = true;
      } else {
        emailFailureCount += 1;
      }
    } catch {
      emailFailureCount += 1;
    }
  }
  if (notifyAllUsers) {
    const recipients = await listRegisteredReviewRecipients();
    const ignoredEmails = new Set<string>(draftRecipientEmail ? [draftRecipientEmail] : []);
    const recipientsToNotify = recipients.filter((recipient) => !ignoredEmails.has(recipient.email));
    for (const recipient of recipientsToNotify) {
      try {
        const delivery = await sendReviewLinkEmail({
          to: recipient.email,
          firstName: recipient.firstName,
          reviewUrl,
          startsAt: created.record.startsAt,
          deadlineAt: created.record.deadlineAt
        });
        if (delivery.sent) {
          notifiedUsers += 1;
        } else {
          emailFailureCount += 1;
        }
      } catch {
        emailFailureCount += 1;
      }
    }
  }
  if (createTaskEvent) {
    reviewTaskEvent = await createReviewTaskEvent({
      userId: gate.userId,
      email: gate.userEmail,
      pathname: resolvedTarget.pathname,
      startsAt: created.record.startsAt,
      deadlineAt: created.record.deadlineAt,
      reviewUrl
    });
  }
  if (emailSent || draftSent || notifiedUsers > 0) {
    await markReviewLinkSent(created.record.tokenId);
  }

  return NextResponse.json({
    link: created.record,
    reviewUrl,
    emailSent,
    draftSent,
    notifiedUsers,
    emailFailureCount,
    reviewTaskEvent
  });
}
