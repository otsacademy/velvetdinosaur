import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { purgeOldBookings } from '@/lib/booking/bookings';

// GDPR retention sweep: deletes terminal bookings (cancelled/completed/no_show)
// older than the configured retention window.
export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const deletedCount = await purgeOldBookings();
  return NextResponse.json({ ok: true, deletedCount });
}
