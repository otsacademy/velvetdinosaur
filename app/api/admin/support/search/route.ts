import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { searchSupportPortal } from '@/lib/support/search';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getRequestIp(request.headers) || 'unknown';
  const rateLimit = checkRateLimit({
    id: 'api:admin:support-search',
    key: `${admin.id}:${ip}`,
    limit: 120,
    windowMs: 60_000
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many search requests. Please wait and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) }
      }
    );
  }

  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q'));
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 30)));

  const payload = await searchSupportPortal(q, limit);
  return NextResponse.json(payload);
}
