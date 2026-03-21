import { copyFile, mkdtemp, mkdir, readFile, readdir, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

type SlotName = 'blue' | 'green';

type SlotConfig = {
  path: string;
  port: number;
  service: string;
  envFile: string;
};

type DeployConfig = {
  controllerPath: string;
  activeLink: string;
  upstreamConf: string;
  publicHealthUrl: string;
  publicAuthSmokeUrl?: string;
  healthPath: string;
  healthHost?: string;
  activeSlot?: SlotName;
  slots: Record<SlotName, SlotConfig>;
};

type Options = {
  envFile: string;
  configPath: string | null;
  branch: string;
  commit: string | null;
  skipInstall: boolean;
};

function parseArgs(argv: string[]): Options {
  let envFile = '.env.production';
  let configPath: string | null = null;
  let branch = 'main';
  let commit: string | null = null;
  let skipInstall = false;

  for (const arg of argv) {
    if (arg.startsWith('--env-file=')) {
      envFile = arg.slice('--env-file='.length).trim() || envFile;
      continue;
    }
    if (arg.startsWith('--config=')) {
      configPath = arg.slice('--config='.length).trim() || null;
      continue;
    }
    if (arg.startsWith('--branch=')) {
      branch = arg.slice('--branch='.length).trim() || branch;
      continue;
    }
    if (arg.startsWith('--commit=')) {
      commit = arg.slice('--commit='.length).trim() || null;
      continue;
    }
    if (arg === '--skip-install') {
      skipInstall = true;
    }
  }

  return { envFile, configPath, branch, commit, skipInstall };
}

function run(command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, {
    cwd,
    env: env ?? process.env,
    stdio: 'inherit'
  });

  if (typeof result.status !== 'number' || result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function readStdout(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    encoding: 'utf8'
  });

  if (typeof result.status !== 'number' || result.status !== 0) {
    throw new Error((result.stderr || result.stdout || '').trim() || `Command failed: ${command}`);
  }

  return (result.stdout || '').trim();
}

async function pathExists(targetPath: string) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseEnv(content: string) {
  const values: Record<string, string> = {};

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
    values[key] = value;
  }

  return values;
}

function serializeEnv(base: string, updates: Record<string, string>) {
  const lines = base ? base.split(/\r?\n/) : [];
  const next = [...lines];

  for (const [key, value] of Object.entries(updates)) {
    const serialized = `${key}="${value.replace(/"/g, '\\"')}"`;
    const index = next.findIndex((line) => line.startsWith(`${key}=`));
    if (index === -1) {
      next.push(serialized);
    } else {
      next[index] = serialized;
    }
  }

  return `${next.filter(Boolean).join('\n')}\n`;
}

async function upsertEnvFile(filePath: string, updates: Record<string, string>) {
  const current = (await pathExists(filePath)) ? await readFile(filePath, 'utf8') : '';
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, serializeEnv(current, updates), 'utf8');
}

async function loadConfig(cwd: string, envFilePath: string, configPath: string | null): Promise<DeployConfig> {
  const defaultConfigPath = path.join(cwd, 'deploy', 'local-first.json');
  const resolvedConfigPath = configPath ? path.resolve(cwd, configPath) : defaultConfigPath;

  if (await pathExists(resolvedConfigPath)) {
    const raw = await readFile(resolvedConfigPath, 'utf8');
    const parsed = JSON.parse(raw) as Omit<DeployConfig, 'controllerPath'> & {
      controllerPath?: string;
      slots: Record<SlotName, Omit<SlotConfig, 'envFile'> & Partial<Pick<SlotConfig, 'envFile'>>>;
    };
    return {
      ...parsed,
      controllerPath: parsed.controllerPath ? path.resolve(cwd, parsed.controllerPath) : cwd,
      slots: {
        blue: {
          ...parsed.slots.blue,
          envFile: parsed.slots.blue.envFile || path.join(parsed.slots.blue.path, '.env.production')
        },
        green: {
          ...parsed.slots.green,
          envFile: parsed.slots.green.envFile || path.join(parsed.slots.green.path, '.env.production')
        }
      }
    };
  }

  const envContent = await readFile(envFilePath, 'utf8');
  const env = parseEnv(envContent);
  if ((env.VD_DEPLOY_MODE || '').trim() !== 'blue-green') {
    throw new Error('VD_DEPLOY_MODE=blue-green is required for blue/green deploys.');
  }

  const healthPath = env.VD_DEPLOY_HEALTH_PATH || '/';
  const publicHealthUrl =
    env.VD_DEPLOY_PUBLIC_HEALTH_URL ||
    `${env.PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || `https://${env.DOMAIN}`}${healthPath}`;
  const publicAuthSmokeUrl = env.VD_DEPLOY_PUBLIC_AUTH_SMOKE_URL || undefined;

  const slot = (name: SlotName): SlotConfig => {
    const upper = name.toUpperCase();
    const slotPath = env[`VD_DEPLOY_${upper}_PATH`];
    const slotPort = Number(env[`VD_DEPLOY_${upper}_PORT`]);
    const slotService = env[`VD_DEPLOY_${upper}_SERVICE`];
    if (!slotPath || !Number.isFinite(slotPort) || !slotService) {
      throw new Error(`Missing blue/green slot metadata for ${name}.`);
    }
    return {
      path: slotPath,
      port: slotPort,
      service: slotService,
      envFile: path.join(slotPath, '.env.production')
    };
  };

  return {
    controllerPath: cwd,
    activeLink: env.VD_DEPLOY_ACTIVE_LINK || path.join(path.dirname(cwd), `${env.SITE_SLUG || 'site'}-current`),
    upstreamConf:
      env.VD_DEPLOY_UPSTREAM_CONF ||
      `/etc/nginx/snippets/${env.SITE_SLUG || 'site'}-active-upstream.conf`,
    publicHealthUrl,
    publicAuthSmokeUrl,
    healthPath,
    healthHost: env.VD_DEPLOY_HEALTH_HOST || undefined,
    activeSlot: env.VD_DEPLOY_ACTIVE_SLOT === 'green' ? 'green' : 'blue',
    slots: {
      blue: slot('blue'),
      green: slot('green')
    }
  };
}

async function resolveActiveSlot(config: DeployConfig) {
  if (await pathExists(config.activeLink)) {
    const currentTarget = await realpath(config.activeLink).catch(() => '');
    if (currentTarget === path.resolve(config.slots.blue.path)) return 'blue' as const;
    if (currentTarget === path.resolve(config.slots.green.path)) return 'green' as const;
  }

  if (await pathExists(config.upstreamConf)) {
    const upstream = await readFile(config.upstreamConf, 'utf8');
    if (upstream.includes(`127.0.0.1:${config.slots.blue.port}`)) return 'blue' as const;
    if (upstream.includes(`127.0.0.1:${config.slots.green.port}`)) return 'green' as const;
  }

  return config.activeSlot || 'blue';
}

async function preserveSlotFiles(slotPath: string, tempPreserveDir: string) {
  const preserved = ['.env.production', '.env.local', '.state.json'];
  for (const relativePath of preserved) {
    const source = path.join(slotPath, relativePath);
    if (!(await pathExists(source))) continue;
    const target = path.join(tempPreserveDir, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

async function restorePreservedFiles(tempPreserveDir: string, slotPath: string) {
  const preserved = ['.env.production', '.env.local', '.state.json'];
  for (const relativePath of preserved) {
    const source = path.join(tempPreserveDir, relativePath);
    if (!(await pathExists(source))) continue;
    const target = path.join(slotPath, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

async function clearDirectoryContents(targetPath: string) {
  await mkdir(targetPath, { recursive: true });
  const entries = await readdir(targetPath);

  for (const entry of entries) {
    await rm(path.join(targetPath, entry), { recursive: true, force: true });
  }
}

async function syncCommitIntoSlot(controllerPath: string, commit: string, slotPath: string) {
  const tempSourceDir = await mkdtemp(path.join(os.tmpdir(), 'vd-blue-green-source-'));
  const tempPreserveDir = await mkdtemp(path.join(os.tmpdir(), 'vd-blue-green-preserve-'));

  try {
    run('bash', ['-lc', `git archive ${commit} | tar -x -C "${tempSourceDir}"`], controllerPath);
    await mkdir(slotPath, { recursive: true });
    await preserveSlotFiles(slotPath, tempPreserveDir);
    await clearDirectoryContents(slotPath);
    run('bash', ['-lc', `cp -a "${tempSourceDir}/." "${slotPath}/"`], controllerPath);
    await restorePreservedFiles(tempPreserveDir, slotPath);
  } finally {
    await rm(tempSourceDir, { recursive: true, force: true });
    await rm(tempPreserveDir, { recursive: true, force: true });
  }
}

function sudoArgs(command: string, args: string[]) {
  return process.getuid?.() === 0 ? [command, ...args] : ['sudo', command, ...args];
}

function runPrivileged(command: string, args: string[], cwd: string) {
  const [cmd, ...rest] = sudoArgs(command, args);
  run(cmd, rest, cwd);
}

async function writeUpstreamConf(config: DeployConfig, slotName: SlotName) {
  const tempFile = path.join(os.tmpdir(), `vd-upstream-${Date.now()}-${slotName}.conf`);
  await writeFile(tempFile, `proxy_pass http://127.0.0.1:${config.slots[slotName].port};\n`, 'utf8');
  runPrivileged('mkdir', ['-p', path.dirname(config.upstreamConf)], config.controllerPath);
  runPrivileged('install', ['-m', '644', tempFile, config.upstreamConf], config.controllerPath);
  await rm(tempFile, { force: true });
}

async function setActiveLink(config: DeployConfig, slotName: SlotName) {
  await mkdir(path.dirname(config.activeLink), { recursive: true });
  const targetPath = path.resolve(config.slots[slotName].path);
  if (process.getuid?.() === 0) {
    await rm(config.activeLink, { force: true });
    await symlink(targetPath, config.activeLink);
    return;
  }

  if (await pathExists(config.activeLink)) {
    await rm(config.activeLink, { force: true });
  }
  await symlink(targetPath, config.activeLink);
}

function verifyLocalHealth(url: string, hostHeader?: string) {
  const args = ['-fsS', '--retry', '10', '--retry-delay', '2', '--retry-connrefused'];
  if (hostHeader) {
    args.push('-H', `Host: ${hostHeader}`);
  }
  args.push(url);
  run('curl', args, process.cwd());
}

function verifyPublicHealth(url: string) {
  run('curl', ['-fsS', '--retry', '10', '--retry-delay', '2', url], process.cwd());
}

function verifyPublicAuthSmoke(url: string) {
  const result = spawnSync(
    'curl',
    [
      '-sS',
      '-X',
      'POST',
      '-H',
      'content-type: application/json',
      '--data',
      '{"email":"deploy-auth-smoke@invalid.local","password":"invalid-password"}',
      '-w',
      '\n%{http_code}',
      url
    ],
    {
      cwd: process.cwd(),
      env: process.env,
      encoding: 'utf8'
    }
  );

  if (typeof result.status !== 'number' || result.status !== 0) {
    throw new Error((result.stderr || result.stdout || '').trim() || `Command failed: curl ${url}`);
  }

  const output = (result.stdout || '').trimEnd();
  const match = output.match(/\n(\d{3})$/);
  if (!match || typeof match.index !== 'number') {
    throw new Error(`[deploy:blue-green] auth smoke did not return an HTTP status for ${url}`);
  }

  const status = Number(match[1]);
  const body = output.slice(0, match.index).trim();
  if (status === 502) {
    throw new Error(`[deploy:blue-green] auth smoke hit 502 for ${url}`);
  }
  if (status !== 400 && status !== 401) {
    throw new Error(`[deploy:blue-green] auth smoke expected 400/401 from ${url}, received ${status}`);
  }
  if (!body.includes('INVALID_EMAIL_OR_PASSWORD')) {
    throw new Error(`[deploy:blue-green] auth smoke received unexpected body from ${url}`);
  }
}

async function updateDeployState(controllerPath: string, config: DeployConfig, activeSlot: SlotName, commit: string) {
  const statePath = path.join(controllerPath, '.state.json');
  const existing = (await pathExists(statePath))
    ? JSON.parse(await readFile(statePath, 'utf8')) as Record<string, unknown>
    : {};
  const next = {
    ...existing,
    deploy: {
      mode: 'blue-green',
      activeSlot,
      lastCommit: commit,
      updatedAt: new Date().toISOString(),
      upstreamConf: config.upstreamConf,
      activeLink: config.activeLink,
      slots: config.slots
    }
  };

  await writeFile(statePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

async function ensureSlotEnv(slot: SlotConfig, controllerEnvFile: string, slotName: SlotName) {
  if (!(await pathExists(slot.envFile)) && (await pathExists(controllerEnvFile))) {
    await mkdir(path.dirname(slot.envFile), { recursive: true });
    await copyFile(controllerEnvFile, slot.envFile);
  }

  await upsertEnvFile(slot.envFile, {
    PORT: String(slot.port),
    VD_PROCESS_MANAGER: 'systemd',
    VD_SLOT_NAME: slotName,
    VD_SLOT_SERVICE: slot.service
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const controllerPath = process.cwd();
  const envFilePath = path.resolve(controllerPath, options.envFile);
  const config = await loadConfig(controllerPath, envFilePath, options.configPath);
  const commit = options.commit || readStdout('git', ['rev-parse', options.branch], controllerPath);
  const activeSlot = await resolveActiveSlot(config);
  const nextSlot: SlotName = activeSlot === 'blue' ? 'green' : 'blue';
  const previousSlot = activeSlot;
  const slot = config.slots[nextSlot];
  const previousLink = (await pathExists(config.activeLink)) ? await realpath(config.activeLink).catch(() => '') : '';
  const previousUpstream = (await pathExists(config.upstreamConf)) ? await readFile(config.upstreamConf, 'utf8') : '';
  const publicHost = config.healthHost || new URL(config.publicHealthUrl).host;

  console.log(`[deploy:blue-green] active=${activeSlot} inactive=${nextSlot} commit=${commit}`);
  await syncCommitIntoSlot(config.controllerPath, commit, slot.path);
  await ensureSlotEnv(slot, envFilePath, nextSlot);

  if (!options.skipInstall) {
    run('bun', ['install', '--frozen-lockfile'], slot.path);
  }
  run('bun', ['run', 'build'], slot.path, { ...process.env, PORT: String(slot.port) });
  runPrivileged('systemctl', ['daemon-reload'], config.controllerPath);
  runPrivileged('systemctl', ['restart', slot.service], config.controllerPath);

  try {
    verifyLocalHealth(`http://127.0.0.1:${slot.port}${config.healthPath}`, publicHost);
    await setActiveLink(config, nextSlot);
    await writeUpstreamConf(config, nextSlot);
    runPrivileged('nginx', ['-t'], config.controllerPath);
    runPrivileged('systemctl', ['reload', 'nginx'], config.controllerPath);
    verifyPublicHealth(config.publicHealthUrl);
    if (config.publicAuthSmokeUrl) {
      verifyPublicAuthSmoke(config.publicAuthSmokeUrl);
    }
  } catch (error) {
    if (previousLink) {
      await rm(config.activeLink, { force: true });
      await symlink(previousLink, config.activeLink);
    }
    if (previousUpstream) {
      const tempFile = path.join(os.tmpdir(), `vd-upstream-rollback-${Date.now()}.conf`);
      await writeFile(tempFile, previousUpstream, 'utf8');
      runPrivileged('install', ['-m', '644', tempFile, config.upstreamConf], config.controllerPath);
      await rm(tempFile, { force: true });
    }
    runPrivileged('nginx', ['-t'], config.controllerPath);
    runPrivileged('systemctl', ['reload', 'nginx'], config.controllerPath);
    throw error;
  }

  await updateDeployState(config.controllerPath, config, nextSlot, commit);
  console.log(`[deploy:blue-green] switched public traffic to ${nextSlot}`);
  console.log(`[deploy:blue-green] previous slot ${previousSlot} remains available for rollback`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
