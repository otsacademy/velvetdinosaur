import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type EnvMap = Record<string, string>;

type RebuildOptions = {
  siteRoot: string;
  envFile: string;
};

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
  try {
    const content = await fs.readFile(envFile, 'utf8');
    return parseEnv(content);
  } catch {
    return {};
  }
}

async function readEnvValue(envFile: string, key: string) {
  try {
    const content = await fs.readFile(envFile, 'utf8');
    const line = content
      .split('\n')
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${key}=`));
    if (!line) return '';
    const raw = line.slice(key.length + 1);
    return raw.replace(/^\"|\"$/g, '').replace(/^'|'$/g, '');
  } catch {
    return '';
  }
}

async function resolveBinary(name: string, candidates: string[]) {
  const envPath = process.env.PATH || '';
  const pathEntries = envPath.split(':').filter(Boolean);
  const searchPaths = [...new Set([...pathEntries, ...candidates.map((entry) => path.dirname(entry))])];

  for (const dir of searchPaths) {
    const fullPath = path.join(dir, name);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      continue;
    }
  }
  return '';
}

async function restartSystemdService(systemctlBin: string, serviceName: string, siteRoot: string, env: NodeJS.ProcessEnv) {
  try {
    await execFileAsync(systemctlBin, ['restart', serviceName], { cwd: siteRoot, env });
    return;
  } catch {
    if (typeof process.getuid === 'function' && process.getuid() !== 0) {
      await execFileAsync('sudo', [systemctlBin, 'restart', serviceName], { cwd: siteRoot, env });
      return;
    }
    throw new Error('systemd restart failed');
  }
}

export async function rebuildSiteAndRestart({ siteRoot, envFile }: RebuildOptions) {
  const fileEnv = await loadEnvFile(envFile);
  const env = {
    ...process.env,
    ...fileEnv,
    PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`,
    PM2_HOME: process.env.PM2_HOME || '/root/.pm2'
  };

  const slug = fileEnv.SITE_SLUG || process.env.SITE_SLUG || (await readEnvValue(envFile, 'SITE_SLUG'));
  if (!slug) {
    return { restarted: false, message: 'SITE_SLUG not set; rebuild skipped.' };
  }

  const name =
    fileEnv.PM2_PROCESS_NAME ||
    fileEnv.VD_PM2_NAME ||
    process.env.PM2_PROCESS_NAME ||
    process.env.VD_PM2_NAME ||
    `vd-${slug}`;

  const pm2Bin = await resolveBinary('pm2', ['/usr/local/bin/pm2', '/usr/bin/pm2', '/bin/pm2']);
  const systemctlBin = await resolveBinary('systemctl', ['/usr/bin/systemctl', '/bin/systemctl']);
  const bunBin = await resolveBinary('bun', ['/usr/local/bin/bun', '/usr/bin/bun', '/bin/bun']);
  if (!bunBin) {
    throw new Error('bun not found in PATH');
  }

  if ((fileEnv.VD_PROCESS_MANAGER || '').trim() === 'systemd') {
    const serviceName = fileEnv.VD_SLOT_SERVICE || fileEnv.SYSTEMD_SERVICE_NAME || process.env.VD_SLOT_SERVICE;
    if (!serviceName) {
      return { restarted: false, message: 'VD_SLOT_SERVICE not set; rebuild skipped.' };
    }

    try {
      await execFileAsync(bunBin, ['run', 'build'], { cwd: siteRoot, env });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'build failed';
      return { restarted: false, message };
    }

    try {
      await fs.access(path.join(siteRoot, '.next', 'BUILD_ID'));
    } catch {
      return { restarted: false, message: 'Build did not produce .next/BUILD_ID; restart skipped.' };
    }

    if (!systemctlBin) {
      return { restarted: false, message: 'systemctl not found in PATH; rebuild completed but restart skipped.' };
    }

    try {
      await restartSystemdService(systemctlBin, serviceName, siteRoot, env);
      return { restarted: true, name: serviceName };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'systemd restart failed';
      return { restarted: false, message };
    }
  }

  let stoppedForBuild = false;
  if (pm2Bin) {
    try {
      const listRaw = await execFileAsync(pm2Bin, ['jlist'], { encoding: 'utf8' });
      const list = JSON.parse(listRaw.stdout || '[]') as Array<{
        name?: string;
        pm2_env?: { status?: string };
      }>;
      const proc = list.find((item) => item.name === name);
      const status = String(proc?.pm2_env?.status || '').toLowerCase();
      if (status === 'online') {
        await execFileAsync(pm2Bin, ['stop', name], { cwd: siteRoot, env });
        stoppedForBuild = true;
      }
    } catch {
      // continue
    }
  }

  try {
    await execFileAsync(bunBin, ['run', 'build'], { cwd: siteRoot, env });
  } catch (error) {
    if (stoppedForBuild && pm2Bin) {
      try {
        await execFileAsync(pm2Bin, ['restart', name, '--update-env'], { cwd: siteRoot, env });
      } catch {
        // ignore
      }
    }
    const message = error instanceof Error ? error.message : 'build failed';
    return { restarted: false, message };
  }

  try {
    await fs.access(path.join(siteRoot, '.next', 'BUILD_ID'));
  } catch {
    return { restarted: false, message: 'Build did not produce .next/BUILD_ID; restart skipped.' };
  }

  if (!pm2Bin) {
    return { restarted: false, message: 'pm2 not found in PATH; rebuild completed but restart skipped.' };
  }

  try {
    await execFileAsync(pm2Bin, ['restart', name, '--update-env'], { cwd: siteRoot, env });
    return { restarted: true, name };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'pm2 restart failed';
    return { restarted: false, message };
  }
}
