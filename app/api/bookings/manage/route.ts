import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  BookingError,
  cancelBookingByToken,
  getBookingByToken,
  rescheduleBookingByToken
} from '@/lib/booking/bookings';
import { getBookingSettings } from '@/lib/booking/settings';
import { sendBookingAdminNotificationEmail, sendBookingCancelledEmail } from '@/lib/email/booking-notifications';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

const ManageSchema = z.object({
  token: z.string().trim().min(10).max(200),
  action: z.enum(['cancel', 'reschedule']),
  startAt: z.string().trim().optional()
});

function readToken(request: Request) {
  return (new URL(request.url).searchParams.get('token') || '').trim();
}

export async function GET(request: Request) {
  unstable_noStore();
  const ip = getRequestIp(request.headers) || 'unknown';
  const limit = checkRateLimit({ id: 'bookings-manage', key: ip, limit: 30, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const token = readToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  const booking = await getBookingByToken(token);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found or link expired' }, { status: 404 });
  }
  return NextResponse.json({ booking });
}

export async function POST(request: Request) {
  unstable_noStore();
  const ip = getRequestIp(request.headers) || 'unknown';
  const limit = checkRateLimit({ id: 'bookings-manage', key: ip, limit: 30, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const result = ManageSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { token, action, startAt } = result.data;

  try {
    const settings = await getBookingSettings();
    if (action === 'cancel') {
      const booking = await cancelBookingByToken(token);
      await Promise.allSettled([
        sendBookingCancelledEmail({ booking, timezone: settings.timezone }),
        sendBookingAdminNotificationEmail({
          booking: { ...booking, notes: booking.notes },
          timezone: settings.timezone,
          notifyEmail: settings.notifyEmail
        })
      ]);
      return NextResponse.json({ ok: true, booking });
    }

    if (!startAt) {
      return NextResponse.json({ error: 'Missing new start time' }, { status: 400 });
    }
    const newStartAt = new Date(startAt);
    if (Number.isNaN(newStartAt.getTime())) {
      return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
    }
    const booking = await rescheduleBookingByToken(token, newStartAt);
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[bookings] manage failed', error);
    return NextResponse.json({ error: 'Could not update the booking' }, { status: 500 });
  }
}
