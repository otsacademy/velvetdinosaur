import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { parseArgs } from './newsletter-release-queue';
import { EXPECTED_FEATURE_FILES, EXPECTED_SUPPORT_FILES, RECEIPT_PATH, verifyNewsletterScopedRelease } from './newsletter-release-preflight';
import { classifyFile, git, LEGACY_HASHES, mergePackage, mergeQuality, pathsOverlap, sha256 } from './newsletter-release-review';
import { acquireClaim, assertCurrentControllerMain, assertEquivalentDotenv, runLogged, runNewsletterQuality, siteEnvironment, stageClone, updateController } from './newsletter-release-runtime';

const temporary: string[] = [];
function temp() { const dir = mkdtempSync(path.join(tmpdir(), 'newsletter-release-test-')); temporary.push(dir); return dir; }
function write(root: string, file: string, bytes: string | Buffer) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), bytes);
}
function command(root: string, args: string[]) {
  const result = spawnSync('git', ['-C', root, '-c', 'user.name=Newsletter tests', '-c', 'user.email=tests@localhost', ...args], { stdio: 'pipe' });
  if (result.status !== 0) throw new Error(`Fixture git ${args[0]} failed: ${result.stderr}`);
}
function commit(root: string) { command(root, ['add', '.']); command(root, ['commit', '-qm', 'fixture']); }
afterEach(() => { for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('newsletter fleet release safeguards', () => {
  test('defaults to dry-run and rejects ambiguous or dangerous options', () => {
    expect(parseArgs(['--remaining-demos']).mode).toBe('dry-run');
    expect(parseArgs(['--sites=asap,thebrave', '--release', '--source-commit=5502e278', '--update-controller']).updateController).toBe(true);
    expect(() => parseArgs(['--sites=../site'])).toThrow();
    expect(() => parseArgs(['--remaining-demos', '--release', '--stage'])).toThrow();
    expect(() => parseArgs(['--remaining-demos', '--mirror'])).toThrow();
    expect(() => parseArgs(['--remaining-demos', '--skip-quality'])).toThrow();
  });

  test('application settings come only from the target site, not Bun hub auto-loading', () => {
    const env = siteEnvironment({ MONGODB_URI: 'site-db', PUBLIC_BASE_URL: 'https://site.test', NEWSLETTER_ALLOW_DEMO_SEND: 'false' },
      { PATH: '/bin', HOME: '/tmp/home', MONGODB_URI: 'hub-db', POSTMARK_SERVER_TOKEN: 'hub-token',
        PUBLIC_BASE_URL: 'https://hub.test', NEWSLETTER_ALLOW_DEMO_SEND: 'true', CHROME_PATH: '/bad/chrome', NEWSLETTER_RELEASE_RECEIPT: 'bad' });
    expect(env).toEqual({ NODE_ENV: 'production', PATH: '/bin', HOME: '/tmp/home', MONGODB_URI: 'site-db', PUBLIC_BASE_URL: 'https://site.test', NEWSLETTER_ALLOW_DEMO_SEND: 'false' });
  });

  test('both quality entrypoints and their build children receive the opt-in scoped preflight', async () => {
    const root = temp(); const log = path.join(root, 'quality.log');
    write(root, 'package.json', JSON.stringify({ scripts: { 'quality:validate': 'bun quality.ts validate', quality: 'bun quality.ts' } }));
    write(root, 'quality.ts', `
      import { spawnSync } from 'node:child_process';
      if (process.env.NEWSLETTER_RELEASE_RECEIPT !== '${RECEIPT_PATH}') throw new Error('Broad preflight unexpectedly selected');
      if (process.argv[2] !== 'validate') {
        if (!process.argv.includes('--all')) throw new Error('Missing full manifest selection');
        const child = spawnSync('bun', ['-e', "if (!process.env.NEWSLETTER_RELEASE_RECEIPT) process.exit(9)"], { env: process.env });
        if (child.status !== 0) throw new Error('Build child lost release scope');
      }
      console.log(process.argv[2] === 'validate' ? 'manifest-passed' : 'all-gates-passed');
    `);
    const env = siteEnvironment({});
    await runNewsletterQuality((args, child) => runLogged('bun', args, root, log, child), env);
    expect(readFileSync(log, 'utf8')).toContain('manifest-passed');
    expect(readFileSync(log, 'utf8')).toContain('all-gates-passed');
    expect(env.NEWSLETTER_RELEASE_RECEIPT).toBeUndefined();
  });

  test('real Bun dotenv auto-loading is allowed only for exact production subsets', async () => {
    const root = temp(); write(root, '.env.local', 'REVIEW_FOREIGN_SETTING=stale\n');
    const result = spawnSync('bun', ['-e', 'console.log(process.env.REVIEW_FOREIGN_SETTING)'], { cwd: root, env: siteEnvironment({}), encoding: 'utf8' });
    expect(result.stdout.trim()).toBe('stale');
    await expect(assertEquivalentDotenv(root, { SITE_SLUG: 'fixture' })).rejects.toThrow('outside');
    expect(readFileSync(path.join(root, '.env.local'), 'utf8')).toContain('REVIEW_FOREIGN_SETTING');
    write(root, '.env.local', 'SITE_SLUG=fixture\n');
    await assertEquivalentDotenv(root, { SITE_SLUG: 'fixture', PRIVATE_KEY: 'fixture-key' });
    write(root, '.env.production.local', 'unknown_lowercase=stale\n');
    await expect(assertEquivalentDotenv(root, { SITE_SLUG: 'fixture' })).rejects.toThrow('cannot be proven');
  });

  test('known bookkeeping omissions require both exact hash and a reviewed matrix difference', () => {
    const base = { file: 'models/Asset.ts', before: LEGACY_HASHES['models/Asset.ts'], after: 'new', baseline: [] };
    expect(classifyFile({ ...base, reviewedDifference: true })).toBe('restore-reviewed-September-bookkeeping');
    expect(() => classifyFile({ ...base, reviewedDifference: false })).toThrow('Unreviewed');
    expect(() => classifyFile({ ...base, before: 'custom-schema', reviewedDifference: true })).toThrow('Unreviewed');
  });

  test('gate merging preserves custom site gates and both manifest formats', () => {
    const raw = Buffer.from(JSON.stringify({ version: 1, targets: [
      { name: 'site', kind: 'site', gates: ['lint', 'build', 'lighthouse'] },
      { name: 'admin', kind: 'admin', gates: [{ name: 'build', command: 'bun run custom:build' }, { name: 'visual', command: 'bun run custom:visual' }] }
    ] }));
    const merged = mergeQuality(raw); const parsed = JSON.parse(merged.toString());
    expect(parsed.targets[0].gates).toEqual(['lint', 'test:newsletter', 'test:newsletter:integration', 'build', 'lighthouse']);
    expect(parsed.targets[1].gates.slice(2)).toEqual([{ name: 'build', command: 'bun run custom:build' }, { name: 'visual', command: 'bun run custom:visual' }]);
    expect(mergeQuality(merged).equals(merged)).toBe(true);
    const pkg = mergePackage(Buffer.from(JSON.stringify({ scripts: { quality: 'q', 'quality:validate': 'v', 'deploy:blue-green': 'd', custom: 'keep' } })));
    expect(JSON.parse(pkg.toString()).scripts.custom).toBe('keep');
    expect(() => mergePackage(Buffer.from(JSON.stringify({ scripts: { 'test:newsletter': 'custom' } })))).toThrow('needs review');
  });

  test('stamp claim is exclusive and never steals an existing holder', () => {
    const location = path.join(temp(), 'claim'); const release = acquireClaim(location);
    expect(() => acquireClaim(location)).toThrow('already exists');
    expect(readFileSync(path.join(location, 'pid'), 'utf8').trim()).toBe(String(process.pid)); release();
    const next = acquireClaim(location); next();
  });

  test('existing clone edits are preserved instead of reset or overwritten', async () => {
    const root = temp(); const controller = path.join(root, 'controller'); const clone = path.join(root, 'clone');
    mkdirSync(controller); command(controller, ['init', '-qb', 'develop']); write(controller, 'feature.ts', 'base'); commit(controller);
    const base = git(controller, ['rev-parse', 'HEAD']);
    write(controller, '.env.production', 'MONGODB_URI="fixture"\n');
    const options = { site: { slug: 'fixture', source: controller, domain: 'fixture.test', isDemo: true }, destination: clone,
      base, contents: new Map([['feature.ts', Buffer.from('reviewed')]]), log: path.join(root, 'log'), env: siteEnvironment({}) };
    await stageClone(options); write(clone, 'feature.ts', 'user edit');
    await expect(stageClone(options)).rejects.toThrow('preserved for review');
    expect(readFileSync(path.join(clone, 'feature.ts'), 'utf8')).toBe('user edit');
    expect(readFileSync(path.join(controller, 'feature.ts'), 'utf8')).toBe('base');
    expect(pathsOverlap('scripts/newsletter.ts', 'scripts')).toBe(true);
    expect(pathsOverlap('scripts/newsletter.ts', 'scripts/other.ts')).toBe(false);
  });

  test('controller promotion preserves unrelated work and refuses overlapping dirty files', async () => {
    const root = temp(); const controller = path.join(root, 'controller'); const clone = path.join(root, 'clone');
    mkdirSync(controller); command(controller, ['init', '-qb', 'develop']);
    write(controller, 'feature.ts', 'old'); write(controller, 'custom.txt', 'site content'); commit(controller);
    command(root, ['clone', '-q', controller, clone]);
    write(clone, 'feature.ts', 'new');
    for (const file of ['scripts/newsletter-dispatch-cron.ts', 'scripts/newsletter-media-cleanup.ts', 'lib/newsletter/operations.ts']) write(clone, file, 'fixture');
    commit(clone); const release = git(clone, ['rev-parse', 'HEAD']);
    const site = { slug: 'fixture', source: controller, domain: 'fixture.test', isDemo: true };
    const run = async (_command: string, args: string[], cwd = controller) => { command(cwd, args); };
    write(controller, 'feature.ts', 'unfinished overlapping work');
    expect(await updateController(site, clone, release, run)).toContain('overlap');
    expect(readFileSync(path.join(controller, 'feature.ts'), 'utf8')).toBe('unfinished overlapping work');
    write(controller, 'feature.ts', 'old'); write(controller, 'custom.txt', 'unfinished unrelated work');
    write(controller, 'untracked.txt', 'keep this');
    expect(await updateController(site, clone, release, run)).toContain('fast-forwarded');
    expect(git(controller, ['rev-parse', 'main'])).toBe(release);
    expect(readFileSync(path.join(controller, 'custom.txt'), 'utf8')).toBe('unfinished unrelated work');
    expect(readFileSync(path.join(controller, 'untracked.txt'), 'utf8')).toBe('keep this');
  });

  test('a separately advanced controller main cannot hide behind stale clone remote refs', () => {
    const root = temp(); const controller = path.join(root, 'controller'); const clone = path.join(root, 'clone');
    mkdirSync(controller); command(controller, ['init', '-qb', 'develop']); write(controller, 'base', 'base'); commit(controller);
    command(controller, ['branch', 'main']); command(root, ['clone', '-q', '--origin', 'controller', controller, clone]);
    write(clone, 'feature', 'candidate'); commit(clone); const candidate = git(clone, ['rev-parse', 'HEAD']);
    expect(() => assertCurrentControllerMain(controller, clone, candidate)).not.toThrow();
    command(controller, ['switch', '-q', 'main']); write(controller, 'other-release', 'new main'); commit(controller); command(controller, ['switch', '-q', 'develop']);
    expect(() => assertCurrentControllerMain(controller, clone, candidate)).toThrow('Current controller main');
  });
});

test('scoped preflight is opt-in, requires committed complete scope, and rejects content drift', () => {
  const root = temp(); command(root, ['init', '-qb', 'develop']); write(root, 'seed', 'base'); commit(root);
  const baseCommit = git(root, ['rev-parse', 'HEAD']);
  const files = [...EXPECTED_FEATURE_FILES, ...EXPECTED_SUPPORT_FILES].map((file) => {
    const bytes = `fixture ${file}\n`; write(root, file, bytes); return { file, sha256: sha256(bytes) };
  });
  write(root, RECEIPT_PATH, JSON.stringify({ version: 1, baseCommit, hubCommit: 'a'.repeat(40), templateCommit: 'b'.repeat(40), files }));
  expect(() => verifyNewsletterScopedRelease(root, { NEWSLETTER_RELEASE_RECEIPT: RECEIPT_PATH })).toThrow('committed'); commit(root);
  expect(verifyNewsletterScopedRelease(root, {})).toBe(false);
  expect(() => verifyNewsletterScopedRelease(root, { NEWSLETTER_RELEASE_RECEIPT: '../receipt.json' })).toThrow('repository-local');
  expect(verifyNewsletterScopedRelease(root, { NEWSLETTER_RELEASE_RECEIPT: RECEIPT_PATH })).toBe(true);
  write(root, 'models/Asset.ts', 'changed after the gates');
  expect(() => verifyNewsletterScopedRelease(root, { NEWSLETTER_RELEASE_RECEIPT: RECEIPT_PATH })).toThrow('content drift');
  write(root, 'models/Asset.ts', 'fixture models/Asset.ts\n');
  const receipt = JSON.parse(readFileSync(path.join(root, RECEIPT_PATH), 'utf8')); receipt.files.pop();
  write(root, RECEIPT_PATH, JSON.stringify(receipt)); commit(root);
  expect(() => verifyNewsletterScopedRelease(root, { NEWSLETTER_RELEASE_RECEIPT: RECEIPT_PATH })).toThrow('exactly the reviewed');
});
