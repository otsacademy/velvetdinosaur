import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { resolveSupportDevelopmentHours } from '@/lib/support/external-snapshots';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = await resolveSupportDevelopmentHours();
  return NextResponse.json(payload);
}
