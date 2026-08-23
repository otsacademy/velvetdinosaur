import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { getBookingsOverview } from '@/lib/booking/bookings';
import { listResources, listServices } from '@/lib/booking/catalog';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const [overview, services, resources] = await Promise.all([
    getBookingsOverview(),
    listServices(),
    listResources()
  ]);
  return NextResponse.json({ ...overview, services, resources });
}
