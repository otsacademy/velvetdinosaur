import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getThemePayload } from '@/lib/theme';

export async function GET() {
  unstable_noStore();
  const payload = await getThemePayload();
  return NextResponse.json({ payload });
}
