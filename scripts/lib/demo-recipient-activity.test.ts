import { describe, expect, test } from 'bun:test';
import type { AccessEntry, DemoSite } from '../demo-fleet-activity-digest';
import { collectRecipientActivity } from './demo-recipient-activity';
import { createRecipientToken, type RecipientLinkRecord } from './demo-recipient-links';

const site: DemoSite = {
  slug: 'blue-anchor',
  name: 'Blue Anchor',
  domain: 'blue-anchor.velvetdinosaur.com',
  url: 'https://blue-anchor.velvetdinosaur.com/'
};
const recipient: RecipientLinkRecord = {
  id: 'recipient-123',
  siteSlug: site.slug,
  name: 'Alex Example',
  email: 'alex@example.com',
  createdAt: '2026-08-28T12:00:00.000Z',
  expiresAt: '2026-09-27T12:00:00.000Z'
};
const secret = 'test-secret-that-is-at-least-thirty-two-characters';
const token = createRecipientToken(recipient, secret);
const ua = 'Mozilla/5.0 Chrome/151.0.0.0 Safari/537.36';

function page(value: string) {
  return Buffer.from(value).toString('base64url');
}

function entry(path: string, time: string, status = 204): AccessEntry {
  return {
    host: site.domain,
    ip: '203.0.113.20',
    occurredAt: new Date(time),
    method: path.startsWith('/visit/') ? 'GET' : 'POST',
    path,
    status,
    referer: '',
    userAgent: ua
  };
}

const rules = {
  ignoredIps: new Set<string>(),
  isAutomatedUserAgent: () => false,
  isSecurityProbePath: () => false,
  visitorFingerprint: (ip: string, userAgent: string) => `${ip}|${userAgent}`
};

describe('demo recipient activity', () => {
  test('attributes a hub-served email pixel fetch via the token, through proxy user agents', () => {
    const proxyEntry: AccessEntry = {
      host: 'velvetdinosaur.com',
      ip: '66.102.8.20',
      occurredAt: new Date('2026-08-28T12:00:30.000Z'),
      method: 'GET',
      path: `/open/${token}.gif`,
      status: 200,
      referer: '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) via ggpht.com GoogleImageProxy'
    };
    const activity = collectRecipientActivity(
      [proxyEntry],
      [site],
      [],
      [recipient],
      secret,
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z'),
      { ...rules, isAutomatedUserAgent: () => true }
    );
    expect(activity).toHaveLength(1);
    expect(activity[0].site.slug).toBe(site.slug);
    expect(activity[0].emailOpened).toBeTrue();
    expect(activity[0].linkOpened).toBeFalse();
    expect(activity[0].highConfidence).toBeFalse();
  });

  test('does not call a redirect fetch a human visit', () => {
    const activity = collectRecipientActivity(
      [entry(`/visit/${token}`, '2026-08-28T12:01:00.000Z', 307)],
      [site],
      [],
      [recipient],
      secret,
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z'),
      rules
    );
    expect(activity).toHaveLength(1);
    expect(activity[0].linkOpened).toBeTrue();
    expect(activity[0].highConfidence).toBeFalse();
  });

  test('requires deliberate interaction and visible dwell for high confidence', () => {
    const prefix = '/api/analytics/demo-recipient';
    const activity = collectRecipientActivity(
      [
        entry(`/visit/${token}`, '2026-08-28T12:01:00.000Z', 307),
        entry(`${prefix}/page/${token}/${page('/')}`, '2026-08-28T12:01:02.000Z'),
        entry(`${prefix}/pointer/${token}/${page('/')}`, '2026-08-28T12:01:04.000Z'),
        entry(`${prefix}/dwell10/${token}/${page('/')}`, '2026-08-28T12:01:12.000Z')
      ],
      [site],
      [],
      [recipient],
      secret,
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z'),
      rules
    );
    expect(activity[0]).toMatchObject({
      linkOpened: true,
      highConfidence: true,
      pages: ['/']
    });
    expect(activity[0].signals).toEqual(['open', 'page', 'pointer', 'dwell10']);
  });
});
