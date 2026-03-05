import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import os from 'os';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type EnvMap = Record<string, string>;
type Pm2Process = {
  name?: string;
  pm2_env?: {
    env?: EnvMap;
    status?: string;
  };
};

const DEFAULT_ENV_FILE = '.env.production';

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

async function loadEnvFile(envFile: string): Promise<EnvMap> {
  const content = await fs.readFile(envFile, 'utf8');
  return parseEnv(content);
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

function summarize(val?: string) {
  if (!val) return 'missing';
  return `set(${String(val).length})`;
}

function diffEnv(pm2Env: EnvMap, fileEnv: EnvMap) {
  const keys = Object.keys(fileEnv);
  const compare = Object.fromEntries(
    keys.map((key) => {
      const a = pm2Env[key] ?? null;
      const b = fileEnv[key] ?? null;
      return [key, a === b ? 'match' : a && b ? 'diff' : 'missing'];
    })
  );
  const mismatches = keys.filter((key) => compare[key] !== 'match');
  return { keys, compare, mismatches };
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const forceRestart = args.includes('--restart') || args.includes('--force-restart');
  const envFileArg = args.find((arg) => arg.startsWith('--env-file='));
  const nameArg = args.find((arg) => arg.startsWith('--name='));
  const envFile = envFileArg ? envFileArg.split('=')[1] : DEFAULT_ENV_FILE;
  const envFilePath = path.resolve(process.cwd(), envFile);

  const fileEnv = await loadEnvFile(envFilePath);
  const slug = fileEnv.SITE_SLUG || process.env.SITE_SLUG;
  const envProcName =
    fileEnv.PM2_PROCESS_NAME ||
    fileEnv.VD_PM2_NAME ||
    process.env.PM2_PROCESS_NAME ||
    process.env.VD_PM2_NAME;
  const cliProcName = nameArg ? nameArg.split('=')[1] : '';
  const procName = cliProcName || envProcName || (slug ? `vd-${slug}` : 'vd-ra');

  const pm2Bin = await resolveBinary('pm2', ['/usr/local/bin/pm2', '/usr/bin/pm2', '/bin/pm2']);
  const listRaw = await execFileAsync(pm2Bin, ['jlist'], { encoding: 'utf8' });
  const list = JSON.parse(listRaw.stdout || '[]') as Pm2Process[];
  const proc = list.find((item) => item.name === procName);
  if (!proc) {
    throw new Error(`pm2 process not found: ${procName}`);
  }

  const pm2Env = proc?.pm2_env?.env ?? {};
  const pm2Status = String(proc?.pm2_env?.status || '').toLowerCase();
  const { compare, mismatches } = diffEnv(pm2Env, fileEnv);

  if (mismatches.length === 0) {
    console.log(`[pm2-sync] ${procName} env is already in sync with ${envFile}`);
    if (!checkOnly && (forceRestart || (pm2Status && pm2Status !== 'online'))) {
      const env = {
        ...process.env,
        ...fileEnv,
        PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`,
        PM2_HOME: process.env.PM2_HOME || path.join(os.homedir(), '.pm2')
      };
      await execFileAsync(pm2Bin, ['restart', procName, '--update-env'], { env });
      console.log(
        forceRestart
          ? `[pm2-sync] ${procName} restarted (requested)`
          : `[pm2-sync] ${procName} was ${pm2Status}; restarted to ensure it is running`
      );
    }
    return;
  }

  const summary = Object.fromEntries(
    mismatches.map((key) => [key, `pm2=${summarize(pm2Env[key])}, file=${summarize(fileEnv[key])}`])
  );

  if (checkOnly) {
    console.error(`[pm2-sync] ${procName} env mismatch vs ${envFile}`);
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  const env = {
    ...process.env,
    ...fileEnv,
    PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`,
    PM2_HOME: process.env.PM2_HOME || path.join(os.homedir(), '.pm2')
  };

  await execFileAsync(pm2Bin, ['restart', procName, '--update-env'], { env });

  const nextRaw = await execFileAsync(pm2Bin, ['jlist'], { encoding: 'utf8' });
  const nextList = JSON.parse(nextRaw.stdout || '[]') as Pm2Process[];
  const nextProc = nextList.find((item) => item.name === procName);
  const nextEnv = nextProc?.pm2_env?.env ?? {};
  const nextDiff = diffEnv(nextEnv, fileEnv);

  if (nextDiff.mismatches.length === 0) {
    console.log(`[pm2-sync] ${procName} env synced with ${envFile}`);
    return;
  }

  const nextSummary = Object.fromEntries(
    nextDiff.mismatches.map((key) => [key, `pm2=${summarize(nextEnv[key])}, file=${summarize(fileEnv[key])}`])
  );
  console.error(`[pm2-sync] ${procName} env still mismatched after restart`);
  console.error(JSON.stringify(nextSummary, null, 2));
  process.exit(2);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});
