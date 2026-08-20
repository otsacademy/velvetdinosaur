import {
  createDemoEditorAssetFolder,
  deleteDemoEditorAssets,
  isDemoEditorAssetMode,
  isDirectAssetUrl,
  listDemoEditorAssetFolders,
  listDemoEditorAssets,
  resolveDemoEditorAssetUrl,
  updateDemoEditorAssetMetadata,
  uploadDemoEditorFile
} from './demo-editor-assets';
export { isDemoEditorAssetMode } from './demo-editor-assets';

import type { AssetImageOptions } from './asset-images';
import { buildCdnImageUrl, resolveAssetImageUrl } from './asset-images';

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
  type: 'page' | 'article';
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

type StatusError = Error & { status?: number };

function withStatus(error: Error, status: number): StatusError {
  const next = error as StatusError;
  next.status = status;
  return next;
}

function readStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

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

export function buildAssetUrl(key: string) {
  if (isDemoEditorAssetMode()) {
    const demoUrl = resolveDemoEditorAssetUrl(key);
    if (demoUrl) return demoUrl;
  }
  return `/api/assets/file?key=${encodeURIComponent(key)}`;
}

export function buildAssetUrlWithFocal(key: string, focalX?: number, focalY?: number) {
  if (focalX === undefined && focalY === undefined) {
    return buildAssetUrl(key);
  }
  const url = new URL(buildAssetUrl(key), 'http://localhost');
  if (focalX !== undefined && Number.isFinite(focalX)) {
    url.searchParams.set('focalX', String(focalX));
  }
  if (focalY !== undefined && Number.isFinite(focalY)) {
    url.searchParams.set('focalY', String(focalY));
  }
  return `${url.pathname}${url.search}`;
}

export function buildAssetImageUrl(key: string, options?: AssetImageOptions) {
  return buildCdnImageUrl(buildAssetUrl(key), options);
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
  if (isDemoEditorAssetMode()) {
    return updateDemoEditorAssetMetadata(key, update);
  }
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
  if (isDemoEditorAssetMode()) {
    return listDemoEditorAssetFolders();
  }
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
  if (isDemoEditorAssetMode()) {
    return createDemoEditorAssetFolder(input);
  }
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
              type: row.type === 'article' ? 'article' : 'page',
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

export async function uploadViaPresign(
  file: File,
  opts: UploadViaPresignOptions = {}
): Promise<UploadedFileResult> {
  const presignRes = await fetch('/api/assets/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      name: opts.name,
      caption: opts.caption,
      alt: opts.alt,
      focalX: opts.focalX,
      focalY: opts.focalY,
      width: opts.width,
      height: opts.height,
      folder: opts.folder,
      tags: opts.tags
    })
  });

  const presignPayload = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok) {
    const message = presignPayload?.error || 'Failed to get upload URL';
    throw new Error(message);
  }

  const {
    key,
    uploadUrl,
    tags,
    altSource,
    altGeneratedAt,
    altModel,
    altNeedsReview
  } = presignPayload as {
    key: string;
    uploadUrl: string;
    altSource?: 'manual' | 'auto' | null;
    altGeneratedAt?: string | null;
    altModel?: string | null;
    altNeedsReview?: boolean | null;
    tags?: string[];
  };
  if (!key || !uploadUrl) {
    throw new Error('Upload URL not available');
  }

  const { etag } = await putObjectWithProgress({
    file,
    uploadUrl,
    contentType: file.type || 'application/octet-stream',
    signal: opts.signal,
    onProgress: opts.onProgress
  });

  await finalizeUpload({
    key,
    etag,
    size: file.size,
    mime: file.type,
    name: opts.name,
    caption: opts.caption,
    alt: opts.alt,
    focalX: opts.focalX,
    focalY: opts.focalY,
    width: opts.width,
    height: opts.height,
    folder: opts.folder,
    tags: opts.tags
  });

  return {
    key,
    url: buildAssetUrl(key),
    name: opts.name || file.name,
    size: file.size,
    type: file.type,
    folder: opts.folder,
    tags: Array.isArray(tags) ? tags : opts.tags,
    caption: opts.caption,
    alt: opts.alt,
    altSource: altSource,
    altGeneratedAt: altGeneratedAt,
    altModel: altModel,
    altNeedsReview: altNeedsReview,
    focalX: opts.focalX,
    focalY: opts.focalY,
    width: opts.width,
    height: opts.height
  };
}

export async function uploadViaServer(
  file: File,
  opts: UploadViaPresignOptions = {}
): Promise<UploadedFileResult> {
  if (opts.signal?.aborted) {
    const abortError = new Error('Upload aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  const formData = new FormData();
  formData.append('file', file, file.name);
  if (opts.name) {
    formData.append('name', opts.name);
  }
  if (opts.caption) {
    formData.append('caption', opts.caption);
  }
  if (opts.alt) {
    formData.append('alt', opts.alt);
  }
  if (opts.folder) {
    formData.append('folder', opts.folder);
  }
  if (Array.isArray(opts.tags) && opts.tags.length > 0) {
    formData.append('tags', opts.tags.join(','));
  }
  if (typeof opts.width === 'number' && Number.isFinite(opts.width) && opts.width > 0) {
    formData.append('width', String(Math.round(opts.width)));
  }
  if (typeof opts.height === 'number' && Number.isFinite(opts.height) && opts.height > 0) {
    formData.append('height', String(Math.round(opts.height)));
  }
  if (typeof opts.focalX === 'number' && Number.isFinite(opts.focalX)) {
    formData.append('focalX', String(opts.focalX));
  }
  if (typeof opts.focalY === 'number' && Number.isFinite(opts.focalY)) {
    formData.append('focalY', String(opts.focalY));
  }

  const payload = await postFormWithProgress({
    formData,
    signal: opts.signal,
    onProgress: opts.onProgress
  });

  const key = payload?.key;
  const url = payload?.url;
  const name = payload?.name;
  const caption = payload?.caption;
  const alt = payload?.alt;
  const altSource = payload?.altSource;
  const altGeneratedAt = payload?.altGeneratedAt;
  const altModel = payload?.altModel;
  const altNeedsReview = payload?.altNeedsReview;
  const tags = payload?.tags;
  const focalX = payload?.focalX;
  const focalY = payload?.focalY;
  const width = payload?.width;
  const height = payload?.height;
  const folder = payload?.folder;
  if (!key || !url) {
    throw new Error('Upload failed');
  }

  return {
    key,
    url,
    name: typeof name === 'string' ? name : opts.name || file.name,
    size: file.size,
    type: file.type,
    folder: typeof folder === 'string' && folder.trim() ? folder.trim() : opts.folder,
    tags: Array.isArray(tags) ? tags : opts.tags,
    caption: typeof caption === 'string' && caption.trim() ? caption.trim() : opts.caption,
    alt: typeof alt === 'string' && alt.trim() ? alt.trim() : opts.alt,
    altSource: altSource,
    altGeneratedAt: altGeneratedAt,
    altModel: altModel,
    altNeedsReview: altNeedsReview,
    focalX: typeof focalX === 'number' && Number.isFinite(focalX) ? focalX : opts.focalX,
    focalY: typeof focalY === 'number' && Number.isFinite(focalY) ? focalY : opts.focalY,
    width: typeof width === 'number' && Number.isFinite(width) ? width : opts.width,
    height: typeof height === 'number' && Number.isFinite(height) ? height : opts.height
  };
}

export async function uploadFile(
  file: File,
  opts: UploadViaPresignOptions = {}
): Promise<UploadedFileResult> {
  if (isDemoEditorAssetMode()) {
    return uploadDemoEditorFile(file, opts);
  }
  try {
    return await uploadViaServer(file, opts);
  } catch (error) {
    const status = readStatus(error);
    if (status === 404 || status === 405) {
      return await uploadViaPresign(file, opts);
    }
    throw error;
  }
}

async function finalizeUpload(input: {
  key: string;
  etag?: string | null;
  size?: number;
  mime?: string;
  name?: string;
  caption?: string;
  alt?: string;
  tags?: string[];
  focalX?: number;
  focalY?: number;
  folder?: string;
  width?: number;
  height?: number;
}) {
  const res = await fetch('/api/assets/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      key: input.key,
      etag: input.etag || undefined,
      size: input.size || undefined,
      mime: input.mime || undefined,
      name: input.name,
      caption: input.caption,
      alt: input.alt,
      tags: input.tags,
      focalX: input.focalX,
      focalY: input.focalY,
      width: input.width,
      height: input.height,
      folder: input.folder
    })
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.error || `Upload verification failed (${res.status})`);
  }
}

export async function deleteAssets(keys: string[], options?: { permanent?: boolean; emptyTrash?: boolean }) {
  if (isDemoEditorAssetMode()) {
    return deleteDemoEditorAssets(keys);
  }
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

async function putObjectWithProgress({
  file,
  uploadUrl,
  contentType,
  signal,
  onProgress
}: {
  file: File;
  uploadUrl: string;
  contentType: string;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<{ etag?: string | null }> {
  if (signal?.aborted) {
    const abortError = new Error('Upload aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  onProgress?.(0);

  if (typeof window === 'undefined' || typeof XMLHttpRequest === 'undefined') {
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
      signal
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed (${putRes.status})`);
    }
    onProgress?.(100);
    return { etag: putRes.headers.get('etag') };
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abortHandler = () => xhr.abort();

    const cleanup = () => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ etag: xhr.getResponseHeader('etag') });
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error('Upload failed'));
    };

    xhr.onabort = () => {
      cleanup();
      const abortError = new Error('Upload aborted');
      abortError.name = 'AbortError';
      reject(abortError);
    };

    if (signal) {
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

async function postFormWithProgress({
  formData,
  signal,
  onProgress
}: {
  formData: FormData;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<{
  key: string;
  url: string;
  name?: string;
  folder?: string;
  caption?: string;
  alt?: string;
  tags?: string[];
  altSource?: 'manual' | 'auto' | null;
  altGeneratedAt?: string | null;
  altModel?: string | null;
  altNeedsReview?: boolean | null;
  focalX?: number;
  focalY?: number;
  width?: number;
  height?: number;
}> {
  if (signal?.aborted) {
    const abortError = new Error('Upload aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  onProgress?.(0);

  if (typeof window === 'undefined' || typeof XMLHttpRequest === 'undefined') {
    const res = await fetch('/api/assets/upload', {
      method: 'POST',
      body: formData,
      signal
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      const message = detail?.error || `Upload failed (${res.status})`;
      throw withStatus(new Error(message), res.status);
    }
    const payload = await res.json();
    onProgress?.(100);
    return payload as {
      key: string;
      url: string;
      name?: string;
      folder?: string;
      caption?: string;
      alt?: string;
      tags?: string[];
      altSource?: 'manual' | 'auto' | null;
      altGeneratedAt?: string | null;
      altModel?: string | null;
      altNeedsReview?: boolean | null;
      focalX?: number;
      focalY?: number;
      width?: number;
      height?: number;
    };
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abortHandler = () => xhr.abort();

    const cleanup = () => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        try {
          const payload = JSON.parse(xhr.responseText || '{}') as {
            key: string;
            url: string;
            name?: string;
            folder?: string;
            caption?: string;
            alt?: string;
            tags?: string[];
            altSource?: 'manual' | 'auto' | null;
            altGeneratedAt?: string | null;
            altModel?: string | null;
            altNeedsReview?: boolean | null;
            focalX?: number;
            focalY?: number;
            width?: number;
            height?: number;
          };
          resolve(payload);
        } catch {
          reject(withStatus(new Error('Upload failed'), xhr.status));
        }
        return;
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        const payload = JSON.parse(xhr.responseText || '{}') as { error?: string };
        if (payload?.error) message = payload.error;
      } catch {
        // ignore parse errors
      }
      reject(withStatus(new Error(message), xhr.status));
    };

    xhr.onerror = () => {
      cleanup();
      reject(withStatus(new Error('Upload failed'), xhr.status));
    };

    xhr.onabort = () => {
      cleanup();
      const abortError = new Error('Upload aborted');
      abortError.name = 'AbortError';
      reject(abortError);
    };

    if (signal) {
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    xhr.open('POST', '/api/assets/upload', true);
    xhr.send(formData);
  });
}

// Velvet Dinosaur extras: legacy list API used by the public demo flows.
export async function listAssets(input: {
  q?: string;
  mimePrefix?: string;
  folder?: string | null;
  limit?: number;
  cursor?: string | null;
  sort?: 'newest' | 'oldest';
}): Promise<{
  items: Array<{
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
  }>;
  nextCursor: string | null;
  sort: 'newest' | 'oldest';
}> {
  if (isDemoEditorAssetMode()) {
    return listDemoEditorAssets(input);
  }

  const url = new URL('/api/assets/list', window.location.origin);
  if (input.q) url.searchParams.set('q', input.q);
  if (input.mimePrefix) url.searchParams.set('mimePrefix', input.mimePrefix);
  if (typeof input.folder === 'string') url.searchParams.set('folder', input.folder);
  if (input.folder === '') url.searchParams.set('folder', '');
  if (input.limit) url.searchParams.set('limit', String(input.limit));
  if (input.cursor) url.searchParams.set('cursor', input.cursor);
  if (input.sort) url.searchParams.set('sort', input.sort);

  const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to load assets';
    throw new Error(message);
  }

  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    nextCursor: typeof payload?.nextCursor === 'string' ? payload.nextCursor : null,
    sort: payload?.sort === 'oldest' ? 'oldest' : 'newest'
  };
}
