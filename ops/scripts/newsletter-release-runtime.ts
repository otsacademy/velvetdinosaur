import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync,
  realpathSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readNewsletterEnvironment } from '../../lib/newsletter/operations';
import { git, gitFile, pathsOverlap, runtimeEnvironmentRoot, sha256, type InventorySite } from './newsletter-release-review';
import { RECEIPT_PATH } from './newsletter-release-preflight';
import { readDeploymentState } from './newsletter-release-operational-state';
import { assertLighthousePortsFree } from './newsletter-release-lighthouse';

export type DeployConfig = {
  controllerPath: string; activeLink: string; upstreamConf: string; publicHealthUrl: string;
  healthPath: string; healthHost?: string; activeSlot?: 'blue' | 'green'; rollbackWindowSeconds?: number;
  slots: Record<'blue' | 'green', { path: string; port: number; service: string; envFile: string }>;
};

export function siteEnvironment(site: Record<string, string>, inherited: Record<string, string | undefined> = process.env): NodeJS.ProcessEnv {
  // Bun may have loaded the hub's env before this script started. Only OS/runtime
  // settings survive; every application setting comes from this site's own file.
  const next: NodeJS.ProcessEnv = { NODE_ENV: 'production' };
  for (const [key, value] of Object.entries(inherited)) {
    if (/^(PATH|HOME|USER|LOGNAME|SHELL|LANG|LC_[A-Z_]+|TMPDIR|XDG_[A-Z_]+|BUN_INSTALL|TERM)$/.test(key)) next[key] = value;
  }
  Object.assign(next, site);
  delete next.CHROME_PATH;
  delete next.NEWSLETTER_RELEASE_RECEIPT;
  return next;
}

export async function runNewsletterQuality(
  run: (args: string[], env: NodeJS.ProcessEnv) => Promise<void>, env: NodeJS.ProcessEnv,
  step: (name: string, action: () => Promise<void>) => Promise<unknown> = async (_name, action) => action(),
  root?: string
) {
  const scoped = { ...env, NEWSLETTER_RELEASE_RECEIPT: RECEIPT_PATH };
  // A checkout is required to know the configured LHCI ports; the queue always passes its clone.
  if (root) await step('assert-lighthouse-ports-free', async () => assertLighthousePortsFree(root));
  await step('quality-manifest-validation', () => run(['run', 'quality:validate'], scoped));
  // The quality wrapper's own preflight and every build child inherit this scope.
  await step('all-manifest-quality-gates', () => run(['run', 'quality', '--all'], scoped));
}

export async function assertEquivalentDotenv(directory: string, production: Record<string, string>) {
  for (const name of ['.env', '.env.local', '.env.production.local', '.env.development', '.env.development.local', '.env.test', '.env.test.local']) {
    const file = path.join(directory, name);
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
    if (lines.some((line) => !/^(?:export\s+)?[A-Z][A-Z0-9_]*\s*=/.test(line))) {
      throw new Error(`${name} cannot be proven equivalent to the reviewed production environment; file preserved for review.`);
    }
    const extras = await readNewsletterEnvironment(file);
    if (Object.entries(extras).some(([key, value]) => production[key] !== value)) {
      throw new Error(`${name} contains settings outside the reviewed production environment; file preserved for review.`);
    }
  }
}

export function acquireClaim(directory = '/opt/vdplatform/workspaces/.stamp-claim') {
  try { mkdirSync(directory); }
  catch { throw new Error(`Fleet stamp claim already exists at ${directory}. Review its holder; this runner never removes another claim.`); }
  const token = randomUUID();
  writeFileSync(path.join(directory, 'slug'), 'newsletter-release-queue\n');
  writeFileSync(path.join(directory, 'pid'), `${process.pid}\n`);
  writeFileSync(path.join(directory, 'since'), `${new Date().toISOString()}\n`);
  writeFileSync(path.join(directory, 'token'), token);
  return () => {
    if (readFileSync(path.join(directory, 'token'), 'utf8') !== token) return;
    for (const name of ['slug', 'pid', 'since', 'token']) unlinkSync(path.join(directory, name));
    rmdirSync(directory);
  };
}

export async function runLogged(command: string, args: string[], cwd: string, log: string,
  env: NodeJS.ProcessEnv, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new Error('Queue interrupted.');
  const descriptor = openSync(log, 'a', 0o600);
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { cwd, env, stdio: ['ignore', descriptor, descriptor], detached: true });
      const stop = () => {
        if (child.pid) { try { process.kill(-child.pid, 'SIGTERM'); } catch { /* child already ended */ } }
      };
      signal?.addEventListener('abort', stop, { once: true });
      child.once('error', (error) => { signal?.removeEventListener('abort', stop); reject(error); });
      child.once('close', (code) => {
        signal?.removeEventListener('abort', stop);
        if (code === 0 && !signal?.aborted) resolve();
        else reject(new Error(`${command} ${args[0] || ''} failed (${code ?? 'signal'}); inspect ${log}`));
      });
    });
  } finally { closeSync(descriptor); }
}

export function dirtyPaths(cwd: string): string[] {
  const changed = git(cwd, ['diff', '--name-only', '-z', 'HEAD']).split('\0');
  const untracked = git(cwd, ['ls-files', '--others', '--exclude-standard', '-z']).split('\0');
  return [...new Set([...changed, ...untracked].filter(Boolean))];
}

export function dirtyFingerprint(cwd: string): Map<string, string> {
  return new Map(dirtyPaths(cwd).map((file) => {
    const target = path.join(cwd, file);
    if (!existsSync(target)) return [file, 'deleted'];
    const stat = lstatSync(target);
    if (!stat.isFile()) throw new Error(`Unsupported dirty non-file in controller: ${file}`);
    return [file, `${stat.mode}:${sha256(readFileSync(target))}`];
  }));
}

export async function stageClone(options: {
  site: InventorySite; destination: string; base: string; contents: Map<string, Buffer>;
  log: string; env: NodeJS.ProcessEnv; signal?: AbortSignal;
}) {
  const { site, destination, base, contents, log, env, signal } = options;
  const cmd = (args: string[], cwd = destination) => runLogged('git', args, cwd, log, env, signal);
  if (!existsSync(destination)) {
    mkdirSync(path.dirname(destination), { recursive: true });
    await cmd(['clone', '--no-hardlinks', '--branch', 'develop', '--origin', 'controller', site.source, destination], path.dirname(destination));
    const origin = git(site.source, ['remote', 'get-url', 'origin'], true);
    if (origin) await cmd(['remote', 'add', 'origin', origin]);
  }
  const currentController = path.resolve(git(destination, ['remote', 'get-url', 'controller']));
  const previousReviewedController = site.reviewSource && currentController === path.resolve(site.reviewSource);
  if (git(destination, ['branch', '--show-current']) !== 'develop' ||
      (currentController !== path.resolve(site.source) && !previousReviewedController)) {
    throw new Error(`Existing clone ${destination} has the wrong branch/controller remote.`);
  }
  if (spawnSync('git', ['-C', destination, 'merge-base', '--is-ancestor', base, 'HEAD']).status !== 0) {
    throw new Error('Existing clone does not descend from the current controller develop; review it without resetting.');
  }
  const committedChanges = git(destination, ['diff', '--name-only', base, 'HEAD']).split('\n').filter(Boolean);
  for (const file of [...committedChanges, ...dirtyPaths(destination)]) {
    const expected = contents.get(file);
    if (!expected || !existsSync(path.join(destination, file)) || !readFileSync(path.join(destination, file)).equals(expected)) {
      throw new Error(`Existing clone has an unreviewed change in ${file}; preserved for review.`);
    }
  }
  if (previousReviewedController) await cmd(['remote', 'set-url', 'controller', site.source]);
  const sourceEnvironment = path.join(runtimeEnvironmentRoot(site), '.env.production');
  await assertEquivalentDotenv(destination, await readNewsletterEnvironment(sourceEnvironment));
  for (const [file, content] of contents) {
    const target = path.join(destination, file);
    for (let parent = path.dirname(target); parent !== destination; parent = path.dirname(parent)) {
      if (existsSync(parent) && lstatSync(parent).isSymbolicLink()) throw new Error(`Refusing a staged directory symlink: ${file}`);
    }
    if (existsSync(target) && lstatSync(target).isSymbolicLink()) throw new Error(`Refusing a staged symlink: ${file}`);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  const exclude = path.join(destination, '.git/info/exclude');
  appendFileSync(exclude, '\n.env.production\n.env.local\n');
  const environment = readFileSync(sourceEnvironment);
  if (existsSync(path.join(destination, '.env.production')) && lstatSync(path.join(destination, '.env.production')).isSymbolicLink()) {
    throw new Error('Clone environment must be a private regular file, not a symlink.');
  }
  writeFileSync(path.join(destination, '.env.production'), environment, { mode: 0o600 });
  chmodSync(path.join(destination, '.env.production'), 0o600);
  return git(site.source, ['remote', 'get-url', 'origin'], true) ? 'available' : 'absent; mirror will be skipped';
}

export function assertCleanCommit(cwd: string, commit: string) {
  if (git(cwd, ['rev-parse', 'HEAD']) !== commit || git(cwd, ['status', '--porcelain'])) {
    throw new Error('Validated clone changed after its release commit; no promotion/deployment is allowed.');
  }
}

export function assertCurrentControllerMain(controller: string, clone: string, commit: string) {
  const main = git(controller, ['rev-parse', '--verify', 'refs/heads/main'], true);
  if (main && spawnSync('git', ['-C', clone, 'merge-base', '--is-ancestor', main, commit]).status !== 0) {
    throw new Error('Current controller main is not an ancestor of the candidate; deployment refused.');
  }
}

export function validateReviewedTopology(site: InventorySite, config: DeployConfig) {
  const primary = {
    asap: { source: '/srv/apps/asap', ports: [3103, 3104] },
    thebrave: { source: '/srv/apps/thebrave-release', ports: [3016, 3017] }
  }[site.slug];
  const root = primary ? `/srv/apps/.ops/sites/${site.slug}` : site.source;
  if (primary && site.source !== primary.source) throw new Error('Primary controller does not match the reviewed release source.');
  for (const [index, name] of (['blue', 'green'] as const).entries()) {
    const slot = config.slots[name];
    const expectedPath = primary ? `${root}/slots/${name}` : `${path.resolve(root)}-${name}`;
    if (!slot?.path || path.resolve(slot.path) !== expectedPath || !Number.isInteger(slot.port) || slot.port < 1 || slot.port > 65535 || !slot.service) {
      throw new Error('Unsafe or unreviewed slot metadata.');
    }
    if (primary && (slot.port !== primary.ports[index] || slot.service !== `vd-${site.slug}-${name}`)) {
      throw new Error('Primary slot port/service differs from the reviewed topology.');
    }
  }
  const expectedLink = primary ? `${root}/current` : `${path.resolve(root)}-current`;
  if (path.resolve(config.activeLink) !== expectedLink || !config.upstreamConf.startsWith('/etc/nginx/')) throw new Error('Unreviewed slot link/upstream paths.');
  if (primary && config.upstreamConf !== `/etc/nginx/snippets/${site.slug}-active-upstream.conf`) throw new Error('Unreviewed primary nginx upstream.');
}

export async function readDeployConfig(site: InventorySite, clone: string, env: Record<string, string>) {
  const filename = path.join(site.source, 'deploy/local-first.json');
  let config: DeployConfig;
  if (existsSync(filename)) config = JSON.parse(readFileSync(filename, 'utf8'));
  else {
    if (env.VD_DEPLOY_MODE !== 'blue-green') throw new Error('Site is not configured for blue/green deployment.');
    const slot = (name: string) => ({ path: env[`VD_DEPLOY_${name}_PATH`], port: Number(env[`VD_DEPLOY_${name}_PORT`]),
      service: env[`VD_DEPLOY_${name}_SERVICE`], envFile: '' });
    const healthPath = env.VD_DEPLOY_HEALTH_PATH || '/';
    config = {
      controllerPath: clone, activeLink: env.VD_DEPLOY_ACTIVE_LINK || path.join(path.dirname(site.source), `${env.SITE_SLUG || site.slug}-current`),
      upstreamConf: env.VD_DEPLOY_UPSTREAM_CONF || `/etc/nginx/snippets/${env.SITE_SLUG || site.slug}-active-upstream.conf`,
      publicHealthUrl: env.VD_DEPLOY_PUBLIC_HEALTH_URL || `${env.PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || `https://${env.DOMAIN}`}${healthPath}`,
      healthPath, healthHost: env.VD_DEPLOY_HEALTH_HOST || undefined,
      rollbackWindowSeconds: env.VD_DEPLOY_ROLLBACK_WINDOW_SECONDS === undefined ? undefined : Number(env.VD_DEPLOY_ROLLBACK_WINDOW_SECONDS),
      activeSlot: env.VD_DEPLOY_ACTIVE_SLOT === 'green' ? 'green' : 'blue', slots: { blue: slot('BLUE'), green: slot('GREEN') }
    };
  }
  config.controllerPath = clone;
  validateReviewedTopology(site, config);
  if (config.rollbackWindowSeconds != null && (!Number.isFinite(config.rollbackWindowSeconds) || config.rollbackWindowSeconds < 0)) {
    throw new Error('Invalid configured rollback window.');
  }
  const publicUrl = new URL(config.publicHealthUrl);
  if (publicUrl.protocol !== 'https:' || publicUrl.username || publicUrl.password || publicUrl.hostname !== site.domain) {
    throw new Error('Deployment public health URL must match the reviewed HTTPS site domain.');
  }
  const key = env.NEWSLETTER_MEDIA_ENCRYPTION_KEY || '';
  if (Buffer.from(key, 'base64').length !== 32 || Buffer.from(key, 'base64').toString('base64') !== key || !env.CRON_SECRET) {
    throw new Error('Newsletter encryption key and cron secret must be provisioned before release.');
  }
  for (const slot of Object.values(config.slots)) {
    slot.envFile ||= path.join(slot.path, '.env.production');
    const slotEnv = await readNewsletterEnvironment(slot.envFile);
    await assertEquivalentDotenv(slot.path, slotEnv);
    for (const field of ['MONGODB_URI', 'NEWSLETTER_MEDIA_ENCRYPTION_KEY', 'CRON_SECRET']) {
      if (!env[field] || slotEnv[field] !== env[field]) throw new Error(`Controller and slot configuration disagree on ${field}.`);
    }
    if (!(env.R2_BUCKET || env.R2_BUCKET_NAME) || (env.R2_BUCKET || env.R2_BUCKET_NAME) !== (slotEnv.R2_BUCKET || slotEnv.R2_BUCKET_NAME)) {
      throw new Error('Controller and slot configuration disagree on the R2 bucket.');
    }
  }
  const activePath = realpathSync(config.activeLink);
  const active = Object.values(config.slots).find((slot) => path.resolve(slot.path) === activePath);
  if (!active || !readFileSync(config.upstreamConf, 'utf8').includes(`127.0.0.1:${active.port}`)) {
    throw new Error('Active symlink and nginx upstream disagree; resolve before a slot can be rebuilt.');
  }
  return config;
}

export async function verifyDeployed(config: DeployConfig, commit: string, contents: Map<string, Buffer>, request: typeof fetch = fetch) {
  const state = readDeploymentState(config.controllerPath, commit);
  if (state?.deploy?.lastCommit !== commit) throw new Error('Deployment state does not record the exact release commit.');
  const live = realpathSync(config.activeLink);
  const active = (['blue', 'green'] as const).find((name) => path.resolve(config.slots[name].path) === live);
  if (!active || state.deploy.activeSlot !== active) throw new Error('Live link disagrees with recorded deployment slot.');
  for (const [file, expected] of contents) {
    if (!readFileSync(path.join(live, file)).equals(expected)) throw new Error(`Live slot content mismatch: ${file}`);
  }
  const response = await request(config.publicHealthUrl, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
  await response.body?.cancel();
  if (response.status !== 200) throw new Error(`Public health returned HTTP ${response.status}.`);
  return { live, status: response.status, commit };
}

export async function updateController(site: InventorySite, clone: string, commit: string,
  run: (command: string, args: string[], cwd?: string) => Promise<void>) {
  if (git(site.source, ['branch', '--show-current']) !== 'develop') return 'skipped: controller is not on develop';
  const before = dirtyFingerprint(site.source);
  await run('git', ['fetch', '--no-tags', clone, 'develop'], site.source);
  if (spawnSync('git', ['-C', site.source, 'merge-base', '--is-ancestor', 'develop', commit]).status !== 0) {
    return 'skipped: controller develop diverged';
  }
  const changes = git(site.source, ['diff', '--name-only', 'develop', commit]).split('\n').filter(Boolean);
  if ([...before.keys()].some((file) => changes.some((changed) => pathsOverlap(file, changed)))) {
    return 'skipped: original dirty files overlap the release';
  }
  const main = git(site.source, ['rev-parse', '--verify', 'refs/heads/main'], true);
  if (main && spawnSync('git', ['-C', site.source, 'merge-base', '--is-ancestor', main, commit]).status !== 0) {
    return 'skipped: controller main diverged';
  }
  await run('git', ['merge', '--ff-only', commit], site.source);
  await run('git', ['update-ref', 'refs/heads/main', commit, main || '0'.repeat(40)], site.source);
  const after = dirtyFingerprint(site.source);
  if (JSON.stringify([...before]) !== JSON.stringify([...after])) throw new Error('Original controller dirty-file fingerprint changed; review immediately.');
  for (const file of ['scripts/newsletter-dispatch-cron.ts', 'scripts/newsletter-media-cleanup.ts', 'lib/newsletter/operations.ts']) {
    if (!readFileSync(path.join(site.source, file)).equals(gitFile(clone, commit, file)!)) throw new Error(`Controller operational file mismatch: ${file}`);
  }
  return 'fast-forwarded develop/main; original dirty files preserved; cron runner files verified';
}
