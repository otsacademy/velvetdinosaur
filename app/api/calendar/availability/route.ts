import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CalendarEvent } from '@/models/CalendarEvent';

function toMinutes(value: string) {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function toClock(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const url = new URL(request.url);
  const dateKey = String(url.searchParams.get('dateKey') || '').trim();
  const startClock = String(url.searchParams.get('start') || '09:00').trim();
  const endClock = String(url.searchParams.get('end') || '18:00').trim();
  const slotMinutes = Math.min(Math.max(Number(url.searchParams.get('slotMinutes') || '30') || 30, 15), 180);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: 'Invalid dateKey' }, { status: 400 });
  }

  const startMin = toMinutes(startClock);
  const endMin = toMinutes(endClock);
  if (startMin == null || endMin == null || startMin >= endMin) {
    return NextResponse.json({ error: 'Invalid availability window' }, { status: 400 });
  }

  const events = await CalendarEvent.find({ userId: authResult.user.id, dateKey })
    .select({ time: 1, durationMin: 1 })
    .lean();

  const occupied = (Array.isArray(events) ? events : [])
    .map((event) => {
      const start = toMinutes(String((event as { time?: string }).time || ''));
      if (start == null) return null;
      const duration = Math.min(Math.max(Number((event as { durationMin?: number }).durationMin || 60), 15), 480);
      return { start, end: start + duration };
    })
    .filter((entry): entry is { start: number; end: number } => Boolean(entry))
    .sort((a, b) => a.start - b.start);

  const slots: string[] = [];
  for (let cursor = startMin; cursor + slotMinutes <= endMin; cursor += slotMinutes) {
    const nextEnd = cursor + slotMinutes;
    const overlaps = occupied.some((entry) => cursor < entry.end && nextEnd > entry.start);
    if (!overlaps) slots.push(toClock(cursor));
  }

  return NextResponse.json({
    dateKey,
    slotMinutes,
    start: startClock,
    end: endClock,
    slots
  });
}
