import { describe, expect, test } from 'bun:test';
import { getRequestIp } from '@/lib/security/rate-limit';
import { classifyPostmarkEvent } from '@/lib/newsletter/postmark-events';

// ASAP's tests/security/boundaries.test.ts without its upload checks, which
// belong to the separate upload repair (September repair 2).

test('only the proxy-overwritten IP controls request identity', () => {
  for (const forged of ['203.0.113.10', '203.0.113.11', 'attacker']) {
    expect(getRequestIp(new Headers({ 'x-real-ip': '192.0.2.1', 'cf-connecting-ip': forged,
      'x-forwarded-for': forged, 'true-client-ip': forged, 'x-client-ip': forged }))).toBe('192.0.2.1');
  }
  expect(getRequestIp(new Headers({ 'x-forwarded-for': '192.0.2.1' }))).toBe('');
  expect(getRequestIp(new Headers({ 'x-real-ip': 'invalid, 192.0.2.1' }))).toBe('');
});

describe('Postmark webhook contract', () => {
  const bounced = { RecordType: 'Bounce', MessageStream: 'outbound', Email: 'alex@example.test', Type: 'SoftBounce', Inactive: false, BouncedAt: '2026-09-26T12:00:00Z' };
  test('temporary bounces do not suppress; inactive bounces do', () => {
    expect(classifyPostmarkEvent(bounced)).toBeNull();
    expect(classifyPostmarkEvent({ ...bounced, Type: 'HardBounce', Inactive: true })?.active).toBe(true);
  });
  test('uses Recipient for subscription changes and rejects wrong streams/malformed events', () => {
    const changed = { RecordType: 'SubscriptionChange', MessageStream: 'outbound', Recipient: 'Alex@example.test', SuppressSending: true, ChangedAt: '2026-09-26T12:00:00Z' };
    expect(classifyPostmarkEvent(changed)?.email).toBe('alex@example.test');
    expect(classifyPostmarkEvent({ ...changed, SuppressSending: false })?.active).toBe(false);
    expect(classifyPostmarkEvent({ ...changed, SuppressSending: false, MessageID: null, SuppressionReason: null })?.active).toBe(false);
    expect(classifyPostmarkEvent({ ...changed, Origin: 'Recipient', SuppressionReason: 'ManualSuppression' })?.withdrawConsent).toBe(true);
    expect(classifyPostmarkEvent({ ...changed, Origin: 'Recipient', SuppressionReason: 'HardBounce' })?.withdrawConsent).toBe(false);
    expect(classifyPostmarkEvent({ ...changed, MessageStream: 'another-stream' })).toBeNull();
    expect(classifyPostmarkEvent({ ...changed, SuppressSending: 'false' })).toBeNull();
    expect(classifyPostmarkEvent({ ...changed, ChangedAt: 'invalid' })).toBeNull();
  });
});
