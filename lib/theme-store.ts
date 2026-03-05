import path from 'node:path';
import fs from 'node:fs/promises';
import type { ThemeStatePayload } from 'tweakcn-ui';
import { REGISTRY_ROOT } from '@/lib/installer-paths';

export type ThemePayload = ThemeStatePayload;

type ThemePaths = {
  baseDir: string;
  currentPath: string;
  defaultPath: string;
  lastGoodPath: string;
};

// Simple cross-process lock using an atomic lockfile. Prevents concurrent writers
// from corrupting theme artifacts. Fails closed if lock cannot be acquired.
async function withFileLock<T>(lockPath: string, fn: () => Promise<T>) {
  const maxAttempts = 10;
  const delayMs = 50;
  let handle: fs.FileHandle | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      handle = await fs.open(lockPath, 'wx', 0o640);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  if (!handle) {
    throw new Error('Failed to acquire theme store lock');
  }

  try {
    return await fn();
  } finally {
    try {
      await handle.close();
    } catch {}
    try {
      await fs.unlink(lockPath);
    } catch {}
  }
}

function resolveBaseDir() {
  const canonical = process.env.CANONICAL_ORIGIN;
  let fallbackSlug = 'default';
  if (canonical) {
    try {
      fallbackSlug = new URL(canonical).hostname.replace(/[^a-z0-9-]+/gi, '-') || 'default';
    } catch {
      // ignore parse errors
    }
  }
  const slug = process.env.SITE_SLUG || fallbackSlug;
  const root = process.env.VD_THEME_DIR || path.join(process.env.VD_STATE_DIR || REGISTRY_ROOT, 'themes');
  return path.join(root, slug);
}

export function getThemePaths(): ThemePaths {
  const baseDir = resolveBaseDir();
  return {
    baseDir,
    currentPath: path.join(baseDir, 'current.json'),
    defaultPath: path.join(baseDir, 'default.json'),
    lastGoodPath: path.join(baseDir, 'last-good.json')
  };
}

const THEME_FILE_VERSION = 1;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true, mode: 0o750 });
}

async function readThemeFile(filePath: string): Promise<ThemePayload | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as { payload?: ThemePayload } | ThemePayload | null;
    if (!parsed) return null;
    if (typeof parsed === 'object' && parsed && 'payload' in parsed) {
      return (parsed as { payload?: ThemePayload }).payload ?? null;
    }
    return parsed as ThemePayload;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    return null;
  }
}

async function writeThemeFile(filePath: string, payload: ThemePayload) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmpPath = `${filePath}.${Date.now()}.tmp`;
  const lockPath = `${filePath}.lock`;
  const content = JSON.stringify({ version: THEME_FILE_VERSION, payload }, null, 2);

  return withFileLock(lockPath, async () => {
    await fs.writeFile(tmpPath, content, { encoding: 'utf8', mode: 0o640 });
    await fs.rename(tmpPath, filePath);
  });
}

export async function readThemeCurrent() {
  const { currentPath } = getThemePaths();
  return readThemeFile(currentPath);
}

export async function writeThemeCurrent(payload: ThemePayload) {
  const { currentPath } = getThemePaths();
  await writeThemeFile(currentPath, payload);
}

export async function readThemeDefault() {
  const { defaultPath } = getThemePaths();
  return readThemeFile(defaultPath);
}

export async function writeThemeDefault(payload: ThemePayload) {
  const { defaultPath } = getThemePaths();
  await writeThemeFile(defaultPath, payload);
}

export async function readThemeLastGood() {
  const { lastGoodPath } = getThemePaths();
  return readThemeFile(lastGoodPath);
}

export async function writeThemeLastGood(payload: ThemePayload) {
  const { lastGoodPath } = getThemePaths();
  await writeThemeFile(lastGoodPath, payload);
}

export async function readThemeDraft() {
  const { baseDir } = getThemePaths();
  return readThemeFile(path.join(baseDir, 'draft.json'));
}

export async function writeThemeDraft(payload: ThemePayload) {
  const { baseDir } = getThemePaths();
  await writeThemeFile(path.join(baseDir, 'draft.json'), payload);
}
