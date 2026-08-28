import { describe, expect, test } from 'bun:test';
import { createRecipientToken, verifyRecipientToken } from './demo-recipient-links';

const secret = 'test-secret-that-is-at-least-thirty-two-characters';
const record = {
  id: 'recipient-123',
  siteSlug: 'blue-anchor',
  expiresAt: '2026-09-27T12:00:00.000Z'
};

describe('demo recipient links', () => {
  test('creates a path-safe signed token and verifies its site and recipient', () => {
    const token = createRecipientToken(record, secret);
    expect(token).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(verifyRecipientToken(token, secret, new Date('2026-08-28T12:00:00.000Z'))).toEqual({
      v: 1,
      r: 'recipient-123',
      s: 'blue-anchor',
      e: 1790510400
    });
  });

  test('rejects tampered and expired tokens', () => {
    const token = createRecipientToken(record, secret);
    expect(verifyRecipientToken(`${token}x`, secret, new Date('2026-08-28T12:00:00.000Z'))).toBeNull();
    expect(verifyRecipientToken(token, secret, new Date('2026-10-01T12:00:00.000Z'))).toBeNull();
  });
});
