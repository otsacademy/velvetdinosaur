import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/captcha.ts');

import { clean } from '@/lib/newsletter/shared';
import { type NewsletterSettings } from '@/lib/newsletter/settings';

export type CaptchaVerificationResult =
  | { ok: true }
  | { ok: false; reason: 'missing-token' | 'verification-failed' | 'misconfigured' };

function resolveTurnstileSecret(settings: NewsletterSettings) {
  return clean(settings.turnstileSecretKey) || clean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyNewsletterCaptcha(input: {
  token?: string;
  ip?: string;
  settings: NewsletterSettings;
}): Promise<CaptchaVerificationResult> {
  const { settings } = input;
  if (!settings.requireCaptcha) return { ok: true };

  if (settings.captchaProvider !== 'turnstile') {
    return { ok: false, reason: 'misconfigured' };
  }

  const secret = resolveTurnstileSecret(settings);
  if (!secret) return { ok: false, reason: 'misconfigured' };

  const token = clean(input.token);
  if (!token) return { ok: false, reason: 'missing-token' };

  const payload = new URLSearchParams();
  payload.set('secret', secret);
  payload.set('response', token);
  const ip = clean(input.ip);
  if (ip) payload.set('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: payload
  }).catch(() => null);

  if (!response?.ok) {
    return { ok: false, reason: 'verification-failed' };
  }

  const data = (await response.json().catch(() => null)) as { success?: unknown } | null;
  if (data?.success === true) return { ok: true };
  return { ok: false, reason: 'verification-failed' };
}
