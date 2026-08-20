import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { confirmNewsletterSubscriptionWithToken } from '@/lib/newsletter/confirm';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';
import { trackServerConversion } from '@/lib/analytics';

const PayloadSchema = z.object({
  token: z.string().trim().min(1)
});

export async function POST(request: Request) {
  unstable_noStore();
  const ip = getRequestIp(request.headers) || 'unknown';
  const rateLimit = checkRateLimit({
    id: 'api:newsletter:confirm',
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

  const result = await confirmNewsletterSubscriptionWithToken(parsed.data.token, {
    source: 'newsletter-confirm-api'
  });
  if (!result.ok) {
    const status = result.error === 'misconfigured' ? 500 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  await trackServerConversion(request, {
    conversionName: 'newsletter_confirmed',
    metadata: {
      source: 'newsletter-confirm-api',
      status: result.status
    }
  });

  return NextResponse.json({ ok: true, email: result.email, status: result.status });
}
