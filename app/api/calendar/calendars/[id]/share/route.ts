import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CalendarDefinition } from '@/models/CalendarDefinition';
import { shareCalendarDefinition } from '@/lib/calendar-access';

const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['view', 'edit']).default('edit')
});

async function requireApiUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const rawUser = (session as { user?: { id?: string; email?: string | null } } | null)?.user;
  if (!rawUser?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse };
  }

  return {
    user: {
      id: rawUser.id,
      email: String(rawUser.email || '').trim().toLowerCase() || null
    }
  };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const body = await request.json().catch(() => ({}));
  const parsed = shareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const ownerCalendar = await CalendarDefinition.findOne({
    ownerUserId: authResult.user.id,
    calendarId,
    archived: { $ne: true }
  }).lean();

  if (!ownerCalendar) {
    return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
  }

  if (parsed.data.email === authResult.user.email) {
    return NextResponse.json({ error: 'Cannot share a calendar with your own account' }, { status: 400 });
  }

  await shareCalendarDefinition({
    ownerUserId: authResult.user.id,
    calendarId,
    recipientEmail: parsed.data.email,
    role: parsed.data.role,
    createdByUserId: authResult.user.id
  });

  return NextResponse.json({ ok: true });
}
