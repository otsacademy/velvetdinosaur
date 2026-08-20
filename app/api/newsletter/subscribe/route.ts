import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { NEWSLETTER_GDPR_LEGAL_TEXT_VERSION } from '@/lib/content/newsletter-gdpr';
import {
  sendNewsletterSubscribeConfirmationEmail,
  sendNewsletterSubscriptionVerificationEmail
} from '@/lib/email/newsletter-lifecycle';
import { verifyNewsletterCaptcha } from '@/lib/newsletter/captcha';
import { createNewsletterConfirmToken } from '@/lib/newsletter/confirm-token';
import {
  getNewsletterPreferenceByEmail,
  getNewsletterPreferenceForUser,
  setNewsletterConsentForUser
} from '@/lib/newsletter/consent';
import { getNewsletterSettings } from '@/lib/newsletter/settings';
import { clean, normalizeEmail } from '@/lib/newsletter/shared';
import { isNewsletterSuppressedEmail } from '@/lib/newsletter/suppression';
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

function parseClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const first = forwarded
    .split(',')
    .map((part) => part.trim())
    .find(Boolean);
  return first || request.headers.get('x-real-ip') || '';
}

async function requireSessionUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const rawUser = (session as { user?: { id?: string; email?: string; name?: string | null } } | null)?.user;
  const id = clean(rawUser?.id);
  const email = normalizeEmail(rawUser?.email);
  if (!id || !email) return null;
  return { id, email, name: clean(rawUser?.name) };
}

function buildPublicUserId(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return '';
  const digest = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 24);
  return `email:${digest}`;
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
    return NextResponse.json({ ok: true, ignored: true });
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
  const sessionFirstName = toFirstToken(user?.name);
  const contactFirstName = providedFirstName || sessionFirstName;
  const requestedEmail = normalizeEmail(parsed.data.email);
  const email = requestedEmail || user?.email || '';
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const perEmailDailyLimit = checkRateLimit({
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

  if (settings.blockSuppressedAddresses && (await isNewsletterSuppressedEmail(email))) {
    return NextResponse.json(
      {
        error: 'This email address is currently suppressed from delivery. Please contact support if this is in error.'
      },
      { status: 409 }
    );
  }

  let userId = user?.id || '';
  let prior = null as Awaited<ReturnType<typeof getNewsletterPreferenceForUser>> | null;

  if (userId) {
    prior = await getNewsletterPreferenceForUser(userId);
  } else {
    const priorByEmail = await getNewsletterPreferenceByEmail(email);
    prior = priorByEmail;
    userId = clean(priorByEmail?.userId) || buildPublicUserId(email);
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unable to process this email.' }, { status: 500 });
  }

  const priorFirstName = clean(prior?.firstName);
  const storedFirstName = contactFirstName || priorFirstName;
  const source = parsed.data.source || 'public-subscribe';
  const legalTextVersion = parsed.data.legalTextVersion || NEWSLETTER_GDPR_LEGAL_TEXT_VERSION;
  const actorType = user ? 'user' : 'public';
  const actorId = user?.id || userId;

  if (prior?.status === 'subscribed') {
    return NextResponse.json({ ok: true, alreadySubscribed: true, preference: prior });
  }

  if (settings.requireDoubleOptIn) {
    const token = createNewsletterConfirmToken({
      email,
      userId,
      ttlSeconds: settings.pendingTokenTtlMinutes * 60
    });
    if (!token) {
      return NextResponse.json({ error: 'Subscription confirmation is temporarily unavailable.' }, { status: 500 });
    }

    const preference = await setNewsletterConsentForUser({
      userId,
      email,
      firstName: storedFirstName,
      status: 'pending',
      source,
      legalTextVersion,
      actorType,
      actorId,
      ip: parseClientIp(request),
      userAgent: request.headers.get('user-agent') || '',
      reason: 'double-opt-in-requested'
    });

    const resendLimit = checkRateLimit({
      id: 'api:newsletter:subscribe:confirm-email',
      key: email,
      limit: 1,
      windowMs: settings.resendConfirmationCooldownMinutes * 60 * 1000
    });

    let confirmationEmailSent = false;
    if (resendLimit.ok || prior?.status !== 'pending') {
      confirmationEmailSent = true;
      void sendNewsletterSubscriptionVerificationEmail({
        email,
        firstName: storedFirstName || undefined,
        token,
        expiresInHours: Math.max(1, Math.round(settings.pendingTokenTtlMinutes / 60))
      }).catch((error) => {
        console.error('[newsletter] verification send failed', error);
      });
    }

    await trackServerConversion(request, {
      conversionName: 'newsletter_subscribe_request',
      metadata: {
        source,
        status: 'pending',
        confirmationEmailSent
      }
    });

    return NextResponse.json({
      ok: true,
      alreadySubscribed: false,
      requiresConfirmation: true,
      confirmationEmailSent,
      preference
    });
  }

  const preference = await setNewsletterConsentForUser({
    userId,
    email,
    firstName: storedFirstName,
    status: 'subscribed',
    source,
    legalTextVersion,
    actorType,
    actorId,
    ip: parseClientIp(request),
    userAgent: request.headers.get('user-agent') || ''
  });

  const becameSubscribed = preference?.status === 'subscribed';
  if (becameSubscribed) {
    void sendNewsletterSubscribeConfirmationEmail({
      email,
      firstName: storedFirstName || undefined
    }).catch((error) => {
      console.error('[newsletter] subscribe confirmation send failed', error);
    });

    await trackServerConversion(request, {
      conversionName: 'newsletter_subscribed',
      metadata: {
        source,
        status: 'subscribed',
        actorType
      }
    });
  }

  return NextResponse.json({ ok: true, alreadySubscribed: false, preference });
}
