import { afterEach, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { addScopedReceipt } from './newsletter-release-queue';
import { EXPECTED_FEATURE_FILES, RECEIPT_PATH } from './newsletter-release-preflight';
import { git, type ReviewFile } from './newsletter-release-review';
import { validateReviewedTopology, type DeployConfig } from './newsletter-release-runtime';
import { deploymentAction, MINIMUM_RELEASE_FREE_BYTES, prepareReleaseAttempt, requireReleaseDiskSpace, saveReleaseAttempt } from './newsletter-release-state';
import { captureAndRestoreTrackedDeploymentState, readDeploymentState } from './newsletter-release-operational-state';

const temporary: string[] = [];
function temp() { const directory = mkdtempSync(path.join(tmpdir(), 'newsletter-release-state-')); temporary.push(directory); return directory; }
function write(root: string, file: string, bytes: Buffer | string) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), bytes);
}
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true }); });

test('disk floor stops safely before builds without deleting generated files', () => {
  const root = temp(); write(root, '.next/keep', 'generated');
  expect(() => requireReleaseDiskSpace(root, () => ({ bsize: 1, bavail: MINIMUM_RELEASE_FREE_BYTES - 1 }))).toThrow('at least 8 GiB');
  expect(readFileSync(path.join(root, '.next/keep'), 'utf8')).toBe('generated');
  expect(requireReleaseDiskSpace(root, () => ({ bsize: 1, bavail: MINIMUM_RELEASE_FREE_BYTES })).freeBytes).toBe(MINIMUM_RELEASE_FREE_BYTES);
});

test('primary topology accepts only reviewed source, slot paths, ports and services', () => {
  for (const [slug, source, ports] of [['asap', '/srv/apps/asap', [3103, 3104]], ['thebrave', '/srv/apps/thebrave-release', [3016, 3017]]] as const) {
    const config: DeployConfig = {
      controllerPath: '/isolated', activeLink: `/srv/apps/.ops/sites/${slug}/current`, upstreamConf: `/etc/nginx/snippets/${slug}-active-upstream.conf`,
      publicHealthUrl: 'https://fixture.test/api/session', healthPath: '/api/session',
      slots: { blue: { path: `/srv/apps/.ops/sites/${slug}/slots/blue`, port: ports[0], service: `vd-${slug}-blue`, envFile: '' },
        green: { path: `/srv/apps/.ops/sites/${slug}/slots/green`, port: ports[1], service: `vd-${slug}-green`, envFile: '' } }
    };
    const site = { slug, source, domain: 'fixture.test', isDemo: false };
    expect(() => validateReviewedTopology(site, config)).not.toThrow();
    expect(() => validateReviewedTopology({ ...site, source: '/another/controller' }, config)).toThrow('reviewed');
    config.slots.blue.path = '/srv/apps/other-site-blue';
    expect(() => validateReviewedTopology(site, config)).toThrow('unreviewed');
  }
});

function liveFixture() {
  const root = temp(); const clone = path.join(root, 'clone'); mkdirSync(path.join(clone, '.git'), { recursive: true });
  const blue = path.join(root, 'blue'); const green = path.join(root, 'green'); mkdirSync(blue); mkdirSync(green);
  const config: DeployConfig = { controllerPath: clone, activeLink: path.join(root, 'current'), upstreamConf: path.join(root, 'upstream.conf'),
    publicHealthUrl: 'https://fixture.test/', healthPath: '/', slots: {
      blue: { path: blue, port: 3001, service: 'fixture-blue', envFile: '' },
      green: { path: green, port: 3002, service: 'fixture-green', envFile: '' }
    } };
  symlinkSync(blue, config.activeLink); writeFileSync(config.upstreamConf, 'proxy_pass http://127.0.0.1:3001;\n');
  write(blue, 'previous-content', 'rollback version');
  return { clone, config, blue, green };
}

test('after-switch retries recheck exact commit health and preserve the previous live slot', async () => {
  const { clone, config, blue, green } = liveFixture(); const commit = 'a'.repeat(40);
  const contents = new Map([['feature.ts', Buffer.from('new feature')]]);
  const attempt = prepareReleaseAttempt(clone, commit, config);
  expect((await deploymentAction(config, attempt, contents)).action).toBe('deploy');
  attempt.status = 'deploying'; saveReleaseAttempt(clone, attempt);
  write(green, 'feature.ts', 'new feature'); unlinkSync(config.activeLink); symlinkSync(green, config.activeLink);
  writeFileSync(config.upstreamConf, 'proxy_pass http://127.0.0.1:3002;\n');
  write(clone, '.state.json', JSON.stringify({ deploy: { activeSlot: 'green', lastCommit: commit } }));
  const retry = prepareReleaseAttempt(clone, commit, config);
  expect(retry.previousLive.path).toBe(blue);
  const healthy = (async () => new Response('', { status: 200 })) as unknown as typeof fetch;
  expect((await deploymentAction(config, retry, contents, healthy)).action).toBe('already-live');
  expect(readFileSync(path.join(blue, 'previous-content'), 'utf8')).toBe('rollback version');
  write(green, 'feature.ts', 'drift');
  await expect(deploymentAction(config, retry, contents, healthy)).rejects.toThrow('content mismatch');
});

test('ambiguous after-switch crashes require review instead of overwriting a rollback slot', async () => {
  const { clone, config, green } = liveFixture(); const attempt = prepareReleaseAttempt(clone, 'b'.repeat(40), config);
  attempt.status = 'deploying'; saveReleaseAttempt(clone, attempt);
  unlinkSync(config.activeLink); symlinkSync(green, config.activeLink); writeFileSync(config.upstreamConf, 'proxy_pass http://127.0.0.1:3002;\n');
  await expect(deploymentAction(config, attempt, new Map())).rejects.toThrow('without exact-commit completion evidence');
  expect(() => prepareReleaseAttempt(clone, 'c'.repeat(40), config)).toThrow('earlier attempt');
  expect(existsSync(path.join(clone, '.git/newsletter-release-attempt.json'))).toBe(true);
});

test('receipt reuse after controller promotion avoids a new metadata-only release commit', () => {
  const root = temp();
  const command = (args: string[]) => {
    const result = spawnSync('git', ['-C', root, '-c', 'user.name=Tests', '-c', 'user.email=tests@localhost', ...args]);
    if (result.status !== 0) throw new Error('Git fixture failed');
  };
  command(['init', '-qb', 'develop']);
  write(root, 'scripts/sauro-core-preflight.ts', readFileSync(new URL('../../scripts/sauro-core-preflight.ts', import.meta.url)));
  command(['add', '.']); command(['commit', '-qm', 'base']); const base = git(root, ['rev-parse', 'HEAD']);
  const features = () => new Map(EXPECTED_FEATURE_FILES.concat(['package.json', 'quality/gates.json']).map((file) => [file, Buffer.from(`fixture ${file}`)]));
  const site = { slug: 'fixture', source: root, domain: 'fixture.test', isDemo: true };
  const first = { base, contents: features(), rows: [] as ReviewFile[] }; addScopedReceipt(first, site, 'd'.repeat(40), 'e'.repeat(40));
  for (const [file, bytes] of first.contents) write(root, file, bytes);
  command(['add', '.']); command(['commit', '-qm', 'release']);
  const second = { base: git(root, ['rev-parse', 'HEAD']), contents: features(), rows: [] as ReviewFile[] };
  addScopedReceipt(second, site, 'd'.repeat(40), 'e'.repeat(40));
  expect(second.contents.get(RECEIPT_PATH)?.equals(first.contents.get(RECEIPT_PATH)!)).toBe(true);
});

test('tracked runtime state is privately captured and restored only for the exact generated deployment mutation', async () => {
  const { clone, config, green } = liveFixture();
  const command = (args: string[]) => {
    const result = spawnSync('git', ['-C', clone, '-c', 'user.name=Tests', '-c', 'user.email=tests@localhost', ...args]);
    if (result.status !== 0) throw new Error('Git fixture failed');
  };
  command(['init', '-qb', 'develop']); const original = { custom: 'preserve', deploy: { lastCommit: 'old' } };
  write(clone, '.state.json', JSON.stringify(original)); command(['add', '.']); command(['commit', '-qm', 'candidate']);
  const commit = git(clone, ['rev-parse', 'HEAD']); const attempt = prepareReleaseAttempt(clone, commit, config);
  attempt.status = 'deploying'; saveReleaseAttempt(clone, attempt);
  unlinkSync(config.activeLink); symlinkSync(green, config.activeLink); writeFileSync(config.upstreamConf, 'proxy_pass http://127.0.0.1:3002;\n');
  const state = { ...original, deploy: { mode: 'blue-green', activeSlot: 'green', lastCommit: commit, updatedAt: new Date().toISOString(),
    upstreamConf: config.upstreamConf, activeLink: config.activeLink, rollbackWindowSeconds: 300, slots: config.slots } };
  write(clone, '.state.json', JSON.stringify(state));
  expect(captureAndRestoreTrackedDeploymentState(clone, commit, config).restored).toBe(true);
  expect(readFileSync(path.join(clone, '.state.json'), 'utf8')).toBe(JSON.stringify(original));
  expect(git(clone, ['status', '--porcelain'])).toBe('');
  expect(readDeploymentState(clone, commit)?.deploy?.lastCommit).toBe(commit);
  const healthy = (async () => new Response('', { status: 200 })) as unknown as typeof fetch;
  expect((await deploymentAction(config, attempt, new Map(), healthy)).action).toBe('already-live');
  write(clone, '.state.json', JSON.stringify({ ...state, custom: 'unexpected user edit' }));
  expect(() => captureAndRestoreTrackedDeploymentState(clone, commit, config)).toThrow('differs from');
  expect(JSON.parse(readFileSync(path.join(clone, '.state.json'), 'utf8')).custom).toBe('unexpected user edit');
});

function untrackedStateFixture() {
  const fixture = liveFixture(); const { clone, config, green } = fixture;
  const command = (args: string[]) => {
    const result = spawnSync('git', ['-C', clone, '-c', 'user.name=Tests', '-c', 'user.email=tests@localhost', ...args]);
    if (result.status !== 0) throw new Error('Git fixture failed');
  };
  command(['init', '-qb', 'develop']); write(clone, 'feature.ts', 'reviewed feature');
  command(['add', '.']); command(['commit', '-qm', 'candidate']);
  const commit = git(clone, ['rev-parse', 'HEAD']);
  const attempt = prepareReleaseAttempt(clone, commit, config); attempt.status = 'deploying'; saveReleaseAttempt(clone, attempt);
  unlinkSync(config.activeLink); symlinkSync(green, config.activeLink);
  writeFileSync(config.upstreamConf, 'proxy_pass http://127.0.0.1:3002;\n');
  write(green, 'feature.ts', 'reviewed feature');
  const deploy: Record<string, unknown> = { mode: 'blue-green', activeSlot: 'green', lastCommit: commit,
    updatedAt: new Date().toISOString(), upstreamConf: config.upstreamConf, activeLink: config.activeLink,
    rollbackWindowSeconds: 300, slots: config.slots };
  const state: Record<string, unknown> = { deploy };
  write(clone, '.state.json', JSON.stringify(state));
  return { ...fixture, commit, attempt, state, deploy };
}

test('only generated untracked deployment state is archived, keeping retries on the existing live slot', async () => {
  const { clone, config, commit, attempt, blue } = untrackedStateFixture();
  const captured = captureAndRestoreTrackedDeploymentState(clone, commit, config);
  expect(captured.capturedUntracked).toBe(true);
  expect(existsSync(path.join(clone, '.state.json'))).toBe(false);
  expect(git(clone, ['status', '--porcelain'])).toBe('');
  const saved = JSON.parse(readFileSync(path.join(clone, '.git/newsletter-deployment-state.json'), 'utf8'));
  expect(saved.source).toBe('generated-untracked');
  expect(saved.generatedStateSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(readDeploymentState(clone, commit)?.deploy?.lastCommit).toBe(commit);
  expect(readDeploymentState(clone, 'f'.repeat(40))).toBeNull();
  const healthy = (async () => new Response('', { status: 200 })) as unknown as typeof fetch;
  expect((await deploymentAction(config, attempt, new Map([['feature.ts', Buffer.from('reviewed feature')]]), healthy)).action).toBe('already-live');
  expect(readFileSync(path.join(blue, 'previous-content'), 'utf8')).toBe('rollback version');
  write(clone, '.state.json', JSON.stringify({ custom: 'new work', deploy: { lastCommit: 'different' } }));
  expect(readDeploymentState(clone, commit)?.deploy?.lastCommit).toBe('different');
  expect(git(clone, ['status', '--porcelain'])).toBe('?? .state.json');
});

test('untracked state with extra data or unknown writer metadata is preserved for review', () => {
  const changes: Array<(state: Record<string, unknown>, deploy: Record<string, unknown>) => void> = [
    (state) => { state.custom = 'unrelated work'; },
    (_state, deploy) => { deploy.custom = 'unknown metadata'; },
    (_state, deploy) => { deploy.lastCommit = 'f'.repeat(40); },
    (_state, deploy) => { deploy.rollbackWindowSeconds = 999; },
    (_state, deploy) => { delete deploy.rollbackWindowSeconds; }
  ];
  for (const change of changes) {
    const { clone, config, commit, state, deploy } = untrackedStateFixture();
    change(state, deploy); const bytes = JSON.stringify(state); write(clone, '.state.json', bytes);
    expect(() => captureAndRestoreTrackedDeploymentState(clone, commit, config)).toThrow('differs from');
    expect(readFileSync(path.join(clone, '.state.json'), 'utf8')).toBe(bytes);
    expect(existsSync(path.join(clone, '.git/newsletter-deployment-state.json'))).toBe(false);
  }
});

test('untracked state needs a matching started deployment and matching live routing', () => {
  for (const condition of ['missing', 'different', 'not-started', 'routing']) {
    const { clone, config, commit, attempt } = untrackedStateFixture();
    const bytes = readFileSync(path.join(clone, '.state.json'), 'utf8');
    if (condition === 'missing') unlinkSync(path.join(clone, '.git/newsletter-release-attempt.json'));
    if (condition === 'different') { attempt.commit = 'f'.repeat(40); saveReleaseAttempt(clone, attempt); }
    if (condition === 'not-started') { attempt.status = 'ready'; saveReleaseAttempt(clone, attempt); }
    if (condition === 'routing') writeFileSync(config.upstreamConf, 'proxy_pass http://127.0.0.1:3001;\n');
    expect(() => captureAndRestoreTrackedDeploymentState(clone, commit, config)).toThrow('preserved for review');
    expect(readFileSync(path.join(clone, '.state.json'), 'utf8')).toBe(bytes);
  }
});
