import { describe, expect, test } from 'bun:test';
import {
  describeProblems,
  diffAgainstPrevious,
  evaluateSite,
  extractTitle,
  formatAlert,
  type SiteHealth
} from './demo-health-check';

const site = {
  slug: 'blue-anchor',
  name: 'Blue Anchor Inn',
  url: 'https://blue-anchor.velvetdinosaur.com/'
};

const healthyBody = `<!doctype html><html><head>
<title>Blue Anchor Inn</title>
<meta name="robots" content="noindex, nofollow, noarchive, nocache"/>
</head><body><div data-demo-safety-banner="true">Demo site</div></body></html>`;

function health(overrides: Partial<SiteHealth> = {}): SiteHealth {
  return {
    slug: 'x',
    name: 'X',
    url: 'https://x.velvetdinosaur.com/',
    healthy: false,
    status: 502,
    title: '',
    problems: ['bad-status'],
    ...overrides
  };
}

describe('evaluateSite', () => {
  test('a correctly served demo is healthy', () => {
    const result = evaluateSite(site, { status: 200, body: healthyBody });
    expect(result.healthy).toBe(true);
    expect(result.problems).toEqual([]);
    expect(result.title).toBe('Blue Anchor Inn');
  });

  test('a 502 reports only the status, not every missing marker', () => {
    const result = evaluateSite(site, { status: 502, body: '<html>502 Bad Gateway</html>' });
    expect(result.healthy).toBe(false);
    expect(result.problems).toEqual(['bad-status']);
  });

  test('a connection failure is unreachable', () => {
    const result = evaluateSite(site, { status: null, body: '', error: 'timeout' });
    expect(result.problems).toEqual(['unreachable']);
    expect(describeProblems(result)).toContain('timeout');
  });

  test('a 200 without noindex is flagged as indexable', () => {
    const body = healthyBody.replace(/<meta name="robots"[^>]*>/, '');
    const result = evaluateSite(site, { status: 200, body });
    expect(result.problems).toContain('missing-noindex');
  });

  test('a 200 without the demo banner is flagged as undisclaimed', () => {
    const body = healthyBody.replace('data-demo-safety-banner="true"', '');
    const result = evaluateSite(site, { status: 200, body });
    expect(result.problems).toContain('missing-demo-banner');
  });

  test('an index-follow robots tag does not satisfy the noindex check', () => {
    const body = healthyBody.replace(
      'content="noindex, nofollow, noarchive, nocache"',
      'content="index, follow"'
    );
    expect(evaluateSite(site, { status: 200, body }).problems).toContain('missing-noindex');
  });
});

describe('extractTitle', () => {
  test('reads and trims the title', () => {
    expect(extractTitle('<title>  Wally&#x27;s  </title>')).toBe('Wally&#x27;s');
  });

  test('returns empty string when absent', () => {
    expect(extractTitle('<html></html>')).toBe('');
  });
});

describe('diffAgainstPrevious', () => {
  test('reports a newly broken site', () => {
    const current = [health({ slug: 'a' }), health({ slug: 'b', healthy: true, problems: [] })];
    const diff = diffAgainstPrevious(current, []);
    expect(diff.newlyUnhealthy.map((entry) => entry.slug)).toEqual(['a']);
    expect(diff.recovered).toEqual([]);
    expect(diff.unhealthySlugs).toEqual(['a']);
  });

  test('stays quiet while an outage continues', () => {
    const current = [health({ slug: 'a' })];
    const diff = diffAgainstPrevious(current, ['a']);
    expect(diff.newlyUnhealthy).toEqual([]);
    expect(diff.recovered).toEqual([]);
  });

  test('reports recovery', () => {
    const current = [health({ slug: 'a', healthy: true, problems: [] })];
    const diff = diffAgainstPrevious(current, ['a']);
    expect(diff.recovered).toEqual(['a']);
    expect(diff.unhealthySlugs).toEqual([]);
  });
});

describe('formatAlert', () => {
  test('names the broken site and separates already-reported ones', () => {
    const broken = health({ slug: 'bakewell-pudding', name: 'Bakewell' });
    const ongoing = health({ slug: 'old-craft-barn', name: 'Barn' });
    const ok = health({ slug: 'bank-house', healthy: true, problems: [], status: 200 });
    const alert = formatAlert([broken, ongoing, ok], [broken], [], '2026-08-29T07:00:00Z');

    expect(alert.subject).toBe('Demo fleet: 1 demo down');
    expect(alert.body).toContain('bakewell-pudding');
    expect(alert.body).toContain('STILL BROKEN (already reported): old-craft-barn');
    expect(alert.body).toContain('1/3 healthy.');
  });

  test('pluralises and reports recoveries', () => {
    const a = health({ slug: 'a' });
    const b = health({ slug: 'b' });
    const alert = formatAlert([a, b], [a, b], ['c'], '2026-08-29T07:00:00Z');
    expect(alert.subject).toBe('Demo fleet: 2 demos down, 1 recovered');
    expect(alert.body).toContain('RECOVERED: c');
  });
});

describe('hub (non-demo) site evaluation', () => {
  const hub = { slug: 'velvetdinosaur-hub', name: 'Velvet Dinosaur (main site)', url: 'https://velvetdinosaur.com/' };

  test('a public page without demo markers is healthy when markers are not expected', () => {
    const health = evaluateSite(
      hub,
      { status: 200, body: '<title>Velvet Dinosaur</title><p>hello</p>' },
      { expectDemoMarkers: false }
    );
    expect(health.healthy).toBeTrue();
    expect(health.problems).toEqual([]);
  });

  test('a 502 on the hub is unhealthy', () => {
    const health = evaluateSite(hub, { status: 502, body: '' }, { expectDemoMarkers: false });
    expect(health.healthy).toBeFalse();
    expect(health.problems).toEqual(['bad-status']);
  });
});
