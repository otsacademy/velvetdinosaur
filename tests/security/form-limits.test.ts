import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

// Route wiring only. The durable limiter is replaced by a counter with the same
// contract; tests/security/durable-rate-limit.test.ts covers the Mongo version.
type LimitInput = { id: string; key: string; limit: number; windowMs: number };
const durableCounts = new Map<string, number>();
const durableCalls: LimitInput[] = [];
const sent: string[] = [];

mock.module('@/lib/security/durable-rate-limit', () => ({
  checkDurableRateLimit: async (input: LimitInput) => {
    durableCalls.push(input);
    const key = `${input.id}:${input.key}`;
    const count = (durableCounts.get(key) ?? 0) + 1;
    durableCounts.set(key, count);
    return { ok: count <= input.limit, retryAfterSeconds: 3600, key };
  }
}));
mock.module('@/lib/email', () => ({
  sendContactEmail: async (input: { email: string }) => { sent.push(input.email); }
}));
mock.module('@/lib/analytics', () => ({
  createAnalyticsLead: async () => ({ ok: true, skipped: true }),
  forwardAnalyticsEvent: async () => ({ ok: true, skipped: true })
}));
class BookingError extends Error {
  status = 400;
}
mock.module('@/lib/booking/bookings', () => ({
  BookingError,
  createBooking: async (input: { customer: { email: string } }) => ({
    booking: { id: 'booking-1', status: 'confirmed', customer: input.customer },
    manageToken: 'manage-token'
  })
}));
mock.module('@/lib/booking/catalog', () => ({
  getServiceBySlug: async (slug: string) => ({ id: 'service-1', slug, active: true })
}));
mock.module('@/lib/booking/settings', () => ({
  getBookingSettings: async () => ({ timezone: 'Europe/London', notifyEmail: '' })
}));
mock.module('@/lib/email/booking-notifications', () => ({
  sendBookingAdminNotificationEmail: async () => undefined,
  sendBookingConfirmedEmail: async (input: { booking: { customer: { email: string } } }) => { sent.push(input.booking.customer.email); },
  sendBookingRequestReceivedEmail: async () => undefined
}));

const contact = await import('@/app/api/contact/route');
const bookings = await import('@/app/api/bookings/route');

function headersFor(ip: string, forged: string) {
  return { 'content-type': 'application/json', 'x-real-ip': ip, 'x-forwarded-for': `${forged}, ${ip}`, 'cf-connecting-ip': forged };
}

function sendContact(ip: string, email: string, forged = '203.0.113.9') {
  return contact.POST(new Request('https://velvetdinosaur.com/api/contact', {
    method: 'POST',
    headers: headersFor(ip, forged),
    body: JSON.stringify({ email, message: 'A short test enquiry.' })
  }));
}

function book(ip: string, email: string) {
  return bookings.POST(new Request('https://velvetdinosaur.com/api/bookings', {
    method: 'POST',
    headers: headersFor(ip, '203.0.113.9'),
    body: JSON.stringify({ serviceSlug: 'website-review', startAt: '2026-12-01T10:00:00.000Z', name: 'Alex', email })
  }));
}

const previousNodeEnv = process.env.NODE_ENV;
// The per-address limiter only counts in production.
beforeAll(() => { Object.assign(process.env, { NODE_ENV: 'production' }); });
afterAll(() => { Object.assign(process.env, { NODE_ENV: previousNodeEnv }); });
beforeEach(() => {
  globalThis.vdRateLimitStore?.clear();
  durableCounts.clear();
  durableCalls.length = 0;
  sent.length = 0;
});

describe('contact form limits', () => {
  test('five messages a minute per address, whatever the forwarding headers say', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await sendContact('192.0.2.10', `visitor${i}@example.test`, `203.0.113.${i}`)).status).toBe(200);
    }
    const blocked = await sendContact('192.0.2.10', 'visitor9@example.test', '203.0.113.99');
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await sendContact('192.0.2.11', 'someone@example.test')).status).toBe(200);
    expect(sent).toHaveLength(6);
  });

  test('twenty messages an hour per address', async () => {
    const start = Date.now();
    let offset = 0;
    const clock = spyOn(Date, 'now').mockImplementation(() => start + offset);
    try {
      for (let i = 0; i < 20; i++) {
        offset = Math.floor(i / 5) * 61_000;
        expect((await sendContact('192.0.2.20', `visitor${i}@example.test`)).status).toBe(200);
      }
      offset = 4 * 61_000;
      expect((await sendContact('192.0.2.20', 'late@example.test')).status).toBe(429);
    } finally {
      clock.mockRestore();
    }
  });

  test('ten messages a day per email address, counted by the durable limiter', async () => {
    for (let i = 0; i < 10; i++) {
      expect((await sendContact(`192.0.2.${100 + i}`, 'Alex@Example.test')).status).toBe(200);
    }
    expect((await sendContact('192.0.2.200', 'alex@example.test')).status).toBe(429);
    expect(sent).toHaveLength(10);
    expect(durableCalls.at(-1)).toEqual({ id: 'api:contact:email-day', key: 'alex@example.test', limit: 10, windowMs: 86_400_000 });
  });
});

describe('booking limits', () => {
  test('the per-email booking limit is durable', async () => {
    for (let i = 0; i < 10; i++) {
      expect((await book(`192.0.2.${120 + i}`, 'guest@example.test')).status).toBe(200);
    }
    expect((await book('192.0.2.201', 'guest@example.test')).status).toBe(429);
    expect(sent).toHaveLength(10);
    expect(durableCalls.at(-1)).toEqual({ id: 'bookings-create-email-d', key: 'guest@example.test', limit: 10, windowMs: 86_400_000 });
  });
});
