import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execFileAsync = promisify(execFile);

type EnvMap = Record<string, string>;

const DEFAULT_ENV_FILE = '.env.production';
const LIVE_DIST_DIR = '.next';

function parseEnv(content: string): EnvMap {
  const map: EnvMap = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2] ?? '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

async function loadEnvFile(envFile: string) {
  try {
    const content = await fs.readFile(envFile, 'utf8');
    return parseEnv(content);
  } catch {
    return {};
  }
}

async function resolveBinary(name: string, candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  return name;
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function tsTag() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

async function runBun(bunBin: string, args: string[], env: NodeJS.ProcessEnv) {
  await execFileAsync(bunBin, args, { env, cwd: process.cwd() });
}

async function restartPm2App(bunBin: string, env: NodeJS.ProcessEnv) {
  const restartEnv = { ...env };
  delete restartEnv.NEXT_DIST_DIR;
  await runBun(bunBin, ['run', 'pm2:sync-env', '--', '--restart'], restartEnv);
}

async function main() {
  const envFilePath = path.resolve(process.cwd(), DEFAULT_ENV_FILE);
  const fileEnv = await loadEnvFile(envFilePath);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...fileEnv,
    PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`
  };

  const bunBin = await resolveBinary('bun', ['/usr/local/bin/bun', '/usr/bin/bun', '/bin/bun']);
  const cwd = process.cwd();
  const stamp = tsTag();
  const releaseDistDir = `${LIVE_DIST_DIR}.release-${stamp}`;
  const backupDistDir = `${LIVE_DIST_DIR}.backup-${stamp}`;
  const failedDistDir = `${LIVE_DIST_DIR}.failed-${stamp}`;
  const liveDistPath = path.join(cwd, LIVE_DIST_DIR);
  const releaseDistPath = path.join(cwd, releaseDistDir);
  const backupDistPath = path.join(cwd, backupDistDir);
  const failedDistPath = path.join(cwd, failedDistDir);

  await fs.rm(releaseDistPath, { recursive: true, force: true });
  await fs.rm(backupDistPath, { recursive: true, force: true });
  await fs.rm(failedDistPath, { recursive: true, force: true });

  const buildEnv = { ...env, NEXT_DIST_DIR: releaseDistDir };
  console.log(`[deploy-safe] building release dist at ${releaseDistDir}`);
  await runBun(bunBin, ['run', 'build'], buildEnv);

  const buildIdPath = path.join(releaseDistPath, 'BUILD_ID');
  if (!(await exists(buildIdPath))) {
    throw new Error(`release build missing BUILD_ID: ${buildIdPath}`);
  }

  const hadLiveDist = await exists(liveDistPath);
  if (hadLiveDist) {
    await fs.rename(liveDistPath, backupDistPath);
  }

  try {
    await fs.rename(releaseDistPath, liveDistPath);
  } catch (error) {
    if (hadLiveDist && (await exists(backupDistPath))) {
      await fs.rename(backupDistPath, liveDistPath);
    }
    throw error;
  }

  try {
    console.log('[deploy-safe] restarting pm2 process with synced env');
    await restartPm2App(bunBin, env);
    await fs.rm(backupDistPath, { recursive: true, force: true });
    console.log('[deploy-safe] deploy completed');
  } catch (error) {
    console.error('[deploy-safe] restart failed, attempting rollback');
    if (await exists(liveDistPath)) {
      await fs.rename(liveDistPath, failedDistPath);
    }
    if (hadLiveDist && (await exists(backupDistPath))) {
      await fs.rename(backupDistPath, liveDistPath);
      try {
        await restartPm2App(bunBin, env);
      } catch (rollbackError) {
        console.error('[deploy-safe] rollback restart failed');
        throw rollbackError;
      }
    }
    throw error;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
