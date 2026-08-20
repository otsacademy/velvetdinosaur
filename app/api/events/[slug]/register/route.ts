import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { EVENT_REGISTRATION_GDPR_LEGAL_TEXT_VERSION } from '@/lib/content/event-registration-gdpr';
import { sendEventRegistrationVerificationEmail } from '@/lib/email/event-registration-lifecycle';
import { createEventRegistrationConfirmToken } from '@/lib/event-registration/confirm-token';
import {
  getEventRegistrationByEmail,
  createOrUpdatePendingEventRegistration,
  writeEventRegistrationEvent
} from '@/lib/event-registration/registrations';
import { clean, normalizeEmail, toFullName } from '@/lib/event-registration/shared';
import { getNewsletterSettings } from '@/lib/newsletter/settings';
import { verifyNewsletterCaptcha } from '@/lib/newsletter/captcha';
import { getPublishedEventBySlug } from '@/lib/events.server';
import { getEventRegistrationWindow } from '@/lib/events';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

const RegisterSchema = z.object({
  fullName: z.string().trim().max(160).optional(),
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

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  unstable_noStore();
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  if (event.registrationMode !== 'local' || !event.id) {
    return NextResponse.json({ error: 'Local registration is not enabled for this event' }, { status: 409 });
  }
  const registrationWindow = getEventRegistrationWindow(event);
  if (registrationWindow.status === 'opens-later') {
    return NextResponse.json({ error: 'Registration is not open yet for this event' }, { status: 409 });
  }
  if (registrationWindow.status === 'closed') {
    return NextResponse.json({ error: 'Registration has closed for this event' }, { status: 409 });
  }

  const settings = await getNewsletterSettings();
  const ip = getRequestIp(request.headers) || 'unknown';

  const perMinuteLimit = checkRateLimit({
    id: 'api:event-registration:submit:ip-minute',
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
    id: 'api:event-registration:submit:ip-hour',
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
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (settings.enableHoneypot && clean(parsed.data.honeypot)) {
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
    return NextResponse.json({ error: 'GDPR consent is required before registering.' }, { status: 400 });
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
  const email = normalizeEmail(parsed.data.email) || user?.email || '';
  const fullName = toFullName(parsed.data.fullName || user?.name, email);
  if (!email || !fullName) {
    return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 });
  }

  const perEmailDailyLimit = checkRateLimit({
    id: 'api:event-registration:submit:email-day',
    key: `${event.id}:${email}`,
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

  const prior = await getEventRegistrationByEmail(event.id, email);
  if (prior?.status === 'confirmed') {
    return NextResponse.json({
      ok: true,
      alreadyRegistered: true,
      alreadyConfirmed: true,
      registration: prior
    });
  }

  const source = parsed.data.source || 'public-event-registration';
  const legalTextVersion = parsed.data.legalTextVersion || EVENT_REGISTRATION_GDPR_LEGAL_TEXT_VERSION;
  const actorType = user ? 'user' : 'public';
  const actorId = user?.id || email;
  const registration = await createOrUpdatePendingEventRegistration({
    eventId: event.id,
    eventSlug: event.slug,
    eventTitle: event.title,
    userId: user?.id || '',
    email,
    fullName,
    source,
    legalTextVersion,
    actorType,
    actorId,
    ip: parseClientIp(request),
    userAgent: request.headers.get('user-agent') || '',
    reason: 'registration-requested'
  });

  if (!registration) {
    return NextResponse.json({ error: 'Unable to save registration' }, { status: 500 });
  }

  const token = createEventRegistrationConfirmToken({
    email,
    eventId: event.id,
    registrationId: registration.id,
    ttlSeconds: settings.pendingTokenTtlMinutes * 60
  });
  if (!token) {
    return NextResponse.json({ error: 'Registration confirmation is temporarily unavailable.' }, { status: 500 });
  }

  const resendLimit = checkRateLimit({
    id: 'api:event-registration:confirm-email',
    key: `${event.id}:${email}`,
    limit: 1,
    windowMs: settings.resendConfirmationCooldownMinutes * 60 * 1000
  });

  let confirmationEmailSent = false;
  if (resendLimit.ok || prior?.status !== 'pending') {
    confirmationEmailSent = true;
    if (prior?.status === 'pending') {
      await writeEventRegistrationEvent({
        registrationId: registration.id,
        eventId: registration.eventId,
        eventSlug: registration.eventSlug,
        email: registration.email,
        eventType: 'resend-confirmation',
        source,
        legalTextVersion,
        actorType,
        actorId,
        ip: parseClientIp(request),
        userAgent: request.headers.get('user-agent') || '',
        reason: 'resent-confirmation-link'
      });
    }
    void sendEventRegistrationVerificationEmail({
      email,
      firstName: registration.firstName || registration.fullName,
      eventTitle: event.title,
      eventSlug: event.slug,
      eventDateLabel: `${event.date} ${event.startTime} - ${event.endTime}`.trim(),
      eventLocation: `${event.venue} ${event.location}`.trim(),
      token,
      expiresInHours: Math.max(1, Math.round(settings.pendingTokenTtlMinutes / 60))
    }).catch((error) => {
      console.error('[event-registration] verification send failed', error);
    });
  }

  return NextResponse.json({
    ok: true,
    alreadyRegistered: false,
    requiresConfirmation: true,
    confirmationEmailSent,
    registration
  });
}
