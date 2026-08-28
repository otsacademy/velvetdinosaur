import { describe, expect, test } from 'bun:test';
import {
  collectActivitySessions,
  formatDigest,
  isAutomatedUserAgent,
  parseAccessLine,
  type DemoSite
} from './demo-fleet-activity-digest';

const site: DemoSite = {
  slug: 'blue-anchor',
  name: 'Blue Anchor',
  domain: 'blue-anchor.velvetdinosaur.com',
  url: 'https://blue-anchor.velvetdinosaur.com/'
};

const humanUa =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0';

function line(input: {
  ip?: string;
  time: string;
  method?: string;
  path?: string;
  status?: number;
  referer?: string;
  userAgent?: string;
}) {
  return `${input.ip || '203.0.113.20'} - - [28/Aug/2026:${input.time} +0200] "${input.method || 'POST'} ${input.path || '/api/analytics'} HTTP/2.0" ${input.status || 200} 11 "${input.referer || `${site.url}ales`}" "${input.userAgent || humanUa}"`;
}

describe('demo fleet activity digest', () => {
  test('parses the nginx combined log format and timezone', () => {
    const parsed = parseAccessLine(line({ time: '14:10:00' }));
    expect(parsed?.ip).toBe('203.0.113.20');
    expect(parsed?.occurredAt.toISOString()).toBe('2026-08-28T12:10:00.000Z');
    expect(parsed?.referer).toBe('https://blue-anchor.velvetdinosaur.com/ales');
  });

  test('recognises automated user agents', () => {
    expect(isAutomatedUserAgent('Mozilla/5.0 HeadlessChrome/151.0')).toBeTrue();
    expect(isAutomatedUserAgent('Blackbox Exporter/0.24.0')).toBeTrue();
    expect(isAutomatedUserAgent(humanUa)).toBeFalse();
  });

  test('deduplicates pages, filters excluded traffic and records successful sign-in', () => {
    const logs = [
      line({ time: '14:01:00', referer: `${site.url}ales` }),
      line({ time: '14:01:02', referer: `${site.url}ales` }),
      line({ time: '14:04:00', referer: `${site.url}whats-on` }),
      line({
        time: '14:05:00',
        path: '/api/auth/sign-in/email',
        referer: `${site.url}sign-in`
      }),
      line({
        ip: '86.130.124.141',
        time: '14:06:00',
        referer: `${site.url}shop`
      }),
      line({
        ip: '203.0.113.21',
        time: '14:07:00',
        referer: `${site.url}journal`,
        userAgent: 'Mozilla/5.0 HeadlessChrome/151.0'
      })
    ];
    const sessions = collectActivitySessions(
      logs,
      [site],
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0].pages).toEqual(['/ales', '/whats-on', '/sign-in']);
    expect(sessions[0].signedIn).toBeTrue();
    expect(sessions[0].signedInAt?.toISOString()).toBe('2026-08-28T12:05:00.000Z');
  });

  test('does not count failed sign-in attempts as successful', () => {
    const sessions = collectActivitySessions(
      [
        line({ time: '14:01:00' }),
        line({
          time: '14:02:00',
          path: '/api/auth/sign-in/email',
          status: 401,
          referer: `${site.url}sign-in`
        })
      ],
      [site],
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0].signedIn).toBeFalse();
  });

  test('formats a readable page and sign-in summary', () => {
    const sessions = collectActivitySessions(
      [line({ time: '14:01:00' })],
      [site],
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );
    const digest = formatDigest(
      sessions,
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );
    expect(digest.subject).toContain('1 visitor session');
    expect(digest.body).toContain('Blue Anchor');
    expect(digest.body).toContain('- /ales');
    expect(digest.body).toContain('Successful backend sign-in: No');
  });
});
