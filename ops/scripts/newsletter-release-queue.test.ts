import { afterEach, describe, expect, test } from 'bun:test';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { parseArgs } from './newsletter-release-queue';
import { EXPECTED_FEATURE_FILES, EXPECTED_SUPPORT_FILES, RECEIPT_PATH, verifyNewsletterScopedRelease } from './newsletter-release-preflight';
import { classifyFile, git, LEGACY_HASHES, mergePackage, mergeQuality, pathsOverlap, sha256 } from './newsletter-release-review';
import { acquireClaim, assertCurrentControllerMain, assertEquivalentDotenv, runLogged, runNewsletterQuality, siteEnvironment, stageClone, updateController } from './newsletter-release-runtime';
import { assertLighthousePortsFree, configuredLighthousePorts, listeningPorts, verifyNewsletterLighthouse } from './newsletter-release-lighthouse';

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

function freePort() {
  const busy = listeningPorts();
  for (let attempt = 0; attempt < 100; attempt++) {
    const port = 40_000 + Math.floor(Math.random() * 20_000);
    if (!busy.has(port)) return port;
  }
  throw new Error('No free fixture port found.');
}

function lighthouseFixture(mobile = [0.96, 1, 1], desktop = [1, 0.75, 1], port = freePort()) {
  const clone = temp(); const qualityStartedAt = Date.now() - 10_000;
  write(clone, 'quality/gates.json', JSON.stringify({ targets: [{ name: 'fixture', kind: 'site', gates: ['build', 'lighthouse'] }] }));
  for (const [viewport, performance] of [['mobile', mobile], ['desktop', desktop]] as const) {
    const names = ['performance', 'accessibility', 'best-practices', 'seo'];
    const url = `http://localhost:${port}/`; const directory = `.lighthouseci/${viewport}`;
    write(clone, `lighthouserc.${viewport}.json`, JSON.stringify({ ci: {
      collect: { numberOfRuns: 3, url: [url], settings: { formFactor: viewport } },
      assert: { assertions: Object.fromEntries(names.map((name) => [`categories:${name}`, ['error', { minScore: 1 }]])) },
      upload: { target: 'filesystem', outputDir: directory }
    } }));
    const manifest = performance.map((score, i) => {
      const jsonPath = path.join(clone, directory, `${i}.report.json`);
      write(clone, path.relative(clone, jsonPath), JSON.stringify({
        requestedUrl: url, fetchTime: new Date(qualityStartedAt + 1000 + i * 1000).toISOString(),
        configSettings: { formFactor: viewport }, categories: Object.fromEntries(names.map((name) => [name, { score: name === 'performance' ? score : 1 }])),
        audits: { arbitrary: 'do-not-copy-audit-secret' }
      }));
      return { url, jsonPath, summary: { performance: 1 } }; // Never trust the export's summary.
    });
    write(clone, `${directory}/manifest.json`, JSON.stringify(manifest));
  }
  return { clone, site: 'fixture', commit: 'a'.repeat(40), qualityStartedAt, port, reportFile: path.join(clone, 'release-evidence.json') };
}

function changeJson(root: string, file: string, change: (value: Record<string, unknown>) => void) {
  const value = JSON.parse(readFileSync(path.join(root, file), 'utf8')); change(value); write(root, file, JSON.stringify(value));
}

describe('newsletter release Lighthouse evidence', () => {
  for (const passing of [false, true]) {
    test(`hub release ${passing ? 'deploys the exact commit only after' : 'stops before deployment on failed'} median validation`, () => {
      const fixture = lighthouseFixture(passing ? [1, 1, 1] : [1, 0.99, 0.99], [1, 1, 1]);
      const script = path.resolve(import.meta.dir, '../../scripts/release-local.ts');
      const bin = path.join(fixture.clone, 'bin');
      const commandFixture = `#!${process.execPath} --no-env-file
        import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
        import path from 'node:path';
        const command = path.basename(process.argv[1]);
        const args = process.argv.slice(2);
        appendFileSync('calls.jsonl', JSON.stringify([command, ...args]) + '\\n');
          let stdout = '';
          if (command === 'git') {
            const key = args.join(' ');
            if (key === 'branch --show-current') stdout = 'main';
            else if (key === 'status --porcelain') stdout = '';
            else if (key === 'rev-parse HEAD') stdout = ${JSON.stringify(fixture.commit)};
            else if (key === 'rev-parse --absolute-git-dir') stdout = ${JSON.stringify(path.join(fixture.clone, '.git'))};
            else if (key === 'remote get-url origin') stdout = 'git@example.test:fixture.git';
            else if (key !== 'push -u origin main') throw new Error('Unexpected mocked Git command');
          } else if (command === 'bun') {
            if (args[1] === 'quality') {
              for (const viewport of ['mobile', 'desktop']) {
                for (let i = 0; i < 3; i++) {
                  const file = '.lighthouseci/' + viewport + '/' + i + '.report.json';
                  const report = JSON.parse(readFileSync(file, 'utf8'));
                  report.fetchTime = new Date().toISOString();
                  writeFileSync(file, JSON.stringify(report));
                  await Bun.sleep(3);
                }
              }
            }
            else if (!['quality:validate', 'deploy:blue-green'].includes(args[1])) throw new Error('Unexpected mocked Bun command');
          } else throw new Error('No real external commands are allowed');
          process.stdout.write(stdout);
      `;
      for (const name of ['git', 'bun']) {
        write(fixture.clone, `bin/${name}`, commandFixture);
        chmodSync(path.join(bin, name), 0o700);
      }
      const result = spawnSync(process.execPath, ['--no-env-file', script], {
        cwd: fixture.clone, encoding: 'utf8', timeout: 20_000,
        env: { PATH: `${bin}:/usr/bin:/bin`, HOME: fixture.clone, NODE_ENV: 'test' }
      });
      const calls = readFileSync(path.join(fixture.clone, 'calls.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
      const deployments = calls.filter((call: string[]) => call[0] === 'bun' && call[2] === 'deploy:blue-green');
      const pushes = calls.filter((call: string[]) => call[0] === 'git' && call[1] === 'push');
      if (passing) {
        expect(result.status).toBe(0);
        expect(deployments).toEqual([['bun', 'run', 'deploy:blue-green', '--', '--env-file=.env.production', `--commit=${fixture.commit}`]]);
        expect(pushes).toHaveLength(1);
      } else {
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('medians must be exactly 100');
        expect(deployments).toHaveLength(0);
        expect(pushes).toHaveLength(0);
      }
    });
  }

  test('hub release refuses to run quality gates while its Lighthouse port has a listener', () => {
    const server = Bun.listen({ hostname: '127.0.0.1', port: 0, socket: { data() {} } });
    try {
      const fixture = lighthouseFixture([1, 1, 1], [1, 1, 1], server.port);
      const script = path.resolve(import.meta.dir, '../../scripts/release-local.ts');
      const bin = path.join(fixture.clone, 'bin');
      const commandFixture = `#!${process.execPath} --no-env-file
        import { appendFileSync } from 'node:fs';
        import path from 'node:path';
        appendFileSync('calls.jsonl', JSON.stringify([path.basename(process.argv[1]), ...process.argv.slice(2)]) + '\\n');
        const key = process.argv.slice(2).join(' ');
        if (key === 'branch --show-current') process.stdout.write('main');
        else if (key === 'rev-parse HEAD') process.stdout.write(${JSON.stringify(fixture.commit)});
      `;
      for (const name of ['git', 'bun']) { write(fixture.clone, `bin/${name}`, commandFixture); chmodSync(path.join(bin, name), 0o700); }
      const result = spawnSync(process.execPath, ['--no-env-file', script], {
        cwd: fixture.clone, encoding: 'utf8', timeout: 20_000, env: { PATH: `${bin}:/usr/bin:/bin`, HOME: fixture.clone, NODE_ENV: 'test' }
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(`Lighthouse port ${server.port} already has a listener`);
      const calls = readFileSync(path.join(fixture.clone, 'calls.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
      expect(calls.some((call: string[]) => call[0] === 'bun')).toBe(false);
    } finally { server.stop(true); }
  });

  test('accepts three-run median 100 with variance and records only sanitized raw scores', () => {
    const options = lighthouseFixture();
    const result = verifyNewsletterLighthouse(options);
    expect(result.status).toBe('passed');
    expect(result.viewports[0].pages[0].categories.performance).toEqual({ scores: [0.96, 1, 1], median: 1 });
    expect(result.viewports[1].pages[0].categories.performance).toEqual({ scores: [1, 0.75, 1], median: 1 });
    expect(readFileSync(options.reportFile, 'utf8')).not.toContain('do-not-copy-audit-secret');
    expect(result.viewports[0].pages[0].runs[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  test('an optimistic LHCI pass cannot authorize deployment when the median is below 100', () => {
    const options = lighthouseFixture([0.96, 0.98, 1]);
    expect(() => verifyNewsletterLighthouse(options)).toThrow('medians must be exactly 100');
    const summary = JSON.parse(readFileSync(options.reportFile, 'utf8'));
    expect(summary.status).toBe('failed');
    expect(summary.viewports[0].pages[0].categories.performance.median).toBe(0.98);
  });

  test('requires three reports for every configured URL on each viewport', () => {
    const options = lighthouseFixture();
    const file = '.lighthouseci/desktop/manifest.json';
    const manifest = JSON.parse(readFileSync(path.join(options.clone, file), 'utf8')); manifest.pop();
    write(options.clone, file, JSON.stringify(manifest));
    expect(() => verifyNewsletterLighthouse(options)).toThrow('Exactly three');
    expect(JSON.parse(readFileSync(options.reportFile, 'utf8')).status).toBe('failed');
  });

  test('rejects stale and future timestamps even if cached reports all score 100', () => {
    for (const fetchTime of [new Date(0).toISOString(), new Date(Date.now() + 60_000).toISOString()]) {
      const options = lighthouseFixture([1, 1, 1], [1, 1, 1]);
      changeJson(options.clone, '.lighthouseci/mobile/0.report.json', (data) => { data.fetchTime = fetchTime; });
      expect(() => verifyNewsletterLighthouse(options)).toThrow('fresh for this quality run');
    }
  });

  test('rejects duplicate manifest references and copied report bytes as separate runs', () => {
    for (const copiedBytes of [false, true]) {
      const options = lighthouseFixture(); const file = '.lighthouseci/mobile/manifest.json';
      const manifest = JSON.parse(readFileSync(path.join(options.clone, file), 'utf8'));
      if (copiedBytes) write(options.clone, '.lighthouseci/mobile/1.report.json', readFileSync(manifest[0].jsonPath));
      else { manifest[1] = manifest[0]; write(options.clone, file, JSON.stringify(manifest)); }
      expect(() => verifyNewsletterLighthouse(options)).toThrow('Duplicate Lighthouse report');
    }
  });

  test('missing or null required categories cannot pass through optimistic filtering', () => {
    for (const missing of [true, false]) {
      const options = lighthouseFixture();
      changeJson(options.clone, '.lighthouseci/mobile/0.report.json', (data) => {
        const categories = data.categories as Record<string, unknown>;
        if (missing) delete categories.accessibility; else categories.accessibility = { score: null };
      });
      expect(() => verifyNewsletterLighthouse(options)).toThrow('invalid Lighthouse category score: accessibility');
    }
  });

  test('configured Lighthouse ports come from localhost URLs and the server start command', () => {
    const fixture = lighthouseFixture();
    expect(configuredLighthousePorts(fixture.clone)).toEqual([fixture.port]);
    changeJson(fixture.clone, 'lighthouserc.desktop.json', (config) => {
      (config.ci as { collect: Record<string, unknown> }).collect.startServerCommand = 'bun run start -- -p 3100';
    });
    expect(configuredLighthousePorts(fixture.clone)).toEqual([3100, fixture.port].sort((a, b) => a - b));
    changeJson(fixture.clone, 'lighthouserc.mobile.json', (config) => {
      (config.ci as { collect: Record<string, unknown> }).collect.url = ['https://example.test/'];
    });
    expect(configuredLighthousePorts(fixture.clone)).toEqual([3100, fixture.port].sort((a, b) => a - b));
  });

  test('quality gates refuse to start while a configured Lighthouse port already has a listener', () => {
    const fixture = lighthouseFixture();
    expect(() => assertLighthousePortsFree(fixture.clone, new Set([fixture.port]))).toThrow('already has a listener');
    expect(() => assertLighthousePortsFree(fixture.clone, new Set([fixture.port + 1]))).not.toThrow();
    const server = Bun.listen({ hostname: '127.0.0.1', port: 0, socket: { data() {} } });
    try {
      expect(listeningPorts().has(server.port)).toBe(true);
      const occupied = lighthouseFixture([1, 1, 1], [1, 1, 1], server.port);
      expect(() => assertLighthousePortsFree(occupied.clone)).toThrow(`Lighthouse port ${server.port} already has a listener`);
    } finally { server.stop(true); }
  });

  test('missing files and unexpected URLs fail with a recorded safe reason', () => {
    const missing = lighthouseFixture(); rmSync(path.join(missing.clone, '.lighthouseci/mobile/0.report.json'));
    expect(() => verifyNewsletterLighthouse(missing)).toThrow('missing or unreadable');
    const unexpected = lighthouseFixture();
    changeJson(unexpected.clone, '.lighthouseci/mobile/0.report.json', (data) => { data.requestedUrl = 'http://localhost:3100/wrong'; });
    expect(() => verifyNewsletterLighthouse(unexpected)).toThrow('does not match');
  });

  test('an actual manifest without Lighthouse is explicitly skipped without requiring report files', () => {
    const clone = temp();
    write(clone, 'quality/gates.json', JSON.stringify({ targets: [{ name: 'admin', gates: [{ name: 'build' }] }] }));
    const result = verifyNewsletterLighthouse({ clone, site: 'admin', commit: 'b'.repeat(40), qualityStartedAt: Date.now(), reportFile: path.join(clone, 'evidence.json') });
    expect(result.status).toBe('skipped'); expect(result.reason).toContain('declares no Lighthouse gate');
  });
});
