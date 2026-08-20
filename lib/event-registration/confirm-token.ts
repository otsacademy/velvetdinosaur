import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/event-registration/confirm-token.ts');

import crypto from 'node:crypto';
import { clean, normalizeEmail } from '@/lib/event-registration/shared';

type TokenPayload = {
  e: string;
  ev: string;
  r: string;
  iat: number;
  exp: number;
};

export type EventRegistrationConfirmTokenValidation =
  | {
      ok: true;
      email: string;
      eventId: string;
      registrationId: string;
      issuedAt: Date;
      expiresAt: Date;
    }
  | {
      ok: false;
      reason: 'invalid' | 'expired' | 'misconfigured';
    };

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function fromBase64Url(input: string) {
  try {
    return Buffer.from(input, 'base64url');
  } catch {
    return null;
  }
}

function getSigningSecret() {
  return (
    process.env.EVENT_REGISTRATION_CONFIRM_SECRET ||
    process.env.NEWSLETTER_CONFIRM_SECRET ||
    process.env.BETTERAUTH_SECRET ||
    process.env.CRON_SECRET ||
    ''
  ).trim();
}

function signPayload(payloadB64: string, secret: string) {
  return toBase64Url(crypto.createHmac('sha256', secret).update(payloadB64).digest());
}

function secureCompare(expected: string, candidate: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(candidate);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createEventRegistrationConfirmToken(input: {
  email: string;
  eventId: string;
  registrationId: string;
  ttlSeconds?: number;
}) {
  const secret = getSigningSecret();
  if (!secret) return '';

  const email = normalizeEmail(input.email);
  const eventId = clean(input.eventId);
  const registrationId = clean(input.registrationId);
  if (!email || !eventId || !registrationId) return '';

  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(60, Math.min(60 * 60 * 24 * 14, Math.round(input.ttlSeconds || 60 * 60 * 24 * 3)));
  const payload: TokenPayload = {
    e: email,
    ev: eventId,
    r: registrationId,
    iat: now,
    exp: now + ttl
  };
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export function validateEventRegistrationConfirmToken(
  rawToken: string
): EventRegistrationConfirmTokenValidation {
  const secret = getSigningSecret();
  if (!secret) return { ok: false, reason: 'misconfigured' };

  const token = clean(rawToken);
  if (!token) return { ok: false, reason: 'invalid' };

  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'invalid' };
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return { ok: false, reason: 'invalid' };

  const expectedSignature = signPayload(payloadB64, secret);
  if (!secureCompare(expectedSignature, signature)) {
    return { ok: false, reason: 'invalid' };
  }

  const payloadBuffer = fromBase64Url(payloadB64);
  if (!payloadBuffer) return { ok: false, reason: 'invalid' };

  let payload: TokenPayload | null = null;
  try {
    payload = JSON.parse(payloadBuffer.toString('utf8')) as TokenPayload;
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  const email = normalizeEmail(payload?.e);
  const eventId = clean(payload?.ev);
  const registrationId = clean(payload?.r);
  const iat = Number(payload?.iat || 0);
  const exp = Number(payload?.exp || 0);
  if (!email || !eventId || !registrationId || !Number.isFinite(iat) || !Number.isFinite(exp) || exp <= 0) {
    return { ok: false, reason: 'invalid' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (exp < now) return { ok: false, reason: 'expired' };

  return {
    ok: true,
    email,
    eventId,
    registrationId,
    issuedAt: new Date(iat * 1000),
    expiresAt: new Date(exp * 1000)
  };
}
