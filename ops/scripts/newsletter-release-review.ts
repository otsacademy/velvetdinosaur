import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export const NEWSLETTER_SCRIPTS = {
  'test:newsletter': 'bun test lib/newsletter lib/email/newsletter-campaign.test.ts',
  'test:newsletter:integration': 'bun scripts/newsletter-mongo-test.ts'
};
export const LEGACY_HASHES: Record<string, string> = {
  'models/Asset.ts': '3cd9c2da30981ce15710d57cc2a2476fe072a051e76e45fd69e7248d4203e68e',
  'lib/assets/image-variants.ts': 'b722b275bd38d7b6896056853a881190e252b0c3833181d9c8b4a179dad90631',
  'lib/assets/trash.server.ts': '23d48bc8e999459cc70a21f6d41e8b0f53c05fd386a592c0b22cc078f54bd733',
  'app/api/assets/replace/route.ts': '5f8c70d4dff4b228b6b961d9421756eebfcd46694a6daec1861293e68d1243ad'
};
export type InventorySite = { slug: string; source: string; domain: string; isDemo: boolean; reviewSource?: string };
export const runtimeEnvironmentRoot = (site: InventorySite) => site.reviewSource || site.source;
type CompatibilitySite = { slug: string; source: string; differences: { file: string; mode: string }[] };
export type SharedFile = { file: string; sourceSha256: string };
export type ReviewFile = { file: string; before: string | null; after: string; decision: string };
export type Catalog = {
  inventory: InventorySite[]; compatibility: CompatibilitySite[]; files: SharedFile[];
  hubBase: string; templateBase: string; sourceRoot: string; templateRoot: string;
};

export function sha256(value: Buffer | string) {
  return createHash('sha256').update(value).digest('hex');
}

function repositoryArgs(repo: string) {
  const history = path.join(path.dirname(repo), `${path.basename(repo)}-history.git`);
  return !existsSync(path.join(repo, '.git')) && existsSync(history)
    ? [`--git-dir=${history}`, `--work-tree=${repo}`] : ['-C', repo];
}

export function git(repo: string, args: string[], optional = false): string {
  const result = spawnSync('git', [...repositoryArgs(repo), ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    if (optional) return '';
    throw new Error(`Git inspection failed in ${repo}: ${args[0]}`);
  }
  return result.stdout.trim();
}

export function gitFile(repo: string, ref: string, file: string): Buffer | null {
  const result = spawnSync('git', [...repositoryArgs(repo), 'show', `${ref}:${file}`], { maxBuffer: 16 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : null;
}

export function loadCatalog(directory: string): Catalog {
  const read = (name: string) => JSON.parse(readFileSync(path.join(directory, name), 'utf8'));
  const inventory = read('inventory.json');
  const compatibility = read('shared-compatibility.json');
  const distribution = read('shared-distribution.json');
  const names = readFileSync(path.join(directory, 'shared-files.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
  const files: SharedFile[] = distribution.files;
  if (!names.length || new Set(names).size !== names.length || files.length !== names.length ||
      files.some((file) => !names.includes(file.file))) throw new Error('Reviewed file manifest disagrees with distribution metadata.');
  for (const name of names) {
    if (name.startsWith('/') || name.split('/').includes('..') || !/^[\w./[\]()-]+$/.test(name)) {
      throw new Error(`Invalid shared file path: ${name}`);
    }
  }
  return {
    inventory: inventory.sites, compatibility: compatibility.sites, files,
    hubBase: distribution.hubBase, templateBase: compatibility.templateBase,
    sourceRoot: distribution.source, templateRoot: distribution.template
  };
}

export function classifyFile(input: {
  file: string; before: string | null; after: string; baseline: (string | null)[]; reviewedDifference: boolean;
}): string {
  const { file, before, after, baseline, reviewedDifference } = input;
  if (before === after) return 'already-current';
  if (before === null) return 'add-shared-dependency';
  if (baseline.includes(before)) return 'replace-known-baseline';
  if (reviewedDifference && LEGACY_HASHES[file] === before) return 'restore-reviewed-September-bookkeeping';
  // The pilot review explicitly retains ASAP's higher batch limit.
  if (file === 'app/api/internal/newsletter-dispatch-cron/route.ts' && reviewedDifference &&
      before === '362f956865facf49d2a7a6545c9677a0417a9695f19cb865033a6de4647be3d6') return 'preserve-ASAP-batch-200';
  throw new Error(`Unreviewed content in ${file}; refusing automatic replacement.`);
}

export function mergePackage(raw: Buffer): Buffer {
  const pkg = JSON.parse(raw.toString());
  pkg.scripts ||= {};
  for (const [name, command] of Object.entries(NEWSLETTER_SCRIPTS)) {
    if (pkg.scripts[name] && pkg.scripts[name] !== command) throw new Error(`Existing custom ${name} command needs review.`);
    pkg.scripts[name] = command;
  }
  if (!pkg.scripts['deploy:blue-green'] || !pkg.scripts.quality || !pkg.scripts['quality:validate']) {
    throw new Error('Site lacks the required local quality/blue-green entrypoints.');
  }
  return Buffer.from(`${JSON.stringify(pkg, null, 2)}\n`);
}

type Gate = string | { name: string; command: string };
export function mergeQuality(raw: Buffer): Buffer {
  const manifest = JSON.parse(raw.toString()) as { targets: { name: string; gates: Gate[] }[] };
  if (!manifest.targets?.length) throw new Error('Site has no quality targets.');
  for (const target of manifest.targets) {
    const getName = (gate: Gate) => typeof gate === 'string' ? gate : gate.name;
    if (!target.gates.some((gate) => getName(gate) === 'build')) throw new Error(`Target ${target.name} lacks a build gate.`);
    const stringFormat = target.gates.every((gate) => typeof gate === 'string');
    const required: Gate[] = stringFormat ? ['test:newsletter', 'test:newsletter:integration'] : [
      { name: 'newsletter-unit', command: 'bun run test:newsletter' },
      { name: 'newsletter-integration', command: 'bun run test:newsletter:integration' }
    ];
    for (const gate of required) {
      const existing = target.gates.find((item) => getName(item) === getName(gate));
      if (existing && JSON.stringify(existing) !== JSON.stringify(gate)) throw new Error(`Custom ${getName(gate)} gate needs review.`);
    }
    const missing = required.filter((gate) => !target.gates.some((item) => getName(item) === getName(gate)));
    target.gates.splice(target.gates.findIndex((gate) => getName(gate) === 'build'), 0, ...missing);
  }
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
}

export function reviewSite(catalog: Catalog, site: InventorySite, sourceCommit: string) {
  const compatible = catalog.compatibility.find((row) => row.slug === site.slug && row.source === (site.reviewSource || site.source));
  if (!compatible) throw new Error(`${site.slug} lacks a reviewed compatibility entry.`);
  const base = git(site.source, ['rev-parse', 'refs/heads/develop']);
  const contents = new Map<string, Buffer>();
  const rows: ReviewFile[] = [];
  for (const shared of catalog.files) {
    let source = gitFile(catalog.sourceRoot, sourceCommit, shared.file);
    if (!source || sha256(source) !== shared.sourceSha256) throw new Error(`Committed source does not match reviewed manifest: ${shared.file}`);
    const before = gitFile(site.source, base, shared.file);
    const baseline = [gitFile(catalog.sourceRoot, catalog.hubBase, shared.file),
      gitFile(catalog.templateRoot, catalog.templateBase, shared.file)].map((value) => value && sha256(value));
    const priorAsapOverride = site.slug === 'asap' && shared.file === 'app/api/internal/newsletter-dispatch-cron/route.ts' &&
      before && before.equals(Buffer.from(source.toString().replace('batchSizePerCampaign: 80', 'batchSizePerCampaign: 200')));
    const decision = priorAsapOverride ? 'preserve-ASAP-batch-200' : classifyFile({ file: shared.file, before: before && sha256(before), after: shared.sourceSha256,
      baseline, reviewedDifference: compatible.differences.some((row) => row.file === shared.file) });
    if (decision === 'preserve-ASAP-batch-200') {
      const text = source.toString();
      if (!text.includes('batchSizePerCampaign: 80')) throw new Error('ASAP cron override no longer matches the reviewed source.');
      source = Buffer.from(text.replace('batchSizePerCampaign: 80', 'batchSizePerCampaign: 200'));
    }
    contents.set(shared.file, source);
    rows.push({ file: shared.file, before: before && sha256(before), after: sha256(source), decision });
  }
  for (const [file, merge] of [['package.json', mergePackage], ['quality/gates.json', mergeQuality]] as const) {
    const before = gitFile(site.source, base, file);
    if (!before) throw new Error(`${site.slug} is missing ${file}`);
    const result = merge(before);
    contents.set(file, result);
    rows.push({ file, before: sha256(before), after: sha256(result), decision: 'merge-newsletter-gates-only' });
  }
  return { base, contents, rows };
}

export function reviewedController(site: InventorySite): InventorySite {
  if (site.slug !== 'thebrave') return site;
  if (site.source !== '/srv/apps/thebrave') throw new Error('Unexpected Brave inventory source; review its controller mapping.');
  const source = '/srv/apps/thebrave-release';
  if (!existsSync(path.join(source, '.git'))) throw new Error('The reviewed Brave release controller is unavailable.');
  return { ...site, source, reviewSource: site.source };
}

export function pathsOverlap(left: string, right: string) {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}
