import { afterEach, describe, expect, test } from 'bun:test';
import { createAnalyticsLead, forwardAnalyticsEvent } from '@/lib/analytics/server';
import { getRequestIp } from '@/lib/security/rate-limit';

test('only the proxy-overwritten IP controls request identity', () => {
  for (const forged of ['203.0.113.10', '203.0.113.11', 'attacker']) {
    expect(getRequestIp(new Headers({ 'x-real-ip': '192.0.2.1', 'cf-connecting-ip': forged,
      'x-forwarded-for': forged, 'true-client-ip': forged, 'x-client-ip': forged }))).toBe('192.0.2.1');
  }
  expect(getRequestIp(new Headers({ 'x-forwarded-for': '192.0.2.1' }))).toBe('');
  expect(getRequestIp(new Headers({ 'x-real-ip': 'invalid, 192.0.2.1' }))).toBe('');
});

test('a forwarding chain appended by nginx cannot replace the overwritten address', () => {
  // nginx passes a client's X-Forwarded-For through and appends the peer.
  const headers = new Headers({ 'x-real-ip': ' 2001:db8::7 ', 'x-forwarded-for': '203.0.113.10, 2001:db8::7' });
  expect(getRequestIp(headers)).toBe('2001:db8::7');
  expect(getRequestIp(new Headers({ 'cf-connecting-ip': '203.0.113.10' }))).toBe('');
});

describe('analytics forwarding', () => {
  const originalFetch = globalThis.fetch;
  const keys = ['VD_ANALYTICS_INGEST_URL', 'VD_ANALYTICS_INGEST_API_KEY', 'SITE_SLUG'] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });

  test('events and leads carry the trusted address, not a forged one', async () => {
    process.env.VD_ANALYTICS_INGEST_URL = 'https://analytics.example.test';
    process.env.VD_ANALYTICS_INGEST_API_KEY = 'test-only';
    process.env.SITE_SLUG = 'test-site';
    const forwarded: string[] = [];
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      forwarded.push(new Headers(init?.headers).get('x-vd-forwarded-for') ?? '<missing>');
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    const request = new Request('https://example.test/api/contact', {
      method: 'POST',
      headers: { 'x-real-ip': '192.0.2.1', 'x-forwarded-for': '203.0.113.10, 192.0.2.1', 'cf-connecting-ip': '203.0.113.10' }
    });
    await forwardAnalyticsEvent(request, { eventType: 'conversion', eventName: 'form_submit_success' });
    await createAnalyticsLead(request, { leadType: 'contact_form', leadName: 'contact_enquiry', sourceRoute: '/api/contact', status: 'new' });

    expect(forwarded).toEqual(['192.0.2.1', '192.0.2.1']);
  });
});
