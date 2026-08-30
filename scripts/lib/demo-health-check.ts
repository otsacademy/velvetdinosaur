/**
 * Pure evaluation logic for the demo fleet health monitor.
 *
 * Kept free of IO so the rules can be tested directly. The monitor
 * (scripts/demo-fleet-health.ts) does the fetching and the alerting.
 */

export type HealthProblem =
  | 'unreachable'
  | 'bad-status'
  | 'missing-noindex'
  | 'missing-demo-banner'
  | 'empty-title';

export type SiteProbe = {
  status: number | null;
  body: string;
  error?: string;
};

export type SiteHealth = {
  slug: string;
  name: string;
  url: string;
  healthy: boolean;
  status: number | null;
  title: string;
  problems: HealthProblem[];
  error?: string;
};

/** Markers every stamped demo must serve. Verified across the fleet 2026-08-29. */
const NOINDEX_PATTERN = /name="robots"\s+content="[^"]*noindex/i;
const DEMO_BANNER_PATTERN = /demo-safety-banner/i;

export const PROBLEM_LABELS: Record<HealthProblem, string> = {
  unreachable: 'no HTTP response',
  'bad-status': 'non-200 status',
  'missing-noindex': 'robots noindex missing — demo is indexable',
  'missing-demo-banner': 'demo safety banner missing — undisclaimed demo',
  'empty-title': 'empty <title>'
};

export function extractTitle(body: string) {
  return body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
}

export function evaluateSite(
  site: { slug: string; name: string; url: string },
  probe: SiteProbe,
  options: { expectDemoMarkers?: boolean } = {}
): SiteHealth {
  // The flagship velvetdinosaur.com is checked alongside the fleet (it went
  // 502 for 26h on 2026-08-29/30 with nobody alerted) but is a public site:
  // it must NOT carry the demo banner or noindex, so those checks are skipped.
  const { expectDemoMarkers = true } = options;
  const problems: HealthProblem[] = [];
  const title = extractTitle(probe.body);

  if (probe.status === null) {
    problems.push('unreachable');
  } else {
    if (probe.status !== 200) problems.push('bad-status');
    // Only meaningful when a page actually came back; a 502 body has none of
    // these markers and would otherwise raise three alarms for one fault.
    if (probe.status === 200) {
      if (expectDemoMarkers && !NOINDEX_PATTERN.test(probe.body)) problems.push('missing-noindex');
      if (expectDemoMarkers && !DEMO_BANNER_PATTERN.test(probe.body)) {
        problems.push('missing-demo-banner');
      }
      if (!title) problems.push('empty-title');
    }
  }

  return {
    slug: site.slug,
    name: site.name,
    url: site.url,
    healthy: problems.length === 0,
    status: probe.status,
    title,
    problems,
    error: probe.error
  };
}

export function describeProblems(health: SiteHealth) {
  const parts = health.problems.map((problem) => PROBLEM_LABELS[problem]);
  if (health.error) parts.push(health.error);
  return parts.join('; ');
}

/**
 * Alert only on change: a site that newly broke, or newly recovered. Without
 * this a 15-minute timer would mail the same outage 96 times a day.
 */
export function diffAgainstPrevious(
  current: SiteHealth[],
  previousUnhealthy: string[]
): { newlyUnhealthy: SiteHealth[]; recovered: string[]; unhealthySlugs: string[] } {
  const previous = new Set(previousUnhealthy);
  const unhealthy = current.filter((site) => !site.healthy);
  const unhealthySlugs = unhealthy.map((site) => site.slug).sort();
  const currentSet = new Set(unhealthySlugs);

  return {
    newlyUnhealthy: unhealthy.filter((site) => !previous.has(site.slug)),
    recovered: [...previous].filter((slug) => !currentSet.has(slug)).sort(),
    unhealthySlugs
  };
}

export function formatAlert(
  current: SiteHealth[],
  newlyUnhealthy: SiteHealth[],
  recovered: string[],
  checkedAt: string
) {
  const stillDown = current.filter(
    (site) => !site.healthy && !newlyUnhealthy.some((entry) => entry.slug === site.slug)
  );

  const subjectParts: string[] = [];
  if (newlyUnhealthy.length) {
    subjectParts.push(
      `${newlyUnhealthy.length} demo${newlyUnhealthy.length === 1 ? '' : 's'} down`
    );
  }
  if (recovered.length) {
    subjectParts.push(`${recovered.length} recovered`);
  }
  const subject = `Demo fleet: ${subjectParts.join(', ') || 'status change'}`;

  const lines: string[] = [`Checked ${current.length} demo sites at ${checkedAt}.`, ''];

  if (newlyUnhealthy.length) {
    lines.push('BROKEN:');
    for (const site of newlyUnhealthy) {
      lines.push(`  ${site.name} (${site.slug})`);
      lines.push(`    ${site.url}`);
      lines.push(`    ${describeProblems(site)}`);
    }
    lines.push('');
  }

  if (recovered.length) {
    lines.push(`RECOVERED: ${recovered.join(', ')}`, '');
  }

  if (stillDown.length) {
    lines.push(
      `STILL BROKEN (already reported): ${stillDown.map((site) => site.slug).join(', ')}`,
      ''
    );
  }

  const healthy = current.filter((site) => site.healthy).length;
  lines.push(`${healthy}/${current.length} healthy.`);

  return { subject, body: lines.join('\n') };
}
