import { withStatus } from './uploads-errors';
export { buildAssetUrl, buildAssetUrlWithFocal, buildAssetImageUrl } from './uploads-url';
export { uploadFile, uploadViaPresign, uploadViaServer } from './uploads-transfer';

export type { AssetImageOptions } from './asset-images';
export { buildCdnImageUrl, resolveAssetImageUrl } from './asset-images';

export type UploadedFileResult = {
  key: string;
  url: string;
  name: string;
  size: number;
  type: string;
  tags?: string[];
  altSource?: 'manual' | 'auto' | null;
  altGeneratedAt?: string | null;
  altModel?: string | null;
  altNeedsReview?: boolean | null;
  folder?: string;
  caption?: string;
  alt?: string;
  focalX?: number;
  focalY?: number;
  width?: number;
  height?: number;
};

export type UploadViaPresignOptions = {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  name?: string;
  caption?: string;
  alt?: string;
  tags?: string[];
  folder?: string;
  focalX?: number;
  focalY?: number;
  width?: number;
  height?: number;
};

export type AssetFolderItem = {
  path: string;
  label?: string;
  description?: string;
  count?: number;
};

export type AssetTagItem = {
  tag: string;
  count: number;
};

export type AssetUsageReference = {
  id: string;
  type: 'page' | 'article' | 'newsletter';
  slug: string;
  title: string;
  status?: string;
  url: string;
  locations: string[];
};

export type AssetUsageItem = {
  key: string;
  count: number;
  references: AssetUsageReference[];
};

export type ReplaceAssetResult = {
  key: string;
  name?: string;
  caption?: string;
  alt?: string;
  tags?: string[];
  altSource?: 'manual' | 'auto' | null;
  altGeneratedAt?: string | null;
  altModel?: string | null;
  altNeedsReview?: boolean | null;
  folder?: string;
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
  focalX?: number;
  focalY?: number;
};

function withLiveCaptureQuery(url: URL) {
  if (typeof window === 'undefined') return url;
  const params = new URLSearchParams(window.location.search);
  if (params.get('capture') !== '1' || params.get('live') !== '1') return url;
  const video = params.get('video');
  if (!video) return url;
  url.searchParams.set('capture', '1');
  url.searchParams.set('live', '1');
  url.searchParams.set('video', video);
  return url;
}

export async function updateAssetMetadata(
  key: string,
  update: {
    name?: string;
    caption?: string;
    alt?: string;
    tags?: string[];
    folder?: string;
    altNeedsReview?: boolean;
    width?: number;
    height?: number;
    focalX?: number;
    focalY?: number;
  }
): Promise<{
  key: string;
  name?: string;
  caption?: string;
  alt?: string;
  tags?: string[];
  altSource?: 'manual' | 'auto' | null;
  altGeneratedAt?: string | null;
  altModel?: string | null;
  altNeedsReview?: boolean | null;
  folder?: string;
  width?: number;
  height?: number;
  focalX?: number;
  focalY?: number;
  focalSetAt?: string;
  focalSetBy?: string;
}> {
  const res = await fetch('/api/assets/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      key,
      ...update
    })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to update asset';
    throw new Error(message);
  }
  return payload as {
    key: string;
    name?: string;
    caption?: string;
    alt?: string;
    tags?: string[];
    altSource?: 'manual' | 'auto' | null;
    altGeneratedAt?: string | null;
    altModel?: string | null;
    altNeedsReview?: boolean | null;
    folder?: string;
    width?: number;
    height?: number;
    focalX?: number;
    focalY?: number;
    focalSetAt?: string;
    focalSetBy?: string;
  };
}

export async function listAssetFolders(): Promise<AssetFolderItem[]> {
  const url =
    typeof window === 'undefined'
      ? '/api/assets/folders'
      : withLiveCaptureQuery(new URL('/api/assets/folders', window.location.origin)).toString();
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to load folders';
    throw new Error(message);
  }
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items
    .map((item: unknown) => {
      const row = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
      return {
        path: typeof row.path === 'string' ? row.path : '',
        label: typeof row.label === 'string' ? row.label : undefined,
        description: typeof row.description === 'string' ? row.description : undefined,
        count: typeof row.count === 'number' ? row.count : 0
      };
    })
    .filter((item: { path: string }) => item.path);
}

export async function listAssetTags(options?: { status?: 'active' | 'trashed' | 'all'; folder?: string }): Promise<AssetTagItem[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (typeof options?.folder === 'string') params.set('folder', options.folder);
  const query = params.toString();
  const url =
    typeof window === 'undefined'
      ? query ? `/api/assets/tags?${query}` : '/api/assets/tags'
      : withLiveCaptureQuery(new URL(query ? `/api/assets/tags?${query}` : '/api/assets/tags', window.location.origin)).toString();
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to load tags';
    throw new Error(message);
  }
  const items = (Array.isArray(payload?.items) ? payload.items : []) as Array<{ tag?: unknown; count?: unknown }>;
  return items
    .map((item) => ({
      tag: typeof item?.tag === 'string' ? item.tag : '',
      count: typeof item?.count === 'number' ? item.count : 0
    }))
    .filter((item) => item.tag);
}

export async function createAssetFolder(input: { path: string; label?: string; description?: string }): Promise<AssetFolderItem> {
  const res = await fetch('/api/assets/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input)
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to create folder';
    throw new Error(message);
  }
  const item = payload?.item;
  if (!item || typeof item.path !== 'string') {
    throw new Error('Folder not available');
  }
  return {
    path: item.path,
    label: typeof item?.label === 'string' ? item.label : undefined,
    description: typeof item?.description === 'string' ? item.description : undefined,
    count: typeof item?.count === 'number' ? item.count : 0
  };
}

export async function updateAssetFolder(input: {
  path: string;
  nextPath?: string;
  label?: string;
  description?: string;
}): Promise<AssetFolderItem> {
  const res = await fetch('/api/assets/folders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input)
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to update folder';
    throw withStatus(new Error(message), res.status);
  }
  const item = payload?.item;
  if (!item || typeof item.path !== 'string') {
    throw new Error('Folder not available');
  }
  return {
    path: item.path,
    label: typeof item?.label === 'string' ? item.label : undefined,
    description: typeof item?.description === 'string' ? item.description : undefined,
    count: typeof item?.count === 'number' ? item.count : 0
  };
}

export async function deleteAssetFolder(path: string): Promise<void> {
  const res = await fetch('/api/assets/folders', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to delete folder';
    throw withStatus(new Error(message), res.status);
  }
}

export async function listAssetUsage(keys: string[]): Promise<AssetUsageItem[]> {
  const uniqueKeys = Array.from(new Set(keys.map((key) => key.trim()).filter((key) => key.startsWith('uploads/'))));
  if (uniqueKeys.length === 0) return [];
  const url =
    typeof window === 'undefined'
      ? '/api/assets/usage'
      : withLiveCaptureQuery(new URL('/api/assets/usage', window.location.origin)).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ keys: uniqueKeys })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to load usage references';
    throw new Error(message);
  }
  const items = (Array.isArray(payload?.items) ? payload.items : []) as Array<Record<string, unknown>>;
  return items.map((item) => ({
    key: typeof item.key === 'string' ? item.key : '',
    count: typeof item.count === 'number' ? item.count : 0,
    references: Array.isArray(item.references)
      ? item.references
          .map((reference) => {
            const row = typeof reference === 'object' && reference !== null ? (reference as Record<string, unknown>) : {};
            return {
              id: typeof row.id === 'string' ? row.id : '',
              type: row.type === 'newsletter' ? 'newsletter' : row.type === 'article' ? 'article' : 'page',
              slug: typeof row.slug === 'string' ? row.slug : '',
              title: typeof row.title === 'string' ? row.title : '',
              status: typeof row.status === 'string' ? row.status : undefined,
              url: typeof row.url === 'string' ? row.url : '',
              locations: Array.isArray(row.locations)
                ? row.locations.filter((location): location is string => typeof location === 'string')
                : []
            } as AssetUsageReference;
          })
          .filter((reference) => reference.id && reference.slug)
      : []
  }));
}

export async function replaceAssetFile(
  key: string,
  file: File,
  options?: { width?: number; height?: number }
): Promise<ReplaceAssetResult> {
  if (!key.startsWith('uploads/')) {
    throw new Error('Invalid asset key');
  }
  const formData = new FormData();
  formData.append('key', key);
  formData.append('file', file, file.name);
  if (typeof options?.width === 'number' && Number.isFinite(options.width) && options.width > 0) {
    formData.append('width', String(Math.round(options.width)));
  }
  if (typeof options?.height === 'number' && Number.isFinite(options.height) && options.height > 0) {
    formData.append('height', String(Math.round(options.height)));
  }
  const res = await fetch('/api/assets/replace', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to replace asset';
    throw new Error(message);
  }
  return payload as ReplaceAssetResult;
}

export async function deleteAssets(keys: string[], options?: { permanent?: boolean; emptyTrash?: boolean }) {
  const mode = options?.permanent ? 'purge' : 'trash';
  const res = await fetch('/api/assets/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      keys,
      mode,
      emptyTrash: options?.emptyTrash === true
    })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.ok === false) {
    const failed = Array.isArray(payload?.results)
      ? payload.results.filter((item: { ok?: boolean }) => item?.ok === false)
      : [];
    const message = payload?.error || 'Failed to delete assets';
    if (failed.length) {
      throw new Error(`${message} (${failed.length} failed)`);
    }
    throw new Error(message);
  }
  return payload as { ok: boolean; results?: Array<{ key: string; ok: boolean; error?: string }> };
}

export async function restoreAssets(keys: string[]) {
  const res = await fetch('/api/assets/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ keys })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.ok === false) {
    const failed = Array.isArray(payload?.results)
      ? payload.results.filter((item: { ok?: boolean }) => item?.ok === false)
      : [];
    const message = payload?.error || 'Failed to restore assets';
    if (failed.length) {
      throw new Error(`${message} (${failed.length} failed)`);
    }
    throw new Error(message);
  }
  return payload as { ok: boolean; results?: Array<{ key: string; ok: boolean; error?: string }> };
}
