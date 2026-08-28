import { describe, expect, test } from 'bun:test';
import {
  collectActivitySessions,
  formatDigest,
  isAutomatedUserAgent,
  isLikelyPagePath,
  isSecurityProbePath,
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

  test('parses the dedicated host-aware activity log', () => {
    const parsed = parseAccessLine(
      JSON.stringify({
        host: site.domain,
        ip: '203.0.113.20',
        time: '2026-08-28T14:10:00+02:00',
        method: 'GET',
        uri: '/whats-on',
        status: 200,
        referer: '-',
        userAgent: humanUa
      })
    );
    expect(parsed?.host).toBe(site.domain);
    expect(parsed?.occurredAt.toISOString()).toBe('2026-08-28T12:10:00.000Z');
    expect(parsed?.path).toBe('/whats-on');
  });

  test('recognises automated user agents', () => {
    expect(isAutomatedUserAgent('Mozilla/5.0 HeadlessChrome/151.0')).toBeTrue();
    expect(isAutomatedUserAgent('Blackbox Exporter/0.24.0')).toBeTrue();
    expect(isAutomatedUserAgent(humanUa)).toBeFalse();
  });

  test('keeps page routes and rejects assets, APIs and crawler documents', () => {
    expect(isLikelyPagePath('/')).toBeTrue();
    expect(isLikelyPagePath('/fees')).toBeTrue();
    expect(isLikelyPagePath('/_next/static/app.js')).toBeFalse();
    expect(isLikelyPagePath('/api/analytics')).toBeFalse();
    expect(isLikelyPagePath('/hero.webp')).toBeFalse();
    expect(isLikelyPagePath('/robots.txt')).toBeFalse();
    expect(isLikelyPagePath('/unzipper.php')).toBeFalse();
  });

  test('recognises exploit-probe paths', () => {
    expect(isSecurityProbePath('/unzipper.php')).toBeTrue();
    expect(isSecurityProbePath('/panel/settings.php')).toBeTrue();
    expect(isSecurityProbePath('/data/admin.json')).toBeTrue();
    expect(isSecurityProbePath('/admin/store')).toBeFalse();
    expect(isSecurityProbePath('/rooms')).toBeFalse();
  });

  test('does not report an unconfirmed direct request without analytics', () => {
    const directVisit = JSON.stringify({
      host: site.domain,
      ip: '203.0.113.20',
      time: '2026-08-28T14:10:00+02:00',
      method: 'GET',
      uri: '/visit',
      status: 200,
      referer: '-',
      userAgent: humanUa
    });
    const sessions = collectActivitySessions(
      [directVisit],
      [site],
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );
    expect(sessions).toHaveLength(0);
  });

  test('drops an entire browser-looking session when it contains security probes', () => {
    const scannerUa =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36';
    const scannerLine = (path: string, second: number) =>
      JSON.stringify({
        host: site.domain,
        ip: '202.155.94.200',
        time: `2026-08-28T14:11:${String(second).padStart(2, '0')}+02:00`,
        method: 'GET',
        uri: path,
        status: 200,
        referer: '',
        userAgent: scannerUa
      });
    const sessions = collectActivitySessions(
      [
        scannerLine('/', 9),
        scannerLine('/unzipper.php', 10),
        scannerLine('/panel/settings.php', 11),
        JSON.stringify({
          host: site.domain,
          ip: '202.155.94.200',
          time: '2026-08-28T14:11:12+02:00',
          method: 'POST',
          uri: '/api/analytics',
          status: 200,
          referer: site.url,
          userAgent: scannerUa
        })
      ],
      [site],
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );
    expect(sessions).toHaveLength(0);
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

  test('records a host-attributed successful sign-in without a referrer', () => {
    const signIn = JSON.stringify({
      host: site.domain,
      ip: '203.0.113.20',
      time: '2026-08-28T14:10:00+02:00',
      method: 'POST',
      uri: '/api/auth/sign-in/email',
      status: 200,
      referer: '',
      userAgent: humanUa
    });
    const sessions = collectActivitySessions(
      [signIn],
      [site],
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0].pages).toEqual(['/sign-in']);
    expect(sessions[0].signedIn).toBeTrue();
  });

  test('formats a readable page and sign-in summary', () => {
    const sessions = collectActivitySessions(
      [line({ time: '14:01:00' })],
      [site],
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );
    const digest = formatDigest(
      [site],
      sessions,
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T13:00:00.000Z')
    );
    expect(digest.subject).toContain('1 visitor session');
    expect(digest.subject).toContain('1-demo activity');
    expect(digest.body).toContain('Fleet websites covered: 1');
    expect(digest.body).toContain('Blue Anchor');
    expect(digest.body).toContain('- /ales');
    expect(digest.body).toContain('Successful backend sign-in: No');
  });

  test('includes every fleet website when there is no activity', () => {
    const digest = formatDigest(
      [site],
      [],
      new Date('2026-08-28T12:00:00.000Z'),
      new Date('2026-08-28T14:00:00.000Z')
    );
    expect(digest.subject).toContain('1-demo activity: 0 visitor sessions');
    expect(digest.body).toContain('1. Blue Anchor');
    expect(digest.body).toContain('Activity: No qualifying activity');
  });
});
