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

type SystemdServiceInfo = {
  environmentFiles: string[];
  name: string;
  workingDirectory: string;
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

function parseSystemdProperties(stdout: string) {
  const properties: Record<string, string> = {};
  for (const line of stdout.split(/\r?\n/)) {
    const index = line.indexOf('=');
    if (index < 0) continue;
    properties[line.slice(0, index)] = line.slice(index + 1);
  }
  return properties;
}

function parseSystemdEnvironmentFiles(value: string) {
  return value.match(/\/[^\s)]+/g) ?? [];
}

async function listSystemdServiceNames(systemctlBin: string, slug: string) {
  try {
    const result = await execFileAsync(
      systemctlBin,
      ['list-unit-files', `vd-${slug}*.service`, '--type=service', '--no-legend', '--no-pager'],
      { encoding: 'utf8' }
    );

    return (result.stdout || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/)[0] || '')
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function inspectSystemdService(systemctlBin: string, serviceName: string): Promise<SystemdServiceInfo | null> {
  try {
    const result = await execFileAsync(
      systemctlBin,
      ['show', serviceName, '-p', 'Id', '-p', 'WorkingDirectory', '-p', 'EnvironmentFiles'],
      { encoding: 'utf8' }
    );
    const properties = parseSystemdProperties(result.stdout || '');
    return {
      environmentFiles: parseSystemdEnvironmentFiles(properties.EnvironmentFiles || ''),
      name: (properties.Id || serviceName).trim(),
      workingDirectory: (properties.WorkingDirectory || '').trim()
    };
  } catch {
    return null;
  }
}

async function resolveSystemdService(
  systemctlBin: string,
  slug: string,
  siteRoot: string,
  envFile: string,
  explicitServiceName: string
) {
  const serviceNames = explicitServiceName
    ? [explicitServiceName]
    : await listSystemdServiceNames(systemctlBin, slug);

  if (!serviceNames.length) {
    return { candidates: [] as SystemdServiceInfo[], service: null as SystemdServiceInfo | null };
  }

  const candidates = (await Promise.all(serviceNames.map((name) => inspectSystemdService(systemctlBin, name)))).filter(
    (value): value is SystemdServiceInfo => Boolean(value)
  );

  const resolvedSiteRoot = path.resolve(siteRoot);
  const resolvedEnvFile = path.resolve(envFile);

  const service =
    candidates.find((candidate) => candidate.workingDirectory && path.resolve(candidate.workingDirectory) === resolvedSiteRoot) ||
    candidates.find((candidate) => candidate.environmentFiles.some((entry) => path.resolve(entry) === resolvedEnvFile)) ||
    (explicitServiceName ? candidates[0] || null : candidates.length === 1 ? candidates[0] : null);

  return { candidates, service };
}

export async function rebuildSiteAndRestart({ siteRoot, envFile }: RebuildOptions) {
  const fileEnv = await loadEnvFile(envFile);
  const processManager = (fileEnv.VD_PROCESS_MANAGER || process.env.VD_PROCESS_MANAGER || '').trim().toLowerCase();
  const explicitServiceName =
    fileEnv.SYSTEMD_SERVICE_NAME ||
    fileEnv.VD_SLOT_SERVICE ||
    process.env.SYSTEMD_SERVICE_NAME ||
    process.env.VD_SLOT_SERVICE ||
    '';

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

  const systemctlBin = await resolveBinary('systemctl', ['/usr/bin/systemctl', '/bin/systemctl']);
  const bunBin = await resolveBinary('bun', ['/usr/local/bin/bun', '/usr/bin/bun', '/bin/bun']);
  if (!bunBin) {
    throw new Error('bun not found in PATH');
  }

  if (systemctlBin) {
    const { candidates, service } = await resolveSystemdService(systemctlBin, slug, siteRoot, envFile, explicitServiceName);
    const prefersSystemd = processManager !== 'pm2' && (processManager === 'systemd' || Boolean(explicitServiceName) || candidates.length > 0);

    if (prefersSystemd && !service) {
      const candidateNames = candidates.map((candidate) => candidate.name).join(', ');
      const baseMessage = explicitServiceName
        ? `Configured systemd service "${explicitServiceName}" was not found.`
        : candidateNames
          ? `Detected systemd services for slug "${slug}" (${candidateNames}), but none match checkout ${path.resolve(siteRoot)} and env file ${path.resolve(envFile)}.`
          : `Detected systemd runtime for slug "${slug}", but no matching systemd service could be resolved.`;
      return {
        restarted: false,
        message: `${baseMessage} Run the deploy from the matching service checkout or set SYSTEMD_SERVICE_NAME/VD_SLOT_SERVICE for that checkout.`
      };
    }

    if (prefersSystemd && service?.workingDirectory && path.resolve(service.workingDirectory) !== path.resolve(siteRoot)) {
      return {
        restarted: false,
        message: `Systemd service "${service.name}" runs from ${service.workingDirectory}, but this checkout is ${path.resolve(siteRoot)}. Run the deploy from the service checkout instead of this repo clone.`
      };
    }

    if (prefersSystemd && service) {
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

      try {
        await restartSystemdService(systemctlBin, service.name, siteRoot, env);
        return { restarted: true, name: service.name };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'systemd restart failed';
        return { restarted: false, message };
      }
    }
  }

  if (processManager === 'systemd' && !systemctlBin) {
    return { restarted: false, message: 'systemctl not found in PATH; rebuild skipped.' };
  }

  const name =
    fileEnv.PM2_PROCESS_NAME ||
    fileEnv.VD_PM2_NAME ||
    process.env.PM2_PROCESS_NAME ||
    process.env.VD_PM2_NAME ||
    `vd-${slug}`;

  const pm2Bin = await resolveBinary('pm2', ['/usr/local/bin/pm2', '/usr/bin/pm2', '/bin/pm2']);

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
