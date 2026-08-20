import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CalendarEvent } from '@/models/CalendarEvent';
import { listAccessibleCalendars } from '@/lib/calendar-access';

const updateEventSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  dateKey: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/).optional(),
  durationMin: z.coerce.number().int().min(15).max(480).optional(),
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

async function requireApiUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const rawUser = (session as { user?: { id?: string; email?: string | null } } | null)?.user;
  if (!rawUser?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse };
  }
  const user = { id: rawUser.id, email: rawUser.email ?? null };
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
    const scopes = await listAccessibleCalendars({
      userId: authResult.user.id,
      email: authResult.user.email
    });
    const scopeFilters = scopes.map((scope) => ({ userId: scope.ownerUserId, calendarId: scope.calendarId }));
    if (!scopeFilters.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const doc = await CalendarEvent.findOne({
      _id: id,
      $or: scopeFilters
    }).lean<CalendarEventShape | null>();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item: mapEvent(doc) });
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
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const doc = await CalendarEvent.findById(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const scopes = await listAccessibleCalendars({
      userId: authResult.user.id,
      email: authResult.user.email
    });
    const currentScope = scopes.find(
      (scope) => scope.ownerUserId === doc.userId && scope.calendarId === doc.calendarId
    );
    if (!currentScope) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (currentScope.role !== 'edit') {
      return NextResponse.json({ error: 'Calendar is read-only' }, { status: 403 });
    }

    if (typeof parsed.data.calendarId === 'string' && parsed.data.calendarId.trim() !== doc.calendarId) {
      const targetScope = scopes.find(
        (scope) => scope.ownerUserId === doc.userId && scope.calendarId === parsed.data.calendarId?.trim()
      );
      if (!targetScope || targetScope.role !== 'edit') {
        return NextResponse.json({ error: 'Cannot move event to this calendar' }, { status: 403 });
      }
    }

    if (typeof parsed.data.title === 'string') doc.title = parsed.data.title.trim();
    if (typeof parsed.data.dateKey === 'string') doc.dateKey = parsed.data.dateKey.trim();
    if (typeof parsed.data.time === 'string') doc.time = parsed.data.time.trim();
    if (typeof parsed.data.durationMin === 'number') doc.durationMin = parsed.data.durationMin;
    if (typeof parsed.data.calendarId === 'string') doc.calendarId = parsed.data.calendarId.trim();
    if (typeof parsed.data.calendarName === 'string') doc.calendarName = parsed.data.calendarName.trim();
    if (typeof parsed.data.calendarColor === 'string') doc.calendarColor = parsed.data.calendarColor.trim();
    if (typeof parsed.data.eventType === 'string') doc.eventType = parsed.data.eventType;
    if (typeof parsed.data.allDay === 'boolean') doc.allDay = parsed.data.allDay;
    if (typeof parsed.data.endDateKey === 'string') doc.endDateKey = parsed.data.endDateKey.trim();
    if (typeof parsed.data.meetingType === 'string') doc.meetingType = parsed.data.meetingType;
    if (typeof parsed.data.category === 'string') doc.category = parsed.data.category.trim();
    if (typeof parsed.data.reminderMinutes === 'number') doc.reminderMinutes = parsed.data.reminderMinutes;
    if (typeof parsed.data.location === 'string') doc.location = parsed.data.location.trim();
    if (parsed.data.attendees !== undefined) doc.attendees = normalizeAttendees(parsed.data.attendees);
    if (typeof parsed.data.notes === 'string') doc.notes = parsed.data.notes.trim();

    await doc.save();
    return NextResponse.json({ item: mapEvent(doc.toObject() as CalendarEventShape) });
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
    const doc = await CalendarEvent.findById(id).lean<CalendarEventShape | null>();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const ownerUserId = typeof doc.userId === 'string' ? doc.userId : '';
    const calendarId = typeof doc.calendarId === 'string' ? doc.calendarId : '';
    if (!ownerUserId || !calendarId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const scopes = await listAccessibleCalendars({
      userId: authResult.user.id,
      email: authResult.user.email
    });
    const scope = scopes.find(
      (entry) => entry.ownerUserId === ownerUserId && entry.calendarId === calendarId
    );
    if (!scope) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (scope.role !== 'edit') {
      return NextResponse.json({ error: 'Calendar is read-only' }, { status: 403 });
    }

    await CalendarEvent.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
