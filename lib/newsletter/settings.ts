import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/settings.ts');

import { connectDB } from '@/lib/db';
import { ContactSettings } from '@/models/ContactSettings';

export type NewsletterCaptchaProvider = 'none' | 'turnstile';

export type NewsletterSettings = {
  requireDoubleOptIn: boolean;
  enableHoneypot: boolean;
  minSecondsToSubmit: number;
  rateLimitPerIpPerMinute: number;
  rateLimitPerIpPerHour: number;
  rateLimitPerEmailPerDay: number;
  requireCaptcha: boolean;
  captchaProvider: NewsletterCaptchaProvider;
  turnstileSiteKey: string;
  turnstileSecretKey: string;
  pendingTokenTtlMinutes: number;
  resendConfirmationCooldownMinutes: number;
  blockSuppressedAddresses: boolean;
};

export type PublicNewsletterSettings = {
  requireDoubleOptIn: boolean;
  enableHoneypot: boolean;
  minSecondsToSubmit: number;
  requireCaptcha: boolean;
  captchaProvider: NewsletterCaptchaProvider;
  turnstileSiteKey: string;
};

const DEFAULT_NEWSLETTER_SETTINGS: NewsletterSettings = {
  requireDoubleOptIn: true,
  enableHoneypot: true,
  minSecondsToSubmit: 3,
  rateLimitPerIpPerMinute: 20,
  rateLimitPerIpPerHour: 120,
  rateLimitPerEmailPerDay: 8,
  requireCaptcha: false,
  captchaProvider: 'none',
  turnstileSiteKey: '',
  turnstileSecretKey: '',
  pendingTokenTtlMinutes: 4320,
  resendConfirmationCooldownMinutes: 15,
  blockSuppressedAddresses: true
};

type ContactSettingsDoc = {
  newsletterSettings?: Partial<NewsletterSettings> | null;
};

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function toCaptchaProvider(value: unknown): NewsletterCaptchaProvider {
  return value === 'turnstile' ? 'turnstile' : 'none';
}

export function normalizeNewsletterSettings(raw: Partial<NewsletterSettings> | null | undefined): NewsletterSettings {
  const input = raw || {};
  return {
    requireDoubleOptIn: toBoolean(input.requireDoubleOptIn, DEFAULT_NEWSLETTER_SETTINGS.requireDoubleOptIn),
    enableHoneypot: toBoolean(input.enableHoneypot, DEFAULT_NEWSLETTER_SETTINGS.enableHoneypot),
    minSecondsToSubmit: toNumber(
      input.minSecondsToSubmit,
      DEFAULT_NEWSLETTER_SETTINGS.minSecondsToSubmit,
      0,
      30
    ),
    rateLimitPerIpPerMinute: toNumber(
      input.rateLimitPerIpPerMinute,
      DEFAULT_NEWSLETTER_SETTINGS.rateLimitPerIpPerMinute,
      1,
      300
    ),
    rateLimitPerIpPerHour: toNumber(
      input.rateLimitPerIpPerHour,
      DEFAULT_NEWSLETTER_SETTINGS.rateLimitPerIpPerHour,
      10,
      5000
    ),
    rateLimitPerEmailPerDay: toNumber(
      input.rateLimitPerEmailPerDay,
      DEFAULT_NEWSLETTER_SETTINGS.rateLimitPerEmailPerDay,
      1,
      200
    ),
    requireCaptcha: toBoolean(input.requireCaptcha, DEFAULT_NEWSLETTER_SETTINGS.requireCaptcha),
    captchaProvider: toCaptchaProvider(input.captchaProvider),
    turnstileSiteKey: toStringValue(input.turnstileSiteKey),
    turnstileSecretKey: toStringValue(input.turnstileSecretKey),
    pendingTokenTtlMinutes: toNumber(
      input.pendingTokenTtlMinutes,
      DEFAULT_NEWSLETTER_SETTINGS.pendingTokenTtlMinutes,
      10,
      60 * 24 * 14
    ),
    resendConfirmationCooldownMinutes: toNumber(
      input.resendConfirmationCooldownMinutes,
      DEFAULT_NEWSLETTER_SETTINGS.resendConfirmationCooldownMinutes,
      1,
      1440
    ),
    blockSuppressedAddresses: toBoolean(
      input.blockSuppressedAddresses,
      DEFAULT_NEWSLETTER_SETTINGS.blockSuppressedAddresses
    )
  };
}

export function toPublicNewsletterSettings(settings: NewsletterSettings): PublicNewsletterSettings {
  return {
    requireDoubleOptIn: settings.requireDoubleOptIn,
    enableHoneypot: settings.enableHoneypot,
    minSecondsToSubmit: settings.minSecondsToSubmit,
    requireCaptcha: settings.requireCaptcha,
    captchaProvider: settings.captchaProvider,
    turnstileSiteKey: settings.turnstileSiteKey
  };
}

export async function getNewsletterSettings() {
  await connectDB();
  const doc = (await ContactSettings.findOne({}, { newsletterSettings: 1 }).lean()) as ContactSettingsDoc | null;
  return normalizeNewsletterSettings(doc?.newsletterSettings);
}

export async function updateNewsletterSettings(next: Partial<NewsletterSettings>) {
  await connectDB();
  const normalized = normalizeNewsletterSettings(next);
  await ContactSettings.findOneAndUpdate(
    {},
    {
      $set: {
        newsletterSettings: normalized
      }
    },
    { upsert: true, new: true }
  );
  return normalized;
}

export function getDefaultNewsletterSettings() {
  return { ...DEFAULT_NEWSLETTER_SETTINGS };
}
