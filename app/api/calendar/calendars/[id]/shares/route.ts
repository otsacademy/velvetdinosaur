import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CalendarDefinition } from '@/models/CalendarDefinition';
import { listCalendarShares } from '@/lib/calendar-access';

async function requireApiUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const rawUser = (session as { user?: { id?: string } } | null)?.user;
  if (!rawUser?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse };
  }
  return { user: { id: rawUser.id } };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const { id } = await context.params;
  const calendarId = String(id || '').trim();
  if (!calendarId) {
    return NextResponse.json({ error: 'Calendar id is required' }, { status: 400 });
  }

  const ownerCalendar = await CalendarDefinition.findOne({
    ownerUserId: authResult.user.id,
    calendarId,
    archived: { $ne: true }
  }).lean();

  if (!ownerCalendar) {
    return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
  }

  const items = await listCalendarShares({
    ownerUserId: authResult.user.id,
    calendarId
  });

  return NextResponse.json({ items });
}
