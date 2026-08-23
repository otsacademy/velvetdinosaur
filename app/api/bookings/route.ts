import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAnalyticsLead, forwardAnalyticsEvent } from '@/lib/analytics';
import { getServiceBySlug } from '@/lib/booking/catalog';
import { BookingError, createBooking } from '@/lib/booking/bookings';
import { getBookingSettings } from '@/lib/booking/settings';
import {
  sendBookingAdminNotificationEmail,
  sendBookingConfirmedEmail,
  sendBookingRequestReceivedEmail
} from '@/lib/email/booking-notifications';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

const CreateBookingSchema = z.object({
  serviceSlug: z.string().trim().min(1).max(120),
  resourceId: z.string().trim().max(64).optional(),
  startAt: z.string().trim().datetime({ offset: true }).or(z.string().trim().datetime()),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
  honeypot: z.string().trim().max(200).optional(),
  formStartedAt: z.number().optional()
});

export async function POST(request: Request) {
  unstable_noStore();
  const body = await request.json().catch(() => ({}));
  const result = CreateBookingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid booking submission' }, { status: 400 });
  }
  const payload = result.data;

  // Honeypot: pretend success, do nothing.
  if (payload.honeypot) {
    return NextResponse.json({ ok: true });
  }

  // Minimum time-to-submit: reject bots that fire instantly.
  if (typeof payload.formStartedAt === 'number' && Date.now() - payload.formStartedAt < 2000) {
    return NextResponse.json({ ok: true });
  }

  const ip = getRequestIp(request.headers) || 'unknown';
  const perMinute = checkRateLimit({ id: 'bookings-create-ip-m', key: ip, limit: 10, windowMs: 60_000 });
  const perHour = checkRateLimit({ id: 'bookings-create-ip-h', key: ip, limit: 40, windowMs: 3_600_000 });
  const perEmail = checkRateLimit({
    id: 'bookings-create-email-d',
    key: payload.email.toLowerCase(),
    limit: 10,
    windowMs: 86_400_000
  });
  if (!perMinute.ok || !perHour.ok || !perEmail.ok) {
    return NextResponse.json({ error: 'Too many requests — please try again later' }, { status: 429 });
  }

  const service = await getServiceBySlug(payload.serviceSlug);
  if (!service || !service.active) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 404 });
  }

  const startAt = new Date(payload.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
  }

  try {
    const settings = await getBookingSettings();
    const { booking, manageToken } = await createBooking({
      serviceId: service.id,
      resourceId: payload.resourceId || undefined,
      startAt,
      customer: { name: payload.name, email: payload.email, phone: payload.phone },
      notes: payload.notes,
      source: 'public'
    });

    const emailInput = { booking, timezone: settings.timezone, manageToken };
    await Promise.allSettled([
      booking.status === 'confirmed'
        ? sendBookingConfirmedEmail(emailInput)
        : sendBookingRequestReceivedEmail(emailInput),
      sendBookingAdminNotificationEmail({ ...emailInput, notifyEmail: settings.notifyEmail }),
      createAnalyticsLead(request, {
        leadType: 'booking',
        leadName: 'booking_created',
        sourceRoute: '/api/bookings',
        status: 'new',
        contact: { name: payload.name, email: payload.email },
        metadata: { serviceSlug: service.slug, bookingStatus: booking.status }
      }),
      forwardAnalyticsEvent(request, {
        eventType: 'conversion',
        eventName: 'booking_created',
        eventCategory: 'booking',
        conversionName: 'booking_created',
        metadata: { serviceSlug: service.slug }
      })
    ]);

    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[bookings] create failed', error);
    return NextResponse.json({ error: 'Could not create the booking' }, { status: 500 });
  }
}
