import { existsSync, readFileSync, realpathSync, statfsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { verifyDeployed, type DeployConfig } from './newsletter-release-runtime';
import { readDeploymentState } from './newsletter-release-operational-state';

export const MINIMUM_RELEASE_FREE_BYTES = 8 * 1024 ** 3;

export function requireReleaseDiskSpace(directory: string,
  inspect: (directory: string) => { bavail: number | bigint; bsize: number | bigint } = statfsSync) {
  let existing = path.resolve(directory);
  while (!existsSync(existing) && path.dirname(existing) !== existing) existing = path.dirname(existing);
  const disk = inspect(existing);
  const freeBytes = Number(disk.bavail) * Number(disk.bsize);
  if (freeBytes < MINIMUM_RELEASE_FREE_BYTES) {
    throw new Error(`Release needs at least 8 GiB free at ${existing}; ${freeBytes} bytes available. Review generated caches before retrying; nothing was deleted.`);
  }
  return { path: existing, freeBytes, minimumFreeBytes: MINIMUM_RELEASE_FREE_BYTES };
}

export type LiveSnapshot = {
  capturedAt: string; activeSlot: 'blue' | 'green'; path: string; port: number; service: string;
  activeLink: string; upstreamConf: string; upstreamText: string; buildId: string | null;
  recordedCommit: string | null;
};
export type ReleaseAttempt = {
  version: 1; commit: string; status: 'ready' | 'deploying' | 'verified'; previousLive: LiveSnapshot;
  updatedAt: string; health?: { live: string; status: number; commit: string };
};

function optionalJson(file: string): Record<string, unknown> | null {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

export function captureLiveSnapshot(config: DeployConfig): LiveSnapshot {
  const live = realpathSync(config.activeLink);
  const name = (['blue', 'green'] as const).find((slot) => path.resolve(config.slots[slot].path) === live);
  if (!name) throw new Error('Cannot record an unknown live slot.');
  const slot = config.slots[name];
  const state = readDeploymentState(config.controllerPath)?.deploy as { activeSlot?: string; lastCommit?: string } | undefined;
  const buildFile = path.join(live, '.next/BUILD_ID');
  return {
    capturedAt: new Date().toISOString(), activeSlot: name, path: live, port: slot.port, service: slot.service,
    activeLink: config.activeLink, upstreamConf: config.upstreamConf, upstreamText: readFileSync(config.upstreamConf, 'utf8'),
    buildId: existsSync(buildFile) ? readFileSync(buildFile, 'utf8').trim() : null,
    recordedCommit: state?.activeSlot === name ? state.lastCommit || null : null
  };
}

const attemptPath = (clone: string) => path.join(clone, '.git/newsletter-release-attempt.json');
export function saveReleaseAttempt(clone: string, attempt: ReleaseAttempt) {
  attempt.updatedAt = new Date().toISOString();
  writeFileSync(attemptPath(clone), `${JSON.stringify(attempt, null, 2)}\n`, { mode: 0o600 });
}

function sameRouting(left: LiveSnapshot, right: LiveSnapshot) {
  return left.path === right.path && left.upstreamText === right.upstreamText;
}

export function prepareReleaseAttempt(clone: string, commit: string, config: DeployConfig): ReleaseAttempt {
  const prior = optionalJson(attemptPath(clone)) as ReleaseAttempt | null;
  if (prior) {
    if (prior.version !== 1 || !/^[a-f0-9]{40}$/.test(prior.commit) || !prior.previousLive?.path) throw new Error('Invalid saved release attempt; review before retrying.');
    if (prior.commit === commit) return prior;
    if (prior.status !== 'verified' && !sameRouting(prior.previousLive, captureLiveSnapshot(config))) {
      throw new Error('An earlier attempt changed live routing without verified completion; review it before using a new commit.');
    }
  }
  const attempt: ReleaseAttempt = { version: 1, commit, status: 'ready', previousLive: captureLiveSnapshot(config), updatedAt: new Date().toISOString() };
  saveReleaseAttempt(clone, attempt);
  return attempt;
}

export async function deploymentAction(config: DeployConfig, attempt: ReleaseAttempt, contents: Map<string, Buffer>, request: typeof fetch = fetch) {
  const state = readDeploymentState(config.controllerPath, attempt.commit)?.deploy as { lastCommit?: string } | undefined;
  if (state?.lastCommit === attempt.commit) {
    // Rechecking full live bytes and HTTP health prevents an after-switch retry
    // from overwriting the previous live slot just to repeat the same deployment.
    const health = await verifyDeployed(config, attempt.commit, contents, request);
    return { action: 'already-live' as const, health };
  }
  if (!sameRouting(attempt.previousLive, captureLiveSnapshot(config))) {
    throw new Error('Live routing changed without exact-commit completion evidence. Review rollback/recovery before retrying; neither slot was overwritten.');
  }
  return { action: 'deploy' as const };
}
