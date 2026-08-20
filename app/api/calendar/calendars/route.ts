import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { calendarColors } from '@/models/CalendarDefinition';
import { createCalendarDefinition, listAccessibleCalendars } from '@/lib/calendar-access';

const createCalendarSchema = z.object({
  label: z.string().trim().min(1).max(80),
  color: z.enum(calendarColors).optional()
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
      email: rawUser.email || null
    }
  };
}

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);
  if ('error' in authResult) return authResult.error;

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const items = await listAccessibleCalendars({
    userId: authResult.user.id,
    email: authResult.user.email
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: `${item.ownerUserId}::${item.calendarId}`,
      ownerUserId: item.ownerUserId,
      calendarId: item.calendarId,
      label: item.label,
      color: item.color,
      owned: item.owned,
      role: item.role
    }))
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
  const parsed = createCalendarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const created = await createCalendarDefinition({
    ownerUserId: authResult.user.id,
    label: parsed.data.label,
    color: parsed.data.color || 'primary'
  });

  return NextResponse.json(
    {
      item: {
        id: `${created.ownerUserId}::${created.calendarId}`,
        ownerUserId: created.ownerUserId,
        calendarId: created.calendarId,
        label: created.label,
        color: created.color,
        owned: true,
        role: 'edit'
      }
    },
    { status: 201 }
  );
}
