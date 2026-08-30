/**
 * Demo fleet health monitor.
 *
 * Fetches every live demo site and checks it is actually serving: HTTP 200,
 * robots noindex present, and the demo safety banner present. Alerts by email
 * only when a site newly breaks or newly recovers.
 *
 * This exists because nothing else watches the live fleet. `demo:fleet` reads
 * manifests on disk, so a dead slot is invisible to it — bakewell-pudding
 * served 502 for 13 hours on 2026-08-28 after an interrupted slot switch, the
 * day after its prospect was emailed the link.
 *
 * Run: bun scripts/demo-fleet-health.ts             (check, alert on change)
 *      bun scripts/demo-fleet-health.ts --dry-run   (print, never email)
 *      bun scripts/demo-fleet-health.ts --force     (email even if unchanged)
 *      bun scripts/demo-fleet-health.ts --json      (machine-readable report)
 *      bun scripts/demo-fleet-health.ts --strict    (exit 1 if any site is down)
 */
import { existsSync, mkdirSync, readFileSync, readlinkSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { discoverDemoSites } from './demo-fleet-activity-digest';
import { sendGwsEmail } from './lib/gws-mail';
import {
  describeProblems,
  diffAgainstPrevious,
  evaluateSite,
  formatAlert,
  type SiteHealth,
  type SiteProbe
} from './lib/demo-health-check';

const APPS_ROOT = process.env.VD_APPS_ROOT || '/srv/apps';
const STATE_FILE =
  process.env.VD_HEALTH_STATE_FILE || '/var/lib/vd-demo-fleet-health/state.json';
const RECIPIENT = process.env.VD_HEALTH_RECIPIENT || 'iwickens@gmail.com';
const GWS_BINARY = process.env.VD_HEALTH_GWS_BINARY || undefined;
const GWS_ACCOUNT = process.env.VD_HEALTH_GWS_ACCOUNT || undefined;
const TIMEOUT_MS = Number(process.env.VD_HEALTH_TIMEOUT_MS || 15_000);
const CONCURRENCY = Number(process.env.VD_HEALTH_CONCURRENCY || 6);

type State = { unhealthy: string[]; checkedAt: string };

function readState(): State {
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as Partial<State>;
    return {
      unhealthy: Array.isArray(parsed.unhealthy) ? parsed.unhealthy : [],
      checkedAt: parsed.checkedAt || ''
    };
  } catch {
    return { unhealthy: [], checkedAt: '' };
  }
}

function saveState(state: State) {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  const temporary = `${STATE_FILE}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, STATE_FILE);
}

async function probe(url: string): Promise<SiteProbe> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'vd-demo-fleet-health/1.0' }
    });
    return { status: response.status, body: await response.text() };
  } catch (error) {
    return {
      status: null,
      body: '',
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Which systemd unit backs a site right now, so an alert points at the fix. */
function currentUnit(slug: string) {
  try {
    const target = readlinkSync(join(APPS_ROOT, `${slug}-current`));
    const slot = /-green$/.test(target) ? 'green' : /-blue$/.test(target) ? 'blue' : '';
    if (!slot) return '';
    const unit = `vd-${slug}-${slot}.service`;
    let state = 'unknown';
    try {
      state = execFileSync('systemctl', ['is-active', unit], { encoding: 'utf8' }).trim();
    } catch (error) {
      const output = (error as { stdout?: string }).stdout;
      state = typeof output === 'string' && output.trim() ? output.trim() : 'inactive';
    }
    return `${unit} (${state})`;
  } catch {
    return '';
  }
}

async function mapWithLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

function printReport(results: SiteHealth[]) {
  for (const site of results) {
    const mark = site.healthy ? 'ok  ' : 'FAIL';
    const status = site.status === null ? '---' : String(site.status);
    const detail = site.healthy ? site.title : describeProblems(site);
    console.log(`${mark} ${site.slug.padEnd(22)} ${status}  ${detail}`);
    if (!site.healthy) {
      const unit = currentUnit(site.slug);
      if (unit) console.log(`     ${unit}`);
    }
  }
  const healthy = results.filter((site) => site.healthy).length;
  console.log(`\n${healthy}/${results.length} healthy.`);
}

async function main() {
  const flags = new Set(process.argv.slice(2));
  const dryRun = flags.has('--dry-run');
  const force = flags.has('--force');
  const asJson = flags.has('--json');
  const strict = flags.has('--strict');

  const sites = discoverDemoSites(APPS_ROOT);
  if (!sites.length) {
    console.error(`No demo sites found under ${APPS_ROOT} (VD_DEMO_SITE=true in .env.production)`);
    process.exit(1);
  }

  const hubUrl = process.env.VD_HEALTH_HUB_URL ?? 'https://velvetdinosaur.com/';
  const checks = [
    ...sites.map((site) => ({ site, expectDemoMarkers: true })),
    ...(hubUrl
      ? [
          {
            site: { slug: 'velvetdinosaur-hub', name: 'Velvet Dinosaur (main site)', url: hubUrl },
            expectDemoMarkers: false
          }
        ]
      : [])
  ];
  const results = await mapWithLimit(checks, CONCURRENCY, async (check) =>
    evaluateSite(check.site, await probe(check.site.url), {
      expectDemoMarkers: check.expectDemoMarkers
    })
  );

  const checkedAt = new Date().toISOString();
  const previous = readState();
  const { newlyUnhealthy, recovered, unhealthySlugs } = diffAgainstPrevious(
    results,
    previous.unhealthy
  );

  if (asJson) {
    console.log(JSON.stringify({ checkedAt, results, newlyUnhealthy, recovered }, null, 2));
  } else {
    printReport(results);
  }

  const shouldAlert = force || newlyUnhealthy.length > 0 || recovered.length > 0;

  if (shouldAlert && !dryRun) {
    const alert = formatAlert(results, newlyUnhealthy, recovered, checkedAt);
    const units = results
      .filter((site) => !site.healthy)
      .map((site) => {
        const unit = currentUnit(site.slug);
        return unit ? `  ${site.slug}: ${unit}` : '';
      })
      .filter(Boolean);
    const body = units.length ? `${alert.body}\n\nUnits:\n${units.join('\n')}` : alert.body;
    const confirmation = await sendGwsEmail({
      subject: alert.subject,
      body,
      recipient: RECIPIENT,
      account: GWS_ACCOUNT,
      binary: GWS_BINARY,
      clientName: 'vd-demo-fleet-health'
    });
    console.log(`alerted: ${alert.subject}; ${confirmation.replace(/\s+/g, ' ')}`);
  } else if (shouldAlert && dryRun) {
    const alert = formatAlert(results, newlyUnhealthy, recovered, checkedAt);
    console.log(`\n--- would send ---\n${alert.subject}\n\n${alert.body}`);
  }

  if (!dryRun) saveState({ unhealthy: unhealthySlugs, checkedAt });

  if (strict && unhealthySlugs.length) process.exit(1);
}

if (import.meta.main) {
  await main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  });
}
