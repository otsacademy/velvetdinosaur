import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PLATFORM_ROOT } from '@/lib/installer-paths';

export type EditorSyncDiff = {
  added: string[];
  changed: string[];
  unchanged: string[];
  removed: string[];
  denied: string[];
  orphaned: string[];
};

export type EditorSyncManifest = {
  version: number;
  source: string;
  allow: string[];
  deny: string[];
};

function normalizePath(p: string) {
  return p.replace(/\\/g, '/').replace(/\/$/, '');
}

function globToRegExp(glob: string) {
  const escaped = glob
    .replace(/\\/g, '/')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '<<<TWOSTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<TWOSTAR>>>/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export function matchesAny(patterns: string[], value: string) {
  const normalized = normalizePath(value);
  return patterns.some((pattern) => globToRegExp(normalizePath(pattern)).test(normalized));
}

export function readEditorSyncManifest(): EditorSyncManifest {
  const manifestPath = path.join(PLATFORM_ROOT, 'sync', 'editor-baseline.json');
  if (!existsSync(manifestPath)) {
    throw new Error('Editor sync manifest not found.');
  }
  const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as EditorSyncManifest;
  if (!raw || typeof raw !== 'object') {
    throw new Error('Editor sync manifest invalid.');
  }
  return raw;
}

export function resolveSitePath(site: string) {
  const resolved = path.isAbsolute(site) ? site : path.join(PLATFORM_ROOT, site);
  if (existsSync(resolved)) {
    return { root: resolved, slug: path.basename(resolved) };
  }
  const appPath = path.join(PLATFORM_ROOT, 'src', 'apps', site);
  if (existsSync(appPath)) {
    return { root: appPath, slug: site };
  }
  throw new Error(`Site not found: ${site}`);
}

export function runEditorSyncDryRun(site: string): EditorSyncDiff {
  const result = spawnSync(
    'bun',
    ['scripts/sync-editor-baseline.ts', '--site', site, '--dry-run', '--json'],
    { cwd: PLATFORM_ROOT, encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'Editor sync dry-run failed.');
  }
  const stdout = result.stdout?.trim();
  if (!stdout) {
    throw new Error('Editor sync dry-run produced no output.');
  }
  try {
    const parsed = JSON.parse(stdout) as EditorSyncDiff;
    return parsed;
  } catch (error) {
    throw new Error('Failed to parse editor sync dry-run output.');
  }
}

export function diffTouchesDenied(diff: EditorSyncDiff, deny: string[]) {
  const allTouched = [
    ...diff.added,
    ...diff.changed,
    ...diff.removed,
    ...diff.denied
  ];
  return allTouched.filter((entry) => matchesAny(deny, entry));
}
