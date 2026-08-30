import { describe, expect, test } from 'bun:test';
import {
  applyRecipientActivity,
  createRecipientToken,
  verifyRecipientToken
} from './demo-recipient-links';

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

describe('applyRecipientActivity', () => {
  const base = {
    id: 'recipient-123',
    siteSlug: 'blue-anchor',
    name: 'Blue Anchor',
    email: 'owner@blueanchor.example',
    createdAt: '2026-08-29T06:00:00.000Z',
    expiresAt: '2026-09-30T22:59:59.000Z'
  };
  const registry = { version: 1 as const, recipients: [base] };

  test('records a first click and keeps the latest timestamp on repeats', () => {
    const first = applyRecipientActivity(registry, [
      {
        emailOpened: false,
        recipientId: 'recipient-123',
        lastSeenAt: new Date('2026-08-30T09:00:00.000Z'),
        linkOpened: true,
        highConfidence: false,
        signedIn: false,
        signedInAt: null
      }
    ]);
    expect(first.changed).toBe(true);
    expect(first.registry.recipients[0].lastOpenedAt).toBe('2026-08-30T09:00:00.000Z');
    expect(first.registry.recipients[0].lastHighConfidenceAt).toBeUndefined();

    const second = applyRecipientActivity(first.registry, [
      {
        emailOpened: false,
        recipientId: 'recipient-123',
        lastSeenAt: new Date('2026-08-30T08:00:00.000Z'),
        linkOpened: true,
        highConfidence: false,
        signedIn: false,
        signedInAt: null
      }
    ]);
    expect(second.changed).toBe(false);
    expect(second.registry.recipients[0].lastOpenedAt).toBe('2026-08-30T09:00:00.000Z');
  });

  test('promotes engagement and sign-in independently', () => {
    const result = applyRecipientActivity(registry, [
      {
        emailOpened: false,
        recipientId: 'recipient-123',
        lastSeenAt: new Date('2026-08-30T10:00:00.000Z'),
        linkOpened: true,
        highConfidence: true,
        signedIn: true,
        signedInAt: new Date('2026-08-30T10:05:00.000Z')
      }
    ]);
    expect(result.registry.recipients[0].lastHighConfidenceAt).toBe('2026-08-30T10:00:00.000Z');
    expect(result.registry.recipients[0].lastSignedInAt).toBe('2026-08-30T10:05:00.000Z');
  });

  test('merges email opens into lastEmailOpenedAt without touching click fields', () => {
    const result = applyRecipientActivity(registry, [
      {
        emailOpened: true,
        recipientId: 'recipient-123',
        lastSeenAt: new Date('2026-08-30T09:00:00.000Z'),
        linkOpened: false,
        highConfidence: false,
        signedIn: false,
        signedInAt: null
      }
    ]);
    expect(result.changed).toBe(true);
    expect(result.registry.recipients[0].lastEmailOpenedAt).toBe('2026-08-30T09:00:00.000Z');
    expect(result.registry.recipients[0].lastOpenedAt ?? null).toBeNull();
  });

  test('ignores updates for unknown recipients and reports no change', () => {
    const result = applyRecipientActivity(registry, [
      {
        emailOpened: false,
        recipientId: 'someone-else',
        lastSeenAt: new Date('2026-08-30T10:00:00.000Z'),
        linkOpened: true,
        highConfidence: true,
        signedIn: false,
        signedInAt: null
      }
    ]);
    expect(result.changed).toBe(false);
    expect(result.registry).toBe(registry);
  });
});
