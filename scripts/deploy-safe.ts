import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execFileAsync = promisify(execFile);

type EnvMap = Record<string, string>;

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

async function main() {
  const passthroughArgs = process.argv.slice(2);
  const envFileArg = passthroughArgs.find((arg) => arg.startsWith('--env-file=')) || '';
  const envFile = envFileArg ? envFileArg.slice('--env-file='.length).trim() || DEFAULT_ENV_FILE : DEFAULT_ENV_FILE;
  const envFilePath = path.resolve(process.cwd(), envFile);
  const fileEnv = await loadEnvFile(envFilePath);
  const configPath = path.resolve(process.cwd(), 'deploy', 'local-first.json');
  const hasConfig = await fs
    .access(configPath)
    .then(() => true)
    .catch(() => false);

  if ((fileEnv.VD_DEPLOY_MODE || '').trim() === 'blue-green' || hasConfig) {
    const bunBin = await resolveBinary('bun', ['/usr/local/bin/bun', '/usr/bin/bun', '/bin/bun']);
    const args = ['run', 'deploy:blue-green', '--'];
    if (hasConfig && !passthroughArgs.some((arg) => arg.startsWith('--config='))) {
      args.push(`--config=${path.relative(process.cwd(), configPath)}`);
    }
    args.push(...passthroughArgs);
    await execFileAsync(bunBin, args, { cwd: process.cwd(), env: process.env });
    return;
  }

  const env = {
    ...process.env,
    ...fileEnv,
    PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`
  };

  const bunBin = await resolveBinary('bun', ['/usr/local/bin/bun', '/usr/bin/bun', '/bin/bun']);
  await execFileAsync(bunBin, ['run', 'build'], { env, cwd: process.cwd() });
  await execFileAsync(bunBin, ['run', 'pm2:sync-env'], { env, cwd: process.cwd() });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
