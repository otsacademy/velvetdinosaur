import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { ManualBookingSchema } from '@/lib/booking/api-schemas';
import { BookingError, createBooking, listBookings } from '@/lib/booking/bookings';
import { getBookingSettings } from '@/lib/booking/settings';
import { sendBookingConfirmedEmail } from '@/lib/email/booking-notifications';
import { bookingStatuses } from '@/models/Booking';
import type { BookingStatus } from '@/lib/booking/shared';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const url = new URL(request.url);
  const statusParam = (url.searchParams.get('status') || '').trim() as BookingStatus;
  const status = (bookingStatuses as readonly string[]).includes(statusParam) ? statusParam : undefined;
  const fromParam = (url.searchParams.get('from') || '').trim();
  const toParam = (url.searchParams.get('to') || '').trim();
  const bookings = await listBookings({
    status,
    from: fromParam ? new Date(fromParam) : undefined,
    to: toParam ? new Date(toParam) : undefined,
    limit: Number(url.searchParams.get('limit')) || 200
  });
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const result = ManualBookingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });
  }
  const payload = result.data;
  const startAt = new Date(payload.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
  }
  try {
    const settings = await getBookingSettings();
    const { booking, manageToken } = await createBooking({
      serviceId: payload.serviceId,
      resourceId: payload.resourceId || undefined,
      startAt,
      customer: { name: payload.name, email: payload.email, phone: payload.phone },
      notes: payload.notes,
      source: 'admin'
    });
    await sendBookingConfirmedEmail({ booking, timezone: settings.timezone, manageToken }).catch(() => undefined);
    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[bookings] admin create failed', error);
    return NextResponse.json({ error: 'Could not create the booking' }, { status: 500 });
  }
}
