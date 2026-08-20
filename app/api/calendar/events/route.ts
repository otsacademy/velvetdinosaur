import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CalendarEvent } from '@/models/CalendarEvent';
import { CalendarDefinition } from '@/models/CalendarDefinition';
import { ensureDefaultCalendars, listAccessibleCalendars } from '@/lib/calendar-access';

const createEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dateKey: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/),
  durationMin: z.coerce.number().int().min(15).max(480).default(60),
  calendarOwnerId: z.string().trim().min(1).max(128).optional(),
  calendarId: z.string().trim().min(1).max(64).optional(),
  calendarName: z.string().trim().min(1).max(80).optional(),
  calendarColor: z.string().trim().min(1).max(32).optional(),
  eventType: z.enum(['event', 'task', 'reminder', 'out-of-office']).optional(),
  allDay: z.boolean().optional(),
  endDateKey: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  meetingType: z.enum(['in-person', 'online', 'hybrid']).optional().or(z.literal('')),
  category: z.string().trim().max(80).optional(),
  reminderMinutes: z.coerce.number().int().min(0).max(10080).optional(),
  location: z.string().trim().max(160).optional(),
  attendees: z.union([z.string(), z.array(z.string())]).optional(),
  notes: z.string().trim().max(5000).optional()
});

type CalendarEventShape = {
  _id?: unknown;
  userId?: unknown;
  title?: unknown;
  dateKey?: unknown;
  time?: unknown;
  durationMin?: unknown;
  calendarId?: unknown;
  calendarName?: unknown;
  calendarColor?: unknown;
  eventType?: unknown;
  allDay?: unknown;
  endDateKey?: unknown;
  meetingType?: unknown;
  category?: unknown;
  reminderMinutes?: unknown;
  location?: unknown;
  attendees?: unknown;
  notes?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function normalizeAttendees(raw: unknown) {
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

function toIsoStringOrNull(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function mapEvent(doc: CalendarEventShape) {
  return {
    id: String(doc._id),
    calendarOwnerId: typeof doc.userId === 'string' ? doc.userId : '',
    title: typeof doc.title === 'string' ? doc.title : '',
    dateKey: typeof doc.dateKey === 'string' ? doc.dateKey : '',
    time: typeof doc.time === 'string' ? doc.time : '00:00',
    durationMin: Math.max(15, Number(doc.durationMin || 60)),
    calendarId: typeof doc.calendarId === 'string' ? doc.calendarId : 'personal',
    calendarName: typeof doc.calendarName === 'string' ? doc.calendarName : 'Personal',
    calendarColor: typeof doc.calendarColor === 'string' ? doc.calendarColor : 'primary',
    eventType:
      doc.eventType === 'task' || doc.eventType === 'reminder' || doc.eventType === 'out-of-office'
        ? doc.eventType
        : 'event',
    allDay: Boolean(doc.allDay),
    endDateKey: typeof doc.endDateKey === 'string' ? doc.endDateKey : '',
    meetingType:
      doc.meetingType === 'in-person' || doc.meetingType === 'online' || doc.meetingType === 'hybrid'
        ? doc.meetingType
        : '',
    category: typeof doc.category === 'string' ? doc.category : '',
    reminderMinutes: Math.max(0, Number(doc.reminderMinutes || 30)),
    location: typeof doc.location === 'string' ? doc.location : '',
    attendees: Array.isArray(doc.attendees) ? doc.attendees : [],
    notes: typeof doc.notes === 'string' ? doc.notes : '',
    createdAt: toIsoStringOrNull(doc.createdAt),
    updatedAt: toIsoStringOrNull(doc.updatedAt)
  };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

async function ensureSeedEvents(userId: string) {
  const existing = await CalendarEvent.countDocuments({ userId });
  if (existing > 0) return;

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  await CalendarEvent.insertMany([
    {
      userId,
      title: 'Editorial inbox triage',
      dateKey: toDateKey(today),
      time: '09:00',
      durationMin: 60,
      calendarId: 'personal',
      calendarName: 'Personal',
      calendarColor: 'primary',
      eventType: 'event',
      allDay: false,
      endDateKey: '',
      meetingType: '',
      category: 'Operations',
      reminderMinutes: 30,
      location: 'Workspace',
      attendees: ['Comms', 'Programs'],
      notes: ''
    },
    {
      userId,
      title: 'Policy brief review',
      dateKey: toDateKey(tomorrow),
      time: '14:30',
      durationMin: 60,
      calendarId: 'team',
      calendarName: 'Team',
      calendarColor: 'accent',
      eventType: 'event',
      allDay: false,
      endDateKey: '',
      meetingType: 'online',
      category: 'Research',
      reminderMinutes: 15,
      location: 'Zoom',
      attendees: ['Research Team'],
      notes: ''
    },
    {
      userId,
      title: 'Events coordination',
      dateKey: toDateKey(dayAfter),
      time: '11:00',
      durationMin: 90,
      calendarId: 'tasks',
      calendarName: 'Tasks',
      calendarColor: 'destructive',
      eventType: 'task',
      allDay: false,
      endDateKey: '',
      meetingType: '',
      category: 'Events',
      reminderMinutes: 30,
      location: 'Operations',
      attendees: ['Events Team'],
      notes: ''
    }
  ]);
}

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  await ensureSeedEvents(authResult.user.id);
  await ensureDefaultCalendars(authResult.user.id);

  const url = new URL(request.url);
  const dateKey = String(url.searchParams.get('dateKey') || '').trim();
  const from = String(url.searchParams.get('from') || '').trim();
  const to = String(url.searchParams.get('to') || '').trim();

  const scopes = await listAccessibleCalendars({
    userId: authResult.user.id,
    email: authResult.user.email
  });
  const scopeFilters = scopes.map((scope) => ({ userId: scope.ownerUserId, calendarId: scope.calendarId }));
  if (!scopeFilters.length) {
    return NextResponse.json({ viewerId: authResult.user.id, items: [], upcoming: [] });
  }

  const query: Record<string, unknown> = { $or: scopeFilters };
  if (dateKey) {
    query.dateKey = dateKey;
  } else if (from && to) {
    query.dateKey = { $gte: from, $lte: to };
  }

  const [itemsRaw, upcomingRaw] = await Promise.all([
    CalendarEvent.find(query).sort({ dateKey: 1, time: 1, _id: 1 }).limit(400).lean<CalendarEventShape[]>(),
    CalendarEvent.find({
      $or: scopeFilters,
      dateKey: { $gte: toDateKey(new Date()), $lte: toDateKey(addDays(new Date(), 7)) }
    })
      .sort({ dateKey: 1, time: 1, _id: 1 })
      .limit(80)
      .lean<CalendarEventShape[]>()
  ]);

  return NextResponse.json({
    viewerId: authResult.user.id,
    items: itemsRaw.map(mapEvent),
    upcoming: upcomingRaw.map(mapEvent)
  });
}

export async function POST(request: Request) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const desiredOwnerUserId = String(parsed.data.calendarOwnerId || authResult.user.id).trim() || authResult.user.id;
  const desiredCalendarId = String(parsed.data.calendarId || 'personal').trim() || 'personal';
  const scopes = await listAccessibleCalendars({
    userId: authResult.user.id,
    email: authResult.user.email
  });
  const targetScope = scopes.find(
    (scope) => scope.ownerUserId === desiredOwnerUserId && scope.calendarId === desiredCalendarId
  );
  if (!targetScope) {
    return NextResponse.json({ error: 'Calendar access denied' }, { status: 403 });
  }
  if (targetScope.role !== 'edit') {
    return NextResponse.json({ error: 'Calendar is read-only' }, { status: 403 });
  }

  const doc = await CalendarEvent.create({
    userId: targetScope.ownerUserId,
    title: parsed.data.title.trim(),
    dateKey: parsed.data.dateKey.trim(),
    time: parsed.data.time.trim(),
    durationMin: parsed.data.durationMin,
    calendarId: targetScope.calendarId,
    calendarName: parsed.data.calendarName || targetScope.label || 'Personal',
    calendarColor: parsed.data.calendarColor || targetScope.color || 'primary',
    eventType: parsed.data.eventType || 'event',
    allDay: parsed.data.allDay === true,
    endDateKey: parsed.data.endDateKey || '',
    meetingType: parsed.data.meetingType || '',
    category: String(parsed.data.category || '').trim(),
    reminderMinutes:
      typeof parsed.data.reminderMinutes === 'number' && Number.isFinite(parsed.data.reminderMinutes)
        ? parsed.data.reminderMinutes
        : 30,
    location: String(parsed.data.location || '').trim(),
    attendees: normalizeAttendees(parsed.data.attendees),
    notes: String(parsed.data.notes || '').trim()
  });

  if (targetScope.ownerUserId === authResult.user.id) {
    await CalendarDefinition.updateOne(
      { ownerUserId: targetScope.ownerUserId, calendarId: targetScope.calendarId },
      {
        $setOnInsert: {
          ownerUserId: targetScope.ownerUserId,
          calendarId: targetScope.calendarId,
          label: targetScope.label,
          color: targetScope.color,
          archived: false
        }
      },
      { upsert: true }
    );
  }

  return NextResponse.json({ item: mapEvent(doc.toObject() as CalendarEventShape) }, { status: 201 });
}
