import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { BookingStatusSchema } from '@/lib/booking/api-schemas';
import { setBookingStatus } from '@/lib/booking/bookings';
import { getBookingSettings } from '@/lib/booking/settings';
import { sendBookingCancelledEmail, sendBookingConfirmedEmail } from '@/lib/email/booking-notifications';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const result = BookingStatusSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const booking = await setBookingStatus(id, result.data.status);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Notify the customer on admin confirm/cancel (no manage token — it was only
  // ever emailed at creation time).
  if (result.data.status === 'confirmed' || result.data.status === 'cancelled') {
    const settings = await getBookingSettings();
    const send =
      result.data.status === 'confirmed' ? sendBookingConfirmedEmail : sendBookingCancelledEmail;
    await send({ booking, timezone: settings.timezone }).catch(() => undefined);
  }

  return NextResponse.json({ booking });
}
