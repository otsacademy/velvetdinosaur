import { after } from 'next/server';
import { flushNotification } from '@/lib/email/notification-outbox';
import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { SIGNUP_ACKNOWLEDGEMENT } from '@/lib/email/public-acknowledgement';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { NEWSLETTER_GDPR_LEGAL_TEXT_VERSION } from '@/lib/content/newsletter-gdpr';
import { getNewsletterSettings } from '@/lib/newsletter/settings';
import { clean, normalizeEmail } from '@/lib/newsletter/shared';
import { requestNewsletterSubscription } from '@/lib/newsletter/signup-request';
import { checkDurableRateLimit } from '@/lib/security/durable-rate-limit';
import { verifyNewsletterCaptcha } from '@/lib/newsletter/captcha';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';
import { trackServerConversion } from '@/lib/analytics';

const SubscribeSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  email: z.string().trim().email().optional(),
  gdprConsent: z.boolean().optional(),
  source: z.string().trim().max(120).optional(),
  legalTextVersion: z.string().trim().max(32).optional(),
  honeypot: z.string().trim().max(200).optional(),
  formStartedAt: z.number().optional(),
  captchaToken: z.string().trim().max(4000).optional()
});

async function requireSessionUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const rawUser = (session as { user?: { id?: string; email?: string; name?: string | null } } | null)?.user;
  const id = clean(rawUser?.id);
  const email = normalizeEmail(rawUser?.email);
  if (!id || !email) return null;
  return { id, email, name: clean(rawUser?.name) };
}

function toFirstToken(value: string | undefined | null) {
  const cleaned = clean(value);
  if (!cleaned) return '';
  return cleaned.split(/\s+/).find(Boolean) || '';
}

export async function POST(request: Request) {
  unstable_noStore();
  const settings = await getNewsletterSettings();
  const ip = getRequestIp(request.headers) || 'unknown';

  const perMinuteLimit = checkRateLimit({
    id: 'api:newsletter:subscribe:ip-minute',
    key: ip,
    limit: settings.rateLimitPerIpPerMinute,
    windowMs: 60_000
  });
  if (!perMinuteLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      {
        status: 429,
        headers: { 'Retry-After': String(perMinuteLimit.retryAfterSeconds) }
      }
    );
  }

  const perHourLimit = checkRateLimit({
    id: 'api:newsletter:subscribe:ip-hour',
    key: ip,
    limit: settings.rateLimitPerIpPerHour,
    windowMs: 60 * 60 * 1000
  });
  if (!perHourLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(perHourLimit.retryAfterSeconds) }
      }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (settings.enableHoneypot && clean(parsed.data.honeypot)) {
    // Pretend success for bots to reduce attack feedback loops.
    return NextResponse.json(SIGNUP_ACKNOWLEDGEMENT);
  }

  if (settings.minSecondsToSubmit > 0) {
    const startedAt = Number(parsed.data.formStartedAt || 0);
    if (Number.isFinite(startedAt) && startedAt > 0) {
      const elapsedMs = Date.now() - Math.round(startedAt);
      if (elapsedMs >= 0 && elapsedMs < settings.minSecondsToSubmit * 1000) {
        return NextResponse.json({ error: 'Form submitted too quickly. Please try again.' }, { status: 400 });
      }
    }
  }

  if (parsed.data.gdprConsent !== true) {
    return NextResponse.json({ error: 'GDPR consent is required before subscribing.' }, { status: 400 });
  }

  const captcha = await verifyNewsletterCaptcha({
    token: parsed.data.captchaToken,
    ip,
    settings
  });
  if (!captcha.ok) {
    const error = captcha.reason === 'misconfigured' ? 'Captcha is temporarily unavailable.' : 'Captcha verification failed.';
    const status = captcha.reason === 'misconfigured' ? 500 : 400;
    return NextResponse.json({ error }, { status });
  }

  const user = await requireSessionUser(request);
  const providedFirstName = toFirstToken(parsed.data.firstName);
  const sessionFirstName = !parsed.data.email || normalizeEmail(parsed.data.email) === user?.email ? toFirstToken(user?.name) : '';
  const contactFirstName = providedFirstName || sessionFirstName;
  const requestedEmail = normalizeEmail(parsed.data.email);
  const email = requestedEmail || user?.email || '';
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const perEmailDailyLimit = await checkDurableRateLimit({
    id: 'api:newsletter:subscribe:email-day',
    key: email,
    limit: settings.rateLimitPerEmailPerDay,
    windowMs: 24 * 60 * 60 * 1000
  });
  if (!perEmailDailyLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests for this email. Please try again tomorrow.' },
      {
        status: 429,
        headers: { 'Retry-After': String(perEmailDailyLimit.retryAfterSeconds) }
      }
    );
  }

  const notificationKey = await requestNewsletterSubscription({
    email, firstName: contactFirstName, userId: user?.email === email ? user.id : undefined,
    source: parsed.data.source || "public-subscribe", legalTextVersion: parsed.data.legalTextVersion || NEWSLETTER_GDPR_LEGAL_TEXT_VERSION,
    ip: getRequestIp(request.headers), userAgent: request.headers.get("user-agent") || "", doubleOptIn: settings.requireDoubleOptIn, blockSuppressed: settings.blockSuppressedAddresses,
    ttlMinutes: settings.pendingTokenTtlMinutes, cooldownMinutes: settings.resendConfirmationCooldownMinutes
  });
  await trackServerConversion(request, { conversionName: "newsletter_subscribe_request", metadata: { source: parsed.data.source || "public-subscribe" } });
  if (notificationKey) after(() => flushNotification(notificationKey));
  return NextResponse.json(SIGNUP_ACKNOWLEDGEMENT, { headers: { "Cache-Control": "no-store" } });
}
