import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PLATFORM_CHECKER = '/opt/vdplatform/scripts/sync-editor-baseline.ts';

export function verifySauroCore(cwd = process.cwd()) {
  if (!existsSync(PLATFORM_CHECKER)) {
    console.warn('[sauro-core] platform checker unavailable; skipping host parity preflight');
    return;
  }

  const result = spawnSync('bun', [PLATFORM_CHECKER, '--site', cwd, '--check'], {
    cwd,
    env: process.env,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error('Sauro core parity preflight failed. Synchronize the canonical core before continuing.');
  }
}
