import { existsSync, lstatSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { git, gitFile, sha256 } from './newsletter-release-review';
import type { DeployConfig } from './newsletter-release-runtime';

const privateStatePath = (clone: string) => path.join(clone, '.git/newsletter-deployment-state.json');
type DeploymentState = { deploy?: Record<string, unknown>; [key: string]: unknown };

export function readDeploymentState(clone: string, expectedCommit?: string): DeploymentState | null {
  const stateFile = path.join(clone, '.state.json');
  const raw = existsSync(stateFile) ? readFileSync(stateFile) : null;
  const state = raw ? JSON.parse(raw.toString()) as DeploymentState : null;
  if (expectedCommit && state?.deploy?.lastCommit === expectedCommit) return state;
  const savedFile = privateStatePath(clone);
  if (existsSync(savedFile)) {
    const saved = JSON.parse(readFileSync(savedFile, 'utf8'));
    const matchesOriginal = raw ? saved.committedStateSha256 === sha256(raw)
      : saved.source === 'generated-untracked' && saved.committedStateSha256 === null && /^[a-f0-9]{64}$/.test(saved.generatedStateSha256);
    if (saved.version === 1 && matchesOriginal &&
        (!expectedCommit || saved.commit === expectedCommit)) return saved.state as DeploymentState;
  }
  return state;
}

export function captureAndRestoreTrackedDeploymentState(clone: string, commit: string, config: DeployConfig) {
  const committed = gitFile(clone, commit, '.state.json');
  const generatedUntracked = !committed && git(clone, ['status', '--porcelain', '--untracked-files=all', '--', '.state.json']) === '?? .state.json';
  if (!committed && !generatedUntracked) return { restored: false };
  const filename = path.join(clone, '.state.json');
  if (!lstatSync(filename).isFile()) throw new Error('Deployment state must be a regular file; preserved for review.');
  const currentBytes = readFileSync(filename);
  if (committed?.equals(currentBytes)) return { restored: false };
  const attemptFile = path.join(clone, '.git/newsletter-release-attempt.json');
  const attempt = existsSync(attemptFile) ? JSON.parse(readFileSync(attemptFile, 'utf8')) : null;
  if (attempt?.commit !== commit || !['deploying', 'verified'].includes(attempt?.status)) {
    throw new Error('Deployment state changed without this runner’s exact-commit deployment attempt; preserved for review.');
  }
  const before = committed ? JSON.parse(committed.toString()) as DeploymentState : {};
  const current = JSON.parse(currentBytes.toString()) as DeploymentState;
  const beforeOther = { ...before }; const currentOther = { ...current };
  delete beforeOther.deploy; delete currentOther.deploy;
  const live = realpathSync(config.activeLink);
  const activeSlot = (['blue', 'green'] as const).find((name) => path.resolve(config.slots[name].path) === live);
  const deployment = current.deploy;
  // ASAP's reviewed legacy writer omits this metadata field. Do not accept
  // another writer's missing field as an equivalent generated state mutation.
  const writer = gitFile(clone, commit, 'scripts/deploy-blue-green.ts');
  const legacyWriter = writer && sha256(writer) === 'b90eeb00168a763d5eaba8504e2d7232c2dc39b03fbe0f3488859ea5038c808d';
  const expected = {
    mode: 'blue-green', activeSlot, lastCommit: commit, updatedAt: deployment?.updatedAt,
    upstreamConf: config.upstreamConf, activeLink: config.activeLink,
    ...(!legacyWriter || Object.hasOwn(deployment || {}, 'rollbackWindowSeconds')
      ? { rollbackWindowSeconds: Math.round(config.rollbackWindowSeconds ?? 300) } : {}), slots: config.slots
  };
  if (!activeSlot || !deployment || !isDeepStrictEqual(beforeOther, currentOther) ||
      !isDeepStrictEqual(deployment, expected) || typeof deployment.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(deployment.updatedAt)) ||
      !readFileSync(config.upstreamConf, 'utf8').includes(`127.0.0.1:${config.slots[activeSlot].port}`)) {
    throw new Error('Tracked state mutation differs from the exact deployed configuration; preserved for review.');
  }
  writeFileSync(privateStatePath(clone), `${JSON.stringify({ version: 1, commit,
    source: committed ? 'tracked' : 'generated-untracked', committedStateSha256: committed ? sha256(committed) : null,
    generatedStateSha256: sha256(currentBytes), state: current }, null, 2)}\n`, { mode: 0o600 });
  // Only the runner-created clone mutation is restored. Original controller
  // state, including any pre-existing dirty state, is never written here.
  if (!readFileSync(filename).equals(currentBytes)) throw new Error('Deployment state changed during capture; preserved for review.');
  if (committed) writeFileSync(filename, committed);
  else unlinkSync(filename); // Only our verified, deployment-only generated file.
  return { restored: true, capturedUntracked: generatedUntracked, deployment };
}
