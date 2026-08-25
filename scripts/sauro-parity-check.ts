/**
 * Sauro CMS core parity checker (CLI over lib/sauro-parity).
 *
 * Reports how every installed source and unstamped workspace package compares
 * to the canonical platform template: identical, drifted, missing, site-owned,
 * legacy, and foreign. Read-only: never writes to a target checkout.
 *
 * Usage:
 *   bun run sauro:parity                    # summary tables
 *   bun run sauro:parity -- --list <site>   # per-file detail for one site
 *   bun run sauro:parity -- --json          # machine-readable output
 *   bun run sauro:parity -- --strict        # exit 1 on core drift (post-parity CI)
 */
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  discoverSauroTargets,
  compareSite,
  emptyCounts,
  loadParityManifest,
  scanTree,
  type ParityFileState,
  type SiteParity
} from '@/lib/sauro-parity';

const args = process.argv.slice(2);
const flagJson = args.includes('--json');
const flagStrict = args.includes('--strict');
const listIdx = args.indexOf('--list');
const listSite = listIdx >= 0 ? args[listIdx + 1] : null;

const manifest = loadParityManifest(join(process.cwd(), 'docs/platform/sauro-core-manifest.json'));
if (!existsSync(manifest.reference.path)) {
  throw new Error(`Sauro parity reference does not exist: ${manifest.reference.path}`);
}
const reference = scanTree(manifest.reference.path, manifest.scopes);
if (reference.size === 0) {
  throw new Error(`Sauro parity reference has no files in the declared scopes: ${manifest.reference.path}`);
}

const targets = discoverSauroTargets(manifest);
const reports: Array<SiteParity & { path: string; kind: 'site' | 'template' | 'workspace' }> = targets.map((site) => ({
  ...(existsSync(site.path)
    ? compareSite(manifest, site.name, site.path, reference)
    : { site: site.name, offline: true, counts: emptyCounts(), files: [], workspaces: {} }),
  path: site.path,
  kind: site.workspace ? 'workspace' : site.template ? 'template' : 'site'
}));

if (flagJson) {
  const slim = reports.map((r) => ({
    site: r.site,
    path: r.path,
    kind: r.kind,
    offline: r.offline,
    counts: r.counts,
    workspaces: r.workspaces,
    drifted: r.files.filter((f) => f.state === 'drifted').map((f) => f.rel),
    missing: r.files.filter((f) => f.state === 'missing').map((f) => f.rel),
    foreign: r.files.filter((f) => f.state === 'foreign').map((f) => f.rel),
    extraCore: r.files.filter((f) => f.state === 'extra-core').map((f) => f.rel)
  }));
  console.log(JSON.stringify({ reference: manifest.reference, sites: slim }, null, 2));
} else {
  const pad = (value: string | number, width: number) => String(value).padStart(width);
  const siteWidth = Math.max(16, ...reports.map((report) => report.site.length + (report.site === manifest.reference.site ? 6 : 0))) + 1;
  console.log(`Sauro core parity vs canonical ${manifest.reference.site} (${manifest.reference.path})`);
  console.log(`coverage: ${manifest.scopes.length} shared runtime scopes\n`);
  console.log(`${'target'.padEnd(siteWidth)}${pad('core=', 6)}${pad('drift', 6)}${pad('miss', 6)}${pad('owned', 7)}${pad('legacy', 8)}${pad('foreign', 9)}${pad('extra', 7)}`);
  for (const r of reports) {
    const c = r.counts;
    const label = r.site === manifest.reference.site ? `${r.site} (ref)` : r.site;
    console.log(
      `${label.padEnd(siteWidth)}${pad(c.identical, 6)}${pad(c.drifted, 6)}${pad(c.missing, 6)}${pad(c['site-owned'], 7)}${pad(c.legacy, 8)}${pad(c.foreign, 9)}${pad(c['extra-core'], 7)}`
    );
  }
  const workspaceNames = Object.keys(manifest.workspaces).filter((k) => k !== 'note');
  console.log('\nWorkspace feature map (real implementations, not demos):');
  console.log(`${'target'.padEnd(siteWidth)}${workspaceNames.map((n) => n.slice(0, 10).padEnd(11)).join('')}`);
  for (const r of reports) {
    console.log(`${r.site.padEnd(siteWidth)}${workspaceNames.map((n) => (r.workspaces[n] ? 'yes' : '—').padEnd(11)).join('')}`);
  }
  if (listSite) {
    const target = reports.find((r) => r.site === listSite);
    if (!target) {
      console.error(`\nUnknown site ${listSite}`);
      process.exit(2);
    }
    console.log(`\nDetail for ${listSite}:`);
    for (const state of ['drifted', 'missing', 'foreign', 'extra-core', 'legacy'] as ParityFileState[]) {
      const rows = target.files.filter((f) => f.state === state);
      if (!rows.length) continue;
      console.log(`  [${state}] (${rows.length})`);
      for (const row of rows) console.log(`    ${row.rel}${row.note ? `  — ${row.note}` : ''}`);
    }
  }
}

if (flagStrict) {
  const bad = reports.filter((r) => !r.offline && (r.counts.drifted || r.counts.missing || r.counts.foreign || r.counts['extra-core']));
  if (bad.length) {
    console.error(`\nStrict mode: core drift present on ${bad.map((r) => r.site).join(', ')}`);
    process.exit(1);
  }
}
