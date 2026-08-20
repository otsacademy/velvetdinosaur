import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/confirm-token.ts');

import crypto from 'node:crypto';
import { clean, normalizeEmail } from '@/lib/newsletter/shared';

type TokenPayload = {
  e: string;
  u: string;
  iat: number;
  exp: number;
};

export type NewsletterConfirmTokenValidation =
  | {
      ok: true;
      email: string;
      userId: string;
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
    process.env.NEWSLETTER_CONFIRM_SECRET ||
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
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

export function createNewsletterConfirmToken(input: {
  email: string;
  userId: string;
  ttlSeconds?: number;
}) {
  const secret = getSigningSecret();
  if (!secret) return '';

  const email = normalizeEmail(input.email);
  const userId = clean(input.userId);
  if (!email || !userId) return '';

  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(60, Math.min(60 * 60 * 24 * 14, Math.round(input.ttlSeconds || 60 * 60 * 24 * 3)));
  const payload: TokenPayload = {
    e: email,
    u: userId,
    iat: now,
    exp: now + ttl
  };
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export function validateNewsletterConfirmToken(rawToken: string): NewsletterConfirmTokenValidation {
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
  const userId = clean(payload?.u);
  const iat = Number(payload?.iat || 0);
  const exp = Number(payload?.exp || 0);
  if (!email || !userId || !Number.isFinite(iat) || !Number.isFinite(exp) || exp <= 0) {
    return { ok: false, reason: 'invalid' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (exp < now) return { ok: false, reason: 'expired' };

  return {
    ok: true,
    email,
    userId,
    issuedAt: new Date(iat * 1000),
    expiresAt: new Date(exp * 1000)
  };
}
