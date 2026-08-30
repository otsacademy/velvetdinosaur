import { describe, expect, test } from 'bun:test';
import { formatDigest, type DigestRecipient, type DigestSite } from './demo-activity-format';

const site: DigestSite = {
  slug: 'blue-anchor',
  name: 'Blue Anchor Inn',
  url: 'https://blue-anchor.velvetdinosaur.com/',
  domain: 'blue-anchor.velvetdinosaur.com'
};

const since = new Date('2026-08-29T07:00:00.000Z');
const until = new Date('2026-08-29T09:00:00.000Z');

function recipient(overrides: Partial<DigestRecipient> = {}): DigestRecipient {
  return {
    id: 'recipient-123',
    siteSlug: 'blue-anchor',
    name: 'Blue Anchor',
    email: 'owner@blueanchor.example',
    expiresAt: '2026-09-30T22:59:59.000Z',
    ...overrides
  };
}

describe('formatDigest campaign reporting', () => {
  test('warns loudly when the registry is empty but sites exist', () => {
    const digest = formatDigest([site], [], [], [], [], since, until);
    expect(digest.body).toContain('WARNING: recipient link registry is EMPTY');
    expect(digest.body).toContain('recipient click tracking is OFF');
  });

  test('renders cumulative campaign status when recipients exist', () => {
    const digest = formatDigest(
      [site],
      [],
      [],
      [
        recipient({ lastOpenedAt: '2026-08-30T09:00:00.000Z' }),
        recipient({ id: 'r2', email: 'quiet@example.com' })
      ],
      [],
      since,
      until
    );
    expect(digest.body).not.toContain('WARNING: recipient link registry is EMPTY');
    expect(digest.body).toContain(
      'Campaign status (cumulative, all 2 tracked recipients): 0 ever opened the email, 1 ever clicked, 0 ever browsed, 0 ever signed in'
    );
    expect(digest.body).toContain('- blue-anchor | owner@blueanchor.example | clicked');
    expect(digest.body).toContain('- blue-anchor | quiet@example.com | never clicked');
  });

  test('shows browse and sign-in milestones per recipient', () => {
    const digest = formatDigest(
      [site],
      [],
      [],
      [
        recipient({
          lastOpenedAt: '2026-08-30T09:00:00.000Z',
          lastHighConfidenceAt: '2026-08-30T09:05:00.000Z',
          lastSignedInAt: '2026-08-30T09:10:00.000Z'
        })
      ],
      [],
      since,
      until
    );
    expect(digest.body).toMatch(/clicked .*; browsed .*; signed in /);
  });
});
