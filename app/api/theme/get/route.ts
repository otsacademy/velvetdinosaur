import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { getThemePayload } from '@/lib/theme';

export async function GET(request: Request) {
  unstable_noStore();
  // Public by design: published theme tokens are safe to expose.
  const gate = await authorize(request, 'public');
  if (!gate.ok) return gate.response;

  const payload = await getThemePayload();
  return NextResponse.json({ payload });
}
