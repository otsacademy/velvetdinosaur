import { beforeEach, expect, mock, test } from 'bun:test';

let session: { user: { id: string; email: string; name: string } } | null = null;
let draftReads = 0;
const requests: Array<{ email: string; userId?: string }> = [];
mock.module('next/cache', () => ({ unstable_noStore() {} }));
mock.module('next/server', () => ({ NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) }, after() {} }));
mock.module('@/lib/auth', () => ({ getAuth: () => ({ api: { getSession: async () => session } }) }));
mock.module('@/lib/site-config', () => ({ isAdminOnly: () => false }));
mock.module('@/lib/security/editor-smoke', () => ({ isEditorSmokeRequest: () => false }));
mock.module('@/lib/pages', () => ({ getDraftPageData: async () => { draftReads++; return { content: [] }; } }));
mock.module('@/puck/validate', () => ({ sanitizeData: (value: unknown) => value }));
mock.module('@/lib/analytics', () => ({ trackServerConversion: async () => {} }));
mock.module('@/lib/newsletter/captcha', () => ({ verifyNewsletterCaptcha: async () => ({ ok: true }) }));
mock.module('@/lib/security/durable-rate-limit', () => ({ checkDurableRateLimit: async () => ({ ok: true }) }));
mock.module('@/lib/newsletter/settings', () => ({ getNewsletterSettings: async () => ({ requireDoubleOptIn: true, minSecondsToSubmit: 0, blockSuppressedAddresses: true,
  resendConfirmationCooldownMinutes: 15, pendingTokenTtlMinutes: 1440, rateLimitPerIpPerMinute: 20, rateLimitPerIpPerHour: 120, rateLimitPerEmailPerDay: 8 }) }));
mock.module('@/lib/email/notification-outbox', () => ({ flushNotification: async () => {} }));
mock.module('@/lib/newsletter/signup-request', () => ({ requestNewsletterSubscription: async (input: { email: string; userId?: string }) => { requests.push(input); return null; } }));
mock.module('@/lib/event-registration/signup-request', () => ({ requestEventRegistration: async (input: { email: string; userId?: string }) => { requests.push(input); return null; } }));
mock.module('@/lib/events.server', () => ({ getPublishedEventBySlug: async () => ({ id: 'event', slug: 'test', title: 'Test', registrationMode: 'local' }) }));
mock.module('@/lib/events', () => ({ getEventRegistrationWindow: () => ({ status: 'open' }) }));

const { GET: draft } = await import('@/app/api/puck/load/route');
const { POST: subscribe } = await import('@/app/api/newsletter/subscribe/route');
const { POST: register } = await import('@/app/api/events/[slug]/register/route');
beforeEach(() => { session = null; draftReads = 0; requests.length = 0; });
function signup(email: string) { return new Request('https://example.test/api/newsletter/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, fullName: 'Test Person', firstName: 'Test', gdprConsent: true }) }); }

test('anonymous draft access fails before fetching or caching draft data', async () => {
  const response = await draft(new Request('https://example.test/api/puck/load?slug=unpublished'));
  expect(response.status).toBe(401); expect(draftReads).toBe(0);
  expect(response.headers.get('cache-control')).toContain('no-store');
  session = { user: { id: 'editor', email: 'editor@example.test', name: 'Editor' } };
  const authorized = await draft(new Request('https://example.test/api/puck/load?slug=unpublished'));
  expect(authorized.status).toBe(200); expect(draftReads).toBe(1); expect(authorized.headers.get('cache-control')).toContain('no-store');
});
test('public newsletter and event responses contain only a generic acknowledgement', async () => {
  for (const email of ['new@example.test', 'pending@example.test', 'subscribed@example.test', 'suppressed@example.test']) {
    for (const response of [await subscribe(signup(email)), await register(signup(email), { params: Promise.resolve({ slug: 'test' }) })]) {
      expect(response.status).toBe(200);
      const body = await response.json(); expect(Object.keys(body).sort()).toEqual(['message', 'ok']); expect(body.ok).toBe(true);
      expect(JSON.stringify(body)).not.toContain(email);
    }
  }
});
test('a signed-in user cannot bind somebody else’s email to their account', async () => {
  session = { user: { id: 'account', email: 'own@example.test', name: 'Account Owner' } };
  await subscribe(signup('different@example.test'));
  await register(signup('different@example.test'), { params: Promise.resolve({ slug: 'test' }) });
  expect(requests.map((request) => request.userId)).toEqual([undefined, undefined]);
});
