import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { gitFile, sha256 } from './newsletter-release-review';
import type { DeployConfig } from './newsletter-release-runtime';

const privateStatePath = (clone: string) => path.join(clone, '.git/newsletter-deployment-state.json');
type DeploymentState = { deploy?: Record<string, unknown>; [key: string]: unknown };

export function readDeploymentState(clone: string, expectedCommit?: string): DeploymentState | null {
  const stateFile = path.join(clone, '.state.json');
  const raw = existsSync(stateFile) ? readFileSync(stateFile) : null;
  const state = raw ? JSON.parse(raw.toString()) as DeploymentState : null;
  if (expectedCommit && state?.deploy?.lastCommit === expectedCommit) return state;
  const savedFile = privateStatePath(clone);
  if (raw && existsSync(savedFile)) {
    const saved = JSON.parse(readFileSync(savedFile, 'utf8'));
    if (saved.version === 1 && saved.committedStateSha256 === sha256(raw) &&
        (!expectedCommit || saved.commit === expectedCommit)) return saved.state as DeploymentState;
  }
  return state;
}

export function captureAndRestoreTrackedDeploymentState(clone: string, commit: string, config: DeployConfig) {
  const committed = gitFile(clone, commit, '.state.json');
  if (!committed) return { restored: false };
  const filename = path.join(clone, '.state.json');
  const currentBytes = readFileSync(filename);
  if (committed.equals(currentBytes)) return { restored: false };
  const attemptFile = path.join(clone, '.git/newsletter-release-attempt.json');
  if (!existsSync(attemptFile) || JSON.parse(readFileSync(attemptFile, 'utf8')).commit !== commit) {
    throw new Error('Tracked deployment state changed without this runner’s exact-commit attempt; preserved for review.');
  }
  const before = JSON.parse(committed.toString()) as DeploymentState;
  const current = JSON.parse(currentBytes.toString()) as DeploymentState;
  const beforeOther = { ...before }; const currentOther = { ...current };
  delete beforeOther.deploy; delete currentOther.deploy;
  const live = realpathSync(config.activeLink);
  const activeSlot = (['blue', 'green'] as const).find((name) => path.resolve(config.slots[name].path) === live);
  const deployment = current.deploy;
  const expected = {
    mode: 'blue-green', activeSlot, lastCommit: commit, updatedAt: deployment?.updatedAt,
    upstreamConf: config.upstreamConf, activeLink: config.activeLink,
    rollbackWindowSeconds: Math.round(config.rollbackWindowSeconds ?? 300), slots: config.slots
  };
  if (!activeSlot || !deployment || !isDeepStrictEqual(beforeOther, currentOther) ||
      !isDeepStrictEqual(deployment, expected) || typeof deployment.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(deployment.updatedAt)) ||
      !readFileSync(config.upstreamConf, 'utf8').includes(`127.0.0.1:${config.slots[activeSlot].port}`)) {
    throw new Error('Tracked state mutation differs from the exact deployed configuration; preserved for review.');
  }
  writeFileSync(privateStatePath(clone), `${JSON.stringify({ version: 1, commit, committedStateSha256: sha256(committed), state: current }, null, 2)}\n`, { mode: 0o600 });
  // Only the runner-created clone mutation is restored. Original controller
  // state, including any pre-existing dirty state, is never written here.
  writeFileSync(filename, committed);
  return { restored: true, deployment };
}
