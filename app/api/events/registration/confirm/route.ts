import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { confirmEventRegistrationWithToken } from '@/lib/event-registration/confirm';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

const PayloadSchema = z.object({
  token: z.string().trim().min(1)
});

export async function POST(request: Request) {
  unstable_noStore();
  const ip = getRequestIp(request.headers) || 'unknown';
  const rateLimit = checkRateLimit({
    id: 'api:event-registration:confirm',
    key: ip,
    limit: 50,
    windowMs: 60_000
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) }
      }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const result = await confirmEventRegistrationWithToken(parsed.data.token, {
    source: 'event-registration-confirm-api'
  });
  if (!result.ok) {
    const status = result.error === 'misconfigured' ? 500 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
