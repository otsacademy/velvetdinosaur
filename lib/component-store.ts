import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { rebuildSiteAndRestart } from '@/lib/component-store-runtime';

export type StoreBlock = {
  id: string;
  name: string;
  key?: string;
  version: string;
  description?: string;
  path?: string;
  preview?: string;
};

export type StoreIndex = {
  version?: string;
  blocks: StoreBlock[];
};

export type InstalledBlock = {
  id: string;
  name: string;
  key: string;
  version: string;
  installedAt: string;
};

export type StoreItem = {
  id: string;
  name: string;
  key?: string;
  version: string;
  description?: string;
  path?: string;
  preview?: string;
  tags: string[];
  categories: string[];
  type: 'block' | 'primitive';
  status?: 'ready' | 'beta' | 'experimental';
  source?: string;
};

type StoreIndexPayload = {
  version?: string;
  items?: StoreItem[];
  store?: {
    version?: string;
    blocks?: StoreBlock[];
  };
};

type StorePackageFile = {
  path: string;
  content: string;
};

type StorePackagePayload = {
  mode?: 'package';
  id?: string;
  name?: string;
  key?: string;
  version?: string;
  description?: string;
  path?: string;
  preview?: string;
  block?: StoreBlock;
  files?: StorePackageFile[];
};

function resolvePlatformRoot() {
  const envRoot = process.env.VD_PLATFORM_ROOT || process.env.VD_ROOT;
  if (envRoot) return envRoot;

  const hardcodedRoot = '/opt/vdplatform';
  if (existsSync(path.join(hardcodedRoot, 'component-store'))) {
    return hardcodedRoot;
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
    if (existsSync(path.join(candidate, 'component-store'))) {
      return candidate;
    }
  }
  return cwd;
}

const DEFAULT_STORE_PATH =
  process.env.VD_COMPONENT_STORE_PATH ||
  process.env.COMPONENT_STORE_PATH ||
  path.join(resolvePlatformRoot(), 'component-store');

const DEFAULT_STORE_API_URL =
  process.env.VD_STORE_API_URL ||
  process.env.VD_COMPONENT_STORE_API_URL ||
  process.env.COMPONENT_STORE_API_URL ||
  '';

const STORE_API_KEY = process.env.VD_STORE_API_KEY || '';

const SITE_ROOT = process.cwd();
const STORE_DEST = path.join(SITE_ROOT, 'components', 'blocks', 'store');
const INSTALLED_FILE = path.join(STORE_DEST, 'installed.json');
const GENERATED_INDEX_FILE = path.join(
  STORE_DEST,
  process.env.VD_COMPONENT_STORE_GENERATED_FILE || 'generated.ts'
);
const ENV_FILE = path.join(SITE_ROOT, '.env.production');

type LocalStoreMeta = {
  id?: string;
  name?: string;
  description?: string;
  tags?: string[];
  categories?: string[];
  type?: 'block' | 'primitive';
  status?: 'ready' | 'beta' | 'experimental';
  source?: string;
  preview?: string;
};

function toPascalCase(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('');
}

function blockKey(block: StoreBlock) {
  if (block.key) return block.key;
  if (block.name) return toPascalCase(block.name);
  return toPascalCase(block.id);
}

function normalizeItemType(value?: string): 'block' | 'primitive' {
  return value === 'primitive' ? 'primitive' : 'block';
}

function ensureStoreApiUrl() {
  return DEFAULT_STORE_API_URL.trim().replace(/\/$/, '');
}

function sanitizeRelativePath(input: string) {
  const normalized = input.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..')) {
    throw new Error(`Invalid file path in store package: ${input}`);
  }
  return normalized;
}

function normalizeBlockFromPackage(id: string, payload: StorePackagePayload): StoreBlock {
  const fromBlock = payload.block;
  return {
    id: payload.id || fromBlock?.id || id,
    name: payload.name || fromBlock?.name || id,
    key: payload.key || fromBlock?.key,
    version: payload.version || fromBlock?.version || '0.0.0',
    description: payload.description || fromBlock?.description,
    path: payload.path || fromBlock?.path,
    preview: payload.preview || fromBlock?.preview
  };
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readLocalMeta(metaPath: string): Promise<LocalStoreMeta | null> {
  try {
    const raw = await fs.readFile(metaPath, 'utf8');
    return JSON.parse(raw) as LocalStoreMeta;
  } catch {
    return null;
  }
}

async function readLocalStoreItems(storePath = DEFAULT_STORE_PATH): Promise<StoreItem[]> {
  const indexPath = path.join(storePath, 'index.json');
  const index = await readJsonFile<StoreIndex>(indexPath, { blocks: [] });
  if (!Array.isArray(index.blocks)) return [];

  const items = await Promise.all(
    index.blocks.map(async (block) => {
      const blockPath = block.path || path.join('blocks', block.id);
      const metaPath = path.join(storePath, blockPath, 'meta.json');
      const meta = await readLocalMeta(metaPath);
      return {
        id: block.id,
        name: meta?.name || block.name,
        key: block.key,
        version: block.version,
        description: meta?.description || block.description,
        path: block.path,
        preview: meta?.preview || block.preview,
        tags: meta?.tags || [],
        categories: meta?.categories || [],
        type: normalizeItemType(meta?.type),
        status: meta?.status,
        source: meta?.source
      } as StoreItem;
    })
  );

  return items;
}

async function fetchStoreJson<T>(apiPath: string): Promise<T | null> {
  const base = ensureStoreApiUrl();
  if (!base) return null;

  try {
    const url = new URL(apiPath, `${base}/`).toString();
    const headers = new Headers();
    headers.set('accept', 'application/json');
    if (STORE_API_KEY) {
      headers.set('x-vd-store-key', STORE_API_KEY);
    }
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function readRemoteStoreIndexPayload(): Promise<StoreIndexPayload | null> {
  return fetchStoreJson<StoreIndexPayload>('/api/store/index');
}

async function readRemoteStorePackage(id: string): Promise<StorePackagePayload | null> {
  return fetchStoreJson<StorePackagePayload>(`/api/store/block/${encodeURIComponent(id)}`);
}

async function writePackageFiles(destPath: string, files: StorePackageFile[]) {
  await fs.rm(destPath, { recursive: true, force: true });
  await fs.mkdir(destPath, { recursive: true });

  for (const file of files) {
    const relPath = sanitizeRelativePath(file.path);
    const absolutePath = path.join(destPath, relPath);
    const normalizedDest = path.normalize(destPath + path.sep);
    const normalizedPath = path.normalize(absolutePath);

    if (!normalizedPath.startsWith(normalizedDest)) {
      throw new Error(`Invalid package path escape: ${file.path}`);
    }

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.content, 'utf8');
  }
}

async function installFromRemotePackage(id: string, payload: StorePackagePayload) {
  const files = Array.isArray(payload.files) ? payload.files : [];
  if (files.length === 0) {
    throw new Error(`Remote store package for ${id} contained no files.`);
  }

  const block = normalizeBlockFromPackage(id, payload);
  const destPath = path.join(STORE_DEST, block.id);
  await writePackageFiles(destPath, files);

  const renderPath = path.join(destPath, 'render.tsx');
  const schemaPath = path.join(destPath, 'schema.ts');
  await fs.access(renderPath);
  await fs.access(schemaPath);

  return block;
}

async function installFromLocalStore(id: string, storePath: string) {
  const indexPath = path.join(storePath, 'index.json');
  const index = await readJsonFile<StoreIndex>(indexPath, { blocks: [] });
  const block = index.blocks.find((entry) => entry.id === id);
  if (!block) {
    throw new Error(`Block not found in store: ${id}`);
  }

  const sourcePath = path.join(storePath, block.path || path.join('blocks', block.id));
  const renderPath = path.join(sourcePath, 'render.tsx');
  const schemaPath = path.join(sourcePath, 'schema.ts');

  await fs.access(renderPath);
  await fs.access(schemaPath);

  await fs.mkdir(STORE_DEST, { recursive: true });
  const destPath = path.join(STORE_DEST, block.id);
  await fs.rm(destPath, { recursive: true, force: true });
  await fs.cp(sourcePath, destPath, { recursive: true });

  return block;
}

export function getStorePath() {
  return DEFAULT_STORE_PATH;
}

export function getStoreApiUrl() {
  return ensureStoreApiUrl();
}

export async function readStoreItems(): Promise<StoreItem[]> {
  const remote = await readRemoteStoreIndexPayload();

  if (remote && Array.isArray(remote.items)) {
    return remote.items.map((item) => ({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags : [],
      categories: Array.isArray(item.categories) ? item.categories : [],
      type: normalizeItemType(item.type)
    }));
  }

  if (remote?.store && Array.isArray(remote.store.blocks)) {
    return remote.store.blocks.map((block) => ({
      id: block.id,
      name: block.name,
      key: block.key,
      version: block.version,
      description: block.description,
      path: block.path,
      preview: block.preview,
      tags: [],
      categories: [],
      type: 'block'
    }));
  }

  return readLocalStoreItems();
}

export async function readStoreIndex(storePath = DEFAULT_STORE_PATH): Promise<StoreIndex> {
  const remote = await readRemoteStoreIndexPayload();

  if (remote && Array.isArray(remote.items)) {
    return {
      version: remote.version,
      blocks: remote.items.map((item) => ({
        id: item.id,
        name: item.name,
        key: item.key,
        version: item.version,
        description: item.description,
        path: item.path,
        preview: item.preview
      }))
    };
  }

  if (remote?.store && Array.isArray(remote.store.blocks)) {
    return {
      version: remote.store.version,
      blocks: remote.store.blocks
    };
  }

  const indexPath = path.join(storePath, 'index.json');
  const index = await readJsonFile<StoreIndex>(indexPath, { blocks: [] });
  if (!Array.isArray(index.blocks)) {
    return { blocks: [] };
  }
  return index;
}

export async function readInstalledBlocks(): Promise<InstalledBlock[]> {
  return readJsonFile<InstalledBlock[]>(INSTALLED_FILE, []);
}

async function writeInstalledBlocks(installed: InstalledBlock[]) {
  await fs.mkdir(STORE_DEST, { recursive: true });
  await fs.writeFile(INSTALLED_FILE, JSON.stringify(installed, null, 2));
}

function renderIndexSource(installed: InstalledBlock[]) {
  const imports: string[] = ["import type { ComponentConfig } from '@measured/puck';", "import { createElement } from 'react';"];
  const entries: string[] = [];

  installed.forEach((block, idx) => {
    const importName = `Block${idx}`;
    const schemaName = `schema${idx}`;
    imports.push(`import ${importName} from './${block.id}/render';`);
    imports.push(`import { schema as ${schemaName} } from './${block.id}/schema';`);
    entries.push(
      `  ${JSON.stringify(block.key)}: { ...${schemaName}, render: ({ puck, ...props }: any) => createElement(${importName} as any, props as any) },`
    );
  });

  const body = [
    '',
    '// This file is overwritten by the component-store installer (see `lib/component-store.ts`).',
    '// It only contains blocks installed from the central store service.',
    'export const storeBlocksGenerated: Record<string, ComponentConfig> = {',
    ...entries,
    '};',
    ''
  ].join('\n');

  return `${imports.join('\n')}${body}`;
}

async function writeGeneratedIndex(installed: InstalledBlock[]) {
  await fs.mkdir(STORE_DEST, { recursive: true });
  await fs.writeFile(GENERATED_INDEX_FILE, renderIndexSource(installed));
}

export async function installStoreBlock(id: string, storePath = DEFAULT_STORE_PATH) {
  const remotePackage = await readRemoteStorePackage(id);
  let block: StoreBlock | null = null;
  let remoteError: unknown;

  if (remotePackage?.mode === 'package' || Array.isArray(remotePackage?.files)) {
    try {
      block = await installFromRemotePackage(id, remotePackage);
    } catch (error) {
      remoteError = error;
    }
  }

  if (!block) {
    try {
      block = await installFromLocalStore(id, storePath);
    } catch (error) {
      if (remoteError) {
        const remoteMessage = remoteError instanceof Error ? remoteError.message : String(remoteError);
        const localMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to install ${id} from remote and local store. Remote: ${remoteMessage}. Local: ${localMessage}`);
      }
      throw error;
    }
  }

  const installed = await readInstalledBlocks();
  const key = blockKey(block);
  const existingIndex = installed.findIndex((item) => item.id === block.id);
  const entry: InstalledBlock = {
    id: block.id,
    name: block.name,
    key,
    version: block.version,
    installedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    installed[existingIndex] = entry;
  } else {
    installed.push(entry);
  }

  await writeInstalledBlocks(installed);
  await writeGeneratedIndex(installed);

  return entry;
}

export async function rebuildAndRestart() {
  return rebuildSiteAndRestart({ siteRoot: SITE_ROOT, envFile: ENV_FILE });
}

export function isComponentStoreWriteEnabled() {
  return process.env.VD_COMPONENT_STORE_WRITE === 'true' || process.env.COMPONENT_STORE_WRITE === 'true';
}

export function isAdminEmailAllowed(email?: string | null) {
  const raw = process.env.VD_COMPONENT_STORE_ADMINS || '';
  const list = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) {
    return true;
  }
  if (!email) return false;
  return list.includes(email.toLowerCase());
}
