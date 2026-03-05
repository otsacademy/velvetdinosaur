import path from 'node:path';
import { existsSync } from 'node:fs';

function resolvePlatformRoot() {
  const envRoot = process.env.VD_PLATFORM_ROOT || process.env.VD_ROOT;
  if (envRoot) return envRoot;
  const envInstaller = process.env.VD_INSTALLER_ROOT;
  if (envInstaller) {
    return envInstaller.replace(/\/installer\/?$/, '');
  }
  const cwd = process.cwd();
  const candidates = [
    cwd,
    path.resolve(cwd, '..'),
    path.resolve(cwd, '..', '..'),
    path.resolve(cwd, '..', '..', '..'),
    path.resolve(cwd, '..', '..', '..', '..')
  ];
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'installer', 'install.sh'))) {
      return candidate;
    }
  }
  return cwd;
}

export const PLATFORM_ROOT = resolvePlatformRoot();
export const INSTALLER_ROOT =
  process.env.VD_INSTALLER_ROOT || path.join(PLATFORM_ROOT, 'installer');

export const REGISTRY_ROOT = process.env.VD_STATE_DIR || '/var/lib/vd-platform';
export const REGISTRY_FILE =
  process.env.VD_REGISTRY_FILE || path.join(REGISTRY_ROOT, 'registry.json');
export const LEGACY_REGISTRY_FILE = path.join(PLATFORM_ROOT, 'registry.json');
export const SITES_ROOT = process.env.VD_SITES_DIR || '/srv/apps';

export const JOBS_ROOT = path.join(INSTALLER_ROOT, 'jobs');
export const JOBS_QUEUED = path.join(JOBS_ROOT, 'queued');
export const JOBS_RUNNING = path.join(JOBS_ROOT, 'running');
export const JOBS_DONE = path.join(JOBS_ROOT, 'done');
export const JOBS_LOGS = path.join(INSTALLER_ROOT, 'logs');
