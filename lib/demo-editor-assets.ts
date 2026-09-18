import { SEED_ASSETS, SEED_FOLDERS } from './demo-editor-assets-seed';
type DemoUploadedFileResult = {
  key: string;
  url: string;
  name: string;
  size: number;
  type: string;
  folder?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
};

type DemoUploadOptions = {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  name?: string;
  caption?: string;
  alt?: string;
  folder?: string;
  width?: number;
  height?: number;
};

type DemoAssetFolderItem = {
  path: string;
  label?: string;
};

type DemoAssetListItem = {
  key: string;
  name?: string;
  caption?: string;
  alt?: string;
  folder?: string;
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
  createdAt?: string;
};

type DemoAssetRecord = DemoAssetListItem & {
  url: string;
};

type DemoAssetListOptions = {
  q?: string;
  mimePrefix?: string;
  folder?: string | null;
  limit?: number;
  cursor?: string | null;
  sort?: 'newest' | 'oldest';
};

type DemoAssetListResult = {
  items: DemoAssetListItem[];
  nextCursor: string | null;
  sort: 'newest' | 'oldest';
};

function createSeedState() {
  return {
    folders: SEED_FOLDERS.map((item) => ({ ...item })),
    assets: SEED_ASSETS.map(
      (asset): DemoAssetRecord => ({
        key: asset.key,
        url: asset.url,
        name: asset.name,
        alt: asset.alt,
        caption: asset.caption,
        folder: asset.folder,
        mime: asset.mime || 'image/svg+xml',
        size: asset.size || 0,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt
      })
    )
  };
}

const state = {
  ...createSeedState()
};

function canUseDom() {
  return typeof window !== 'undefined' && typeof URL !== 'undefined';
}

function normalizeFolder(input?: string | null) {
  if (!input) return '';
  return input
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

function includesQuery(value: string | undefined, query: string) {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

export function isDemoEditorAssetMode() {
  if (!canUseDom()) return false;
  const pathname = window.location.pathname;
  return (
    pathname === '/demo/newsletter' || pathname.startsWith('/demo/newsletter/') ||
    pathname === '/demo/new' ||
    pathname.startsWith('/demo/new/') ||
    pathname === '/new' ||
    pathname === '/demo/media' ||
    pathname.startsWith('/demo/media/') ||
    pathname === '/media'
    || pathname === '/demo/news'
    || pathname.startsWith('/demo/news/')
    || pathname === '/news'
    || pathname === '/demo/stays'
    || pathname.startsWith('/demo/stays/')
    || pathname === '/stays'
    || pathname === '/demo/routes'
    || pathname.startsWith('/demo/routes/')
    || pathname === '/routes'
    || pathname === '/demo/bookings'
    || pathname.startsWith('/demo/bookings/')
    || pathname === '/bookings'
  );
}

export function isDirectAssetUrl(value: string) {
  return /^(blob:|data:|https?:\/\/|\/)/i.test(value);
}

export function resolveDemoEditorAssetUrl(key: string) {
  return state.assets.find((asset) => asset.key === key)?.url ?? null;
}

export function resetDemoEditorAssets() {
  if (!canUseDom()) return;
  for (const asset of state.assets) {
    if (asset.url.startsWith('blob:')) {
      URL.revokeObjectURL(asset.url);
    }
  }
  const next = createSeedState();
  state.assets = next.assets;
  state.folders = next.folders;
}

export async function uploadDemoEditorFile(
  file: File,
  options: DemoUploadOptions = {}
): Promise<DemoUploadedFileResult> {
  if (!canUseDom()) {
    throw new Error('Demo uploads are only available in the browser.');
  }
  if (options.signal?.aborted) {
    const abortError = new Error('Upload aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  const url = URL.createObjectURL(file);
  const folder = normalizeFolder(options.folder) || undefined;
  const key = url;
  const createdAt = new Date().toISOString();
  const nextRecord: DemoAssetRecord = {
    key,
    url,
    name: options.name || file.name.replace(/\.[^/.]+$/, ''),
    caption: options.caption,
    alt: options.alt,
    folder,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    width: options.width,
    height: options.height,
    createdAt
  };

  options.onProgress?.(100);
  state.assets = [nextRecord, ...state.assets.filter((asset) => asset.key !== key)];

  if (folder && !state.folders.some((entry) => entry.path === folder)) {
    state.folders = [...state.folders, { path: folder, label: folder }];
  }

  return {
    key,
    url,
    name: nextRecord.name || 'Upload',
    size: nextRecord.size || 0,
    type: nextRecord.mime || 'application/octet-stream',
    folder,
    caption: nextRecord.caption,
    alt: nextRecord.alt,
    width: nextRecord.width,
    height: nextRecord.height
  };
}

export async function listDemoEditorAssets(
  options: DemoAssetListOptions = {}
): Promise<DemoAssetListResult> {
  const sort = options.sort === 'oldest' ? 'oldest' : 'newest';
  const normalizedQuery = (options.q || '').trim().toLowerCase();
  const normalizedMimePrefix = (options.mimePrefix || '').trim().toLowerCase();
  const normalizedFolder = options.folder === null ? null : normalizeFolder(options.folder);
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(100, Number(options.limit))) : 24;
  const offset = options.cursor ? Number(options.cursor) : 0;
  const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

  const filtered = state.assets.filter((asset) => {
    if (normalizedQuery) {
      const matchesQuery =
        includesQuery(asset.key, normalizedQuery) ||
        includesQuery(asset.name, normalizedQuery) ||
        includesQuery(asset.caption, normalizedQuery) ||
        includesQuery(asset.alt, normalizedQuery);
      if (!matchesQuery) return false;
    }

    if (normalizedMimePrefix) {
      const mime = (asset.mime || '').toLowerCase();
      if (!mime.startsWith(normalizedMimePrefix)) return false;
    }

    if (normalizedFolder === null) {
      return true;
    }

    const assetFolder = normalizeFolder(asset.folder);
    if (normalizedFolder === '') {
      return assetFolder === '';
    }

    return assetFolder === normalizedFolder;
  });

  filtered.sort((a, b) => {
    const left = new Date(a.createdAt || 0).getTime();
    const right = new Date(b.createdAt || 0).getTime();
    return sort === 'oldest' ? left - right : right - left;
  });

  const items = filtered.slice(safeOffset, safeOffset + limit).map((asset) => ({
    key: asset.key,
    name: asset.name,
    caption: asset.caption,
    alt: asset.alt,
    folder: asset.folder,
    mime: asset.mime,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    createdAt: asset.createdAt
  }));
  const nextCursor = safeOffset + limit < filtered.length ? String(safeOffset + limit) : null;

  return { items, nextCursor, sort };
}

export async function updateDemoEditorAssetMetadata(
  key: string,
  update: {
    name?: string;
    caption?: string;
    alt?: string;
    folder?: string;
    width?: number;
    height?: number;
  }
) {
  const nextFolder = normalizeFolder(update.folder) || undefined;
  const current = state.assets.find((asset) => asset.key === key);

  if (!current) {
    throw new Error('Asset not found');
  }

  const updatedRecord: DemoAssetRecord = {
    ...current,
    name: update.name ?? current.name,
    caption: update.caption ?? current.caption,
    alt: update.alt ?? current.alt,
    folder: nextFolder,
    width: update.width ?? current.width,
    height: update.height ?? current.height
  };

  state.assets = state.assets.map((asset) => (asset.key === key ? updatedRecord : asset));

  if (nextFolder && !state.folders.some((entry) => entry.path === nextFolder)) {
    state.folders = [...state.folders, { path: nextFolder, label: nextFolder }];
  }

  return {
    key: updatedRecord.key,
    name: updatedRecord.name,
    caption: updatedRecord.caption,
    alt: updatedRecord.alt,
    folder: updatedRecord.folder,
    width: updatedRecord.width,
    height: updatedRecord.height
  };
}

export async function listDemoEditorAssetFolders(): Promise<DemoAssetFolderItem[]> {
  return [...state.folders].sort((a, b) => a.path.localeCompare(b.path));
}

export async function createDemoEditorAssetFolder(input: {
  path: string;
  label?: string;
}): Promise<DemoAssetFolderItem> {
  const path = normalizeFolder(input.path);
  if (!path) {
    throw new Error('Folder path required');
  }

  const existing = state.folders.find((entry) => entry.path === path);
  if (existing) {
    return existing;
  }

  const item = {
    path,
    label: input.label?.trim() || path
  };
  state.folders = [...state.folders, item];
  return item;
}

export async function deleteDemoEditorAssets(keys: string[]) {
  const keySet = new Set(keys);
  const removed = state.assets.filter((asset) => keySet.has(asset.key));
  for (const asset of removed) {
    if (asset.url.startsWith('blob:')) {
      URL.revokeObjectURL(asset.url);
    }
  }
  state.assets = state.assets.filter((asset) => !keySet.has(asset.key));
  return {
    ok: true,
    results: keys.map((key) => ({ key, ok: true }))
  };
}
