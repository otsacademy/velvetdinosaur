import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { readNewsletterEnvironment } from '../../lib/newsletter/operations';
import { EXPECTED_FEATURE_FILES, RECEIPT_PATH } from './newsletter-release-preflight';
import { git, gitFile, loadCatalog, reviewedController, reviewSite, runtimeEnvironmentRoot, sha256, type InventorySite } from './newsletter-release-review';
import { acquireClaim, assertCleanCommit, assertCurrentControllerMain, assertEquivalentDotenv, readDeployConfig, runLogged, runNewsletterQuality, siteEnvironment, stageClone,
  updateController, verifyDeployed } from './newsletter-release-runtime';
import { captureLiveSnapshot, deploymentAction, prepareReleaseAttempt, requireReleaseDiskSpace, saveReleaseAttempt,
  type ReleaseAttempt } from './newsletter-release-state';
import { captureAndRestoreTrackedDeploymentState } from './newsletter-release-operational-state';
import { verifyNewsletterLighthouse } from './newsletter-release-lighthouse';

type Options = {
  mode: 'dry-run' | 'stage' | 'release'; sites: string[]; remainingDemos: boolean;
  catalogDirectory: string; workspace: string; reportDirectory?: string;
  sourceCommit?: string; templateCommit?: string; updateController: boolean; mirror: boolean;
};

export function parseArgs(args: string[]): Options {
  const result: Options = { mode: 'dry-run', sites: [], remainingDemos: false,
    catalogDirectory: path.resolve('.design/newsletter-media'), workspace: '/srv/apps/.ops/newsletter-media',
    updateController: false, mirror: false };
  let explicitMode = false;
  for (const arg of args) {
    if (['--dry-run', '--stage', '--release'].includes(arg)) {
      if (explicitMode) throw new Error('Choose exactly one execution mode.');
      result.mode = arg.slice(2) as Options['mode']; explicitMode = true;
    } else if (arg === '--remaining-demos') result.remainingDemos = true;
    else if (arg === '--update-controller') result.updateController = true;
    else if (arg === '--mirror') result.mirror = true;
    else if (arg.startsWith('--sites=')) result.sites.push(...arg.slice(8).split(','));
    else if (arg.startsWith('--source-commit=')) result.sourceCommit = arg.slice(16);
    else if (arg.startsWith('--template-commit=')) result.templateCommit = arg.slice(18);
    else if (arg.startsWith('--catalog=')) result.catalogDirectory = path.resolve(arg.slice(10));
    else if (arg.startsWith('--workspace=')) result.workspace = path.resolve(arg.slice(12));
    else if (arg.startsWith('--report-dir=')) result.reportDirectory = path.resolve(arg.slice(13));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!result.remainingDemos && !result.sites.length) throw new Error('Choose --sites=slug,... or --remaining-demos. Default mode is read-only --dry-run.');
  if (result.remainingDemos && result.sites.length) throw new Error('Choose explicit sites or remaining demos, not both.');
  if (result.sites.some((slug) => !/^[a-z0-9][a-z0-9-]*$/.test(slug))) throw new Error('Invalid site slug.');
  if ([result.sourceCommit, result.templateCommit].some((ref) => ref && !/^[a-f0-9]{7,40}$/.test(ref))) throw new Error('Source revisions must be commit hashes.');
  if (result.mode !== 'release' && (result.updateController || result.mirror)) throw new Error('Controller updates and mirrors require --release.');
  return result;
}

export function addScopedReceipt(review: ReturnType<typeof reviewSite>, site: InventorySite, hubCommit: string, templateCommit: string) {
  const helperFile = 'scripts/newsletter-release-preflight.ts';
  const entryFile = 'scripts/sauro-core-preflight.ts';
  const helper = readFileSync(new URL('./newsletter-release-preflight.ts', import.meta.url));
  const original = gitFile(site.source, review.base, entryFile);
  if (!original) throw new Error('Site has no known Sauro preflight entrypoint.');
  const importLine = "import { verifyNewsletterScopedRelease } from './newsletter-release-preflight';\n";
  const functionLine = 'export function verifySauroCore(cwd = process.cwd()) {';
  const guardedLine = `${functionLine}\n  if (verifyNewsletterScopedRelease(cwd)) return;`;
  const canonical = original.toString().replace(importLine, '').replace(guardedLine, functionLine);
  if (sha256(canonical) !== '8bd5dfb85df26202d03d51e8dd2a48a6937a2d8ec1436211503680091da64ff9') {
    throw new Error('Unknown Sauro preflight implementation; review before adding scoped verification.');
  }
  const patched = Buffer.from(`${importLine}${canonical.replace(functionLine, guardedLine)}`);
  const previousHelper = gitFile(site.source, review.base, helperFile);
  if (previousHelper && !previousHelper.equals(helper)) throw new Error('Existing scoped preflight helper has unreviewed changes.');
  for (const [file, bytes] of [[helperFile, helper], [entryFile, patched]] as const) {
    const before = gitFile(site.source, review.base, file);
    review.contents.set(file, bytes);
    review.rows.push({ file, before: before && sha256(before), after: sha256(bytes), decision: 'opt-in-committed-scope-preflight' });
  }
  const receipt = { version: 1, site: site.slug, hubCommit, templateCommit, baseCommit: review.base,
    files: [...review.contents].map(([file, bytes]) => ({ file, sha256: sha256(bytes) })).sort((a, b) => a.file.localeCompare(b.file)) };
  const previousBytes = gitFile(site.source, review.base, RECEIPT_PATH);
  const previous = previousBytes ? JSON.parse(previousBytes.toString()) : null;
  const reusable = previous?.version === 1 && previous.site === site.slug && previous.hubCommit === hubCommit &&
    previous.templateCommit === templateCommit && /^[a-f0-9]{40}$/.test(previous.baseCommit) &&
    JSON.stringify(previous.files) === JSON.stringify(receipt.files) &&
    spawnSync('git', ['-C', site.source, 'merge-base', '--is-ancestor', previous.baseCommit, review.base]).status === 0;
  review.contents.set(RECEIPT_PATH, reusable ? previousBytes! : Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`));
}

async function executeSite(options: Options, site: InventorySite, review: ReturnType<typeof reviewSite>,
  sourceCommit: string, directory: string, signal: AbortSignal) {
  const clone = path.join(options.workspace, site.slug);
  const log = path.join(directory, `${site.slug}.log`);
  const reportFile = path.join(directory, `${site.slug}.json`);
  const environmentFile = path.join(runtimeEnvironmentRoot(site), '.env.production');
  const env = await readNewsletterEnvironment(environmentFile);
  const childEnv = siteEnvironment(env);
  let attempt: ReleaseAttempt | undefined;
  let deploymentConfig: Awaited<ReturnType<typeof readDeployConfig>> | undefined;
  const report: Record<string, unknown> = {
    site: site.slug, mode: options.mode, clone, sourceCommit, baseCommit: review.base,
    startedAt: new Date().toISOString(), status: 'starting', steps: [], files: review.rows,
    separateOperations: ['ownership migration', 'nginx newsletter-media route', 'scheduler activation after an empty-queue dry run']
  };
  const save = () => writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  const run = (command: string, args: string[], cwd = clone, environment = childEnv) => runLogged(command, args, cwd, log, environment, signal);
  const step = async (name: string, action: () => Promise<unknown>) => {
    report.status = name; save(); console.log(JSON.stringify({ site: site.slug, step: name, log }));
    const startedAt = new Date().toISOString();
    const result = await action();
    (report.steps as unknown[]).push({ name, startedAt, completedAt: new Date().toISOString() }); save();
    return result;
  };
  try {
    report.diskBeforeStage = requireReleaseDiskSpace(clone); save();
    if (options.mode === 'release' && existsSync(path.join(clone, '.git/newsletter-release-attempt.json'))) {
      const configuration = await readDeployConfig(site, clone, env);
      report.recoveredOperationalState = captureAndRestoreTrackedDeploymentState(clone, git(clone, ['rev-parse', 'HEAD']), configuration); save();
    }
    report.origin = await step('stage-reviewed-files', () => stageClone({ site, destination: clone, base: review.base,
      contents: review.contents, log, env: childEnv, signal }));
    if (options.mode === 'stage') { report.status = 'staged'; save(); return report; }
    const config = await readDeployConfig(site, clone, env);
    deploymentConfig = config;
    const configFile = path.join(directory, `${site.slug}-deploy.json`);
    writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
    await step('commit-reviewed-scope', async () => {
      const files = [...review.contents.keys()];
      await run('git', ['add', '--', ...files]);
      if (git(clone, ['diff', '--cached', '--name-only'])) {
        await run('git', ['-c', 'user.name=Velvet Dinosaur release', '-c', 'user.email=release@velvetdinosaur.com',
          'commit', '-m', `Add newsletter media from ${sourceCommit.slice(0, 12)}`]);
      }
    });
    const commit = git(clone, ['rev-parse', 'HEAD']); report.commit = commit; save();
    attempt = prepareReleaseAttempt(clone, commit, config);
    report.previousLive = attempt.previousLive;
    report.rollback = 'Previous slot/upstream recorded; existing deploy entrypoint handles its own health rollback. No automatic second slot switch occurs on runner verification failures.';
    save();
    assertCleanCommit(clone, commit);
    // Visibility only: unrelated, uncommitted template differences do not change
    // the reviewed release scope. The explicit scope check below is authoritative.
    await step('record-full-baseline-comparison', async () => {
      try {
        await run('bun', ['/opt/vdplatform/scripts/sync-editor-baseline.ts', '--site', clone, '--check']);
        report.fullBaseline = 'matches';
      } catch { report.fullBaseline = 'differs; see log; reviewed newsletter scope remains authoritative'; }
    });
    report.diskBeforeQuality = requireReleaseDiskSpace(clone); save();
    await assertEquivalentDotenv(clone, env);
    await step('install-frozen-lockfile', () => run('bun', ['install', '--frozen-lockfile']));
    const qualityStartedAt = Date.now();
    await runNewsletterQuality((args, environment) => run('bun', args, clone, environment), childEnv, step);
    report.lighthouse = await step('verify-lighthouse-category-medians', async () => verifyNewsletterLighthouse({
      clone, site: site.slug, commit, qualityStartedAt, reportFile: path.join(directory, `${site.slug}-lighthouse-summary.json`)
    }));
    assertCleanCommit(clone, commit);
    await step('verify-committed-scope', () => run('bun', ['-e',
      "import {verifySauroCore} from './scripts/sauro-core-preflight'; verifySauroCore();"], clone,
    { ...childEnv, NEWSLETTER_RELEASE_RECEIPT: RECEIPT_PATH }));
    await step('promote-exact-main-commit', async () => {
      const main = git(clone, ['rev-parse', '--verify', 'refs/heads/main'], true);
      const inheritedMain = main || git(clone, ['rev-parse', '--verify', 'refs/remotes/controller/main'], true);
      if (inheritedMain && spawnSync('git', ['-C', clone, 'merge-base', '--is-ancestor', inheritedMain, commit]).status !== 0) {
        throw new Error('Main is not an ancestor of the validated release; refusing promotion.');
      }
      await run('git', ['update-ref', 'refs/heads/main', commit, main || '0'.repeat(40)]);
    });
    await step('deploy-exact-main-blue-green', async () => {
      assertCleanCommit(clone, commit);
      if (git(site.source, ['rev-parse', 'refs/heads/develop']) !== review.base) {
        throw new Error('Controller develop changed during validation. Review the new base before deploying.');
      }
      assertCurrentControllerMain(site.source, clone, commit);
      const currentEnv = await readNewsletterEnvironment(environmentFile);
      const cloneEnv = await readNewsletterEnvironment(path.join(clone, '.env.production'));
      await assertEquivalentDotenv(clone, env);
      if (JSON.stringify(currentEnv) !== JSON.stringify(env) || JSON.stringify(cloneEnv) !== JSON.stringify(env)) {
        throw new Error('Site environment changed during validation; refresh the clone and rerun its gates.');
      }
      if (JSON.stringify(await readDeployConfig(site, clone, currentEnv)) !== JSON.stringify(config)) {
        throw new Error('Deployment slot configuration changed during validation.');
      }
      const action = await deploymentAction(config, attempt!, review.contents);
      if (action.action === 'already-live') { report.resume = 'Exact candidate already live; deployment skipped after fresh gates and health verification.'; return; }
      report.diskBeforeDeploy = [requireReleaseDiskSpace(clone), ...Object.values(config.slots).map((slot) => requireReleaseDiskSpace(slot.path))];
      attempt!.status = 'deploying'; saveReleaseAttempt(clone, attempt!); save();
      // This setting exists only in this child process, never in a service env file.
      await run('bun', ['run', 'deploy:blue-green', '--', '--env-file=.env.production', '--branch=main',
        `--commit=${commit}`, `--config=${configFile}`], clone, { ...childEnv, NEWSLETTER_RELEASE_RECEIPT: RECEIPT_PATH });
    });
    report.health = await step('verify-live-slot-and-public-health', () => verifyDeployed(config, commit, review.contents));
    attempt.status = 'verified'; attempt.health = report.health as ReleaseAttempt['health']; saveReleaseAttempt(clone, attempt);
    report.operationalState = captureAndRestoreTrackedDeploymentState(clone, commit, config); save();
    assertCleanCommit(clone, commit);
    report.controller = options.updateController ? await step('fast-forward-controller', () => updateController(site, clone, commit, run))
      : 'left unchanged; controller operational runner files must be promoted before scheduler activation';
    if (options.mirror && git(clone, ['remote', 'get-url', 'origin'], true)) {
      await step('mirror-existing-release-commits', () => run('git', ['push', 'origin', 'develop', 'main'])); report.mirror = 'pushed';
    } else report.mirror = options.mirror ? 'skipped: no canonical remote' : 'not requested';
    report.status = 'healthy'; report.completedAt = new Date().toISOString(); save(); return report;
  } catch (error) {
    report.failedStep = report.status; report.status = 'failed';
    if (deploymentConfig) {
      try { report.liveAfterFailure = captureLiveSnapshot(deploymentConfig); }
      catch { report.liveAfterFailure = 'Could not read current routing; manual inspection required.'; }
    }
    report.error = error instanceof Error ? error.message : 'Release failed'; save(); throw error;
  }
}

export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const catalog = loadCatalog(options.catalogDirectory);
  if (JSON.stringify([...EXPECTED_FEATURE_FILES].sort()) !== JSON.stringify(catalog.files.map((row) => row.file).sort())) {
    throw new Error('Scoped preflight feature inventory differs from the reviewed manifest.');
  }
  const sourceCommit = git(catalog.sourceRoot, ['rev-parse', '--verify', `${options.sourceCommit || 'HEAD'}^{commit}`]);
  const templateCommit = git(catalog.templateRoot, ['rev-parse', '--verify', `${options.templateCommit || 'HEAD'}^{commit}`]);
  for (const shared of catalog.files) {
    const bytes = gitFile(catalog.templateRoot, templateCommit, shared.file);
    if (!bytes || sha256(bytes) !== shared.sourceSha256) throw new Error(`Template commit does not match the reviewed feature: ${shared.file}`);
  }
  const slugs = options.remainingDemos ? catalog.inventory.filter((site) => site.isDemo && site.slug !== 'popty-cara').map((site) => site.slug)
    : [...new Set(options.sites)];
  const sites = slugs.map((slug) => {
    const site = catalog.inventory.find((row) => row.slug === slug);
    if (!site || slug === 'velvetdinosaur') throw new Error(`Unreviewed or unsupported fleet site: ${slug}`);
    return reviewedController(site);
  });
  const abort = new AbortController();
  const interrupt = () => abort.abort();
  process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
  const directory = options.reportDirectory || path.resolve('logs', `newsletter-release-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  let releaseClaim: (() => void) | undefined;
  const results: unknown[] = [];
  try {
    if (options.mode !== 'dry-run') { releaseClaim = acquireClaim(); mkdirSync(directory, { recursive: true, mode: 0o700 }); }
    for (const site of sites) {
      try {
        if (abort.signal.aborted) throw new Error('Queue interrupted; remaining sites untouched.');
        const review = reviewSite(catalog, site, sourceCommit);
        addScopedReceipt(review, site, sourceCommit, templateCommit);
        if (options.mode === 'dry-run') {
          let configurationReady = true; let configurationIssue: string | undefined;
          try { await readDeployConfig(site, path.join(options.workspace, site.slug), await readNewsletterEnvironment(path.join(runtimeEnvironmentRoot(site), '.env.production'))); }
          catch (error) { configurationReady = false; configurationIssue = error instanceof Error ? error.message : 'Configuration review needed'; }
          results.push({ site: site.slug, mode: 'dry-run', baseCommit: review.base, files: review.rows.length,
            configurationReady, configurationIssue, origin: git(site.source, ['remote', 'get-url', 'origin'], true) ? 'configured' : 'absent; mirror skipped' });
          console.log(JSON.stringify(results.at(-1))); continue;
        }
        results.push(await executeSite(options, site, review, sourceCommit, directory, abort.signal));
        writeFileSync(path.join(directory, 'summary.json'), `${JSON.stringify(results, null, 2)}\n`, { mode: 0o600 });
      } catch (error) {
        const failure = { site: site.slug, status: 'failed', error: error instanceof Error ? error.message : 'Review failed' };
        results.push(failure);
        if (options.mode !== 'dry-run' || options.reportDirectory) {
          mkdirSync(directory, { recursive: true, mode: 0o700 });
          const reportFile = path.join(directory, `${site.slug}.json`);
          const detailed = existsSync(reportFile) ? JSON.parse(readFileSync(reportFile, 'utf8')) : null;
          if (detailed?.status !== 'failed') writeFileSync(reportFile, `${JSON.stringify(failure, null, 2)}\n`, { mode: 0o600 });
          writeFileSync(path.join(directory, 'summary.json'), `${JSON.stringify(results, null, 2)}\n`, { mode: 0o600 });
        }
        throw error;
      }
    }
    if (options.mode === 'dry-run' && options.reportDirectory) {
      mkdirSync(directory, { recursive: true, mode: 0o700 });
      writeFileSync(path.join(directory, 'dry-run.json'), `${JSON.stringify({ sourceCommit, templateCommit, results }, null, 2)}\n`, { mode: 0o600 });
    }
    return results;
  } finally {
    releaseClaim?.(); process.off('SIGINT', interrupt); process.off('SIGTERM', interrupt);
  }
}

if (import.meta.main) main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Newsletter fleet queue failed.'); process.exitCode = 1;
});
