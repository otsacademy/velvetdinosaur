import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getServiceById, getServiceBySlug } from '@/lib/booking/catalog';
import { getAvailabilityForDate } from '@/lib/booking/bookings';
import { isValidDateStr } from '@/lib/booking/shared';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

// GET /api/bookings/availability?service=<slug>&date=YYYY-MM-DD[&resource=<id>]
export async function GET(request: Request) {
  unstable_noStore();
  const ip = getRequestIp(request.headers) || 'unknown';
  const limit = checkRateLimit({ id: 'bookings-availability', key: ip, limit: 60, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const url = new URL(request.url);
  const serviceSlug = (url.searchParams.get('service') || '').trim();
  const date = (url.searchParams.get('date') || '').trim();
  const resourceId = (url.searchParams.get('resource') || '').trim();

  if (!serviceSlug || !isValidDateStr(date)) {
    return NextResponse.json({ error: 'Missing or invalid service/date' }, { status: 400 });
  }

  // Accepts a service slug (public widget) or id (manage page).
  const service = (await getServiceBySlug(serviceSlug)) ?? (await getServiceById(serviceSlug));
  if (!service || !service.active) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 404 });
  }

  const slots = await getAvailabilityForDate({
    service,
    resourceId: resourceId || undefined,
    date
  });

  return NextResponse.json({
    slots: slots.map((slot) => ({ startAt: slot.startAt.toISOString(), endAt: slot.endAt.toISOString() }))
  });
}
