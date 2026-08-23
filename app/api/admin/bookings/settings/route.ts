import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { BookingSettingsInputSchema } from '@/lib/booking/api-schemas';
import { getBookingSettings, updateBookingSettings } from '@/lib/booking/settings';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ settings: await getBookingSettings() });
}

export async function PUT(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const result = BookingSettingsInputSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid settings' }, { status: 400 });
  }
  const settings = await updateBookingSettings(result.data);
  return NextResponse.json({ settings });
}
