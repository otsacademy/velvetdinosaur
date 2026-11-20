import { beforeEach, describe, expect, mock, test } from 'bun:test';

// Route wiring only: sign-up email limits go to the durable limiter, and stored
// consent evidence records the proxy-overwritten address. The durable limiter is
// a counter with the same contract; durable-rate-limit.test.ts covers the Mongo one.
type LimitInput = { id: string; key: string; limit: number; windowMs: number };
const durableCounts = new Map<string, number>();
const durableCalls: LimitInput[] = [];
const evidenceIps: string[] = [];
let priorRegistration: { status: string } | null = null;

const settings = {
  requireDoubleOptIn: true,
  enableHoneypot: true,
  minSecondsToSubmit: 0,
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
const user = { id: 'user-1', email: 'alex@example.test', name: 'Alex Example' };

mock.module('@/lib/security/durable-rate-limit', () => ({
  checkDurableRateLimit: async (input: LimitInput) => {
    durableCalls.push(input);
    const key = `${input.id}:${input.key}`;
    const count = (durableCounts.get(key) ?? 0) + 1;
    durableCounts.set(key, count);
    return { ok: count <= input.limit, retryAfterSeconds: 3600, key };
  }
}));
mock.module('@/lib/newsletter/settings', () => ({ getNewsletterSettings: async () => settings }));
mock.module('@/lib/newsletter/captcha', () => ({ verifyNewsletterCaptcha: async () => ({ ok: true }) }));
mock.module('@/lib/auth', () => ({ getAuth: () => ({ api: { getSession: async () => ({ user }) } }) }));
mock.module('@/lib/newsletter/auth', () => ({ requireAdminFromHeaders: async () => ({ id: 'admin-1' }) }));
mock.module('@/lib/analytics', () => ({ trackServerConversion: async () => ({ ok: true, skipped: true }) }));
mock.module('@/lib/newsletter/suppression', () => ({ isNewsletterSuppressedEmail: async () => false }));
mock.module('@/lib/newsletter/confirm-token', () => ({ createNewsletterConfirmToken: () => 'newsletter-token' }));
mock.module('@/lib/newsletter/consent', () => ({
  ensureNewsletterPreferenceForUser: async () => null,
  ensureNewsletterPreferencesForRegisteredUsers: async () => undefined,
  getNewsletterPreferenceByEmail: async () => null,
  getNewsletterPreferenceForUser: async () => null,
  listNewsletterPreferences: async () => [],
  setNewsletterConsentForUser: async (input: { ip?: string; status: string }) => {
    evidenceIps.push(input.ip ?? '');
    return { status: input.status };
  }
}));
mock.module('@/lib/email/newsletter-lifecycle', () => ({
  sendNewsletterSubscribeConfirmationEmail: async () => undefined,
  sendNewsletterSubscriptionVerificationEmail: async () => undefined,
  sendNewsletterUnsubscribeConfirmationEmail: async () => undefined
}));
mock.module('@/lib/events.server', () => ({
  getPublishedEventBySlug: async (slug: string) => ({
    id: 'event-1', slug, title: 'Test event', registrationMode: 'local',
    date: '2026-12-01', startTime: '10:00', endTime: '11:00', venue: 'Online', location: ''
  })
}));
mock.module('@/lib/event-registration/registrations', () => ({
  getEventRegistrationByEmail: async () => priorRegistration,
  createOrUpdatePendingEventRegistration: async (input: { ip?: string; eventId: string; eventSlug: string; email: string; fullName: string }) => {
    evidenceIps.push(input.ip ?? '');
    return { id: 'registration-1', eventId: input.eventId, eventSlug: input.eventSlug, email: input.email, firstName: 'Alex', fullName: input.fullName };
  },
  writeEventRegistrationEvent: async (input: { ip?: string }) => { evidenceIps.push(input.ip ?? ''); }
}));
mock.module('@/lib/event-registration/confirm-token', () => ({ createEventRegistrationConfirmToken: () => 'event-token' }));
mock.module('@/lib/email/event-registration-lifecycle', () => ({ sendEventRegistrationVerificationEmail: async () => undefined }));

const subscribe = await import('@/app/api/newsletter/subscribe/route');
const register = await import('@/app/api/events/[slug]/register/route');
const consent = await import('@/app/api/newsletter/consent/route');
const subscribers = await import('@/app/api/admin/newsletter/subscribers/route');

const forgedHeaders = {
  'content-type': 'application/json',
  'x-real-ip': '192.0.2.1',
  'x-forwarded-for': '203.0.113.10, 192.0.2.1',
  'cf-connecting-ip': '203.0.113.10'
};

function call(path: string, method: string, body: unknown) {
  return new Request(`https://example.test${path}`, { method, headers: forgedHeaders, body: JSON.stringify(body) });
}

beforeEach(() => {
  durableCounts.clear();
  durableCalls.length = 0;
  evidenceIps.length = 0;
  priorRegistration = null;
});

describe('newsletter and event sign-ups', () => {
  test('newsletter sign-ups keep their email limits in Mongo and record the trusted address', async () => {
    const response = await subscribe.POST(call('/api/newsletter/subscribe', 'POST', { email: 'alex@example.test', gdprConsent: true }));
    expect(response.status).toBe(200);
    expect(evidenceIps).toEqual(['192.0.2.1']);
    expect(durableCalls).toEqual([
      { id: 'api:newsletter:subscribe:email-day', key: 'alex@example.test', limit: 8, windowMs: 86_400_000 },
      { id: 'api:newsletter:subscribe:confirm-email', key: 'alex@example.test', limit: 1, windowMs: 15 * 60_000 }
    ]);
    for (let i = 1; i < 8; i++) {
      expect((await subscribe.POST(call('/api/newsletter/subscribe', 'POST', { email: 'alex@example.test', gdprConsent: true }))).status).toBe(200);
    }
    expect((await subscribe.POST(call('/api/newsletter/subscribe', 'POST', { email: 'alex@example.test', gdprConsent: true }))).status).toBe(429);
  });

  test('event registrations keep their email limits in Mongo and record the trusted address', async () => {
    priorRegistration = { status: 'pending' };
    const params = { params: Promise.resolve({ slug: 'test-event' }) };
    const body = { fullName: 'Alex Example', email: 'alex@example.test', gdprConsent: true };
    expect((await register.POST(call('/api/events/test-event/register', 'POST', body), params)).status).toBe(200);
    expect(evidenceIps).toEqual(['192.0.2.1', '192.0.2.1']);
    expect(durableCalls).toEqual([
      { id: 'api:event-registration:submit:email-day', key: 'event-1:alex@example.test', limit: 8, windowMs: 86_400_000 },
      { id: 'api:event-registration:confirm-email', key: 'event-1:alex@example.test', limit: 1, windowMs: 15 * 60_000 }
    ]);
  });

  test('consent changes by a signed-in visitor or an admin record the trusted address', async () => {
    expect((await consent.PATCH(call('/api/newsletter/consent', 'PATCH', { subscribed: true }))).status).toBe(200);
    const update = { userId: 'user-1', email: 'alex@example.test', subscribed: false };
    expect((await subscribers.PATCH(call('/api/admin/newsletter/subscribers', 'PATCH', update))).status).toBe(200);
    expect(evidenceIps).toEqual(['192.0.2.1', '192.0.2.1']);
  });
});
