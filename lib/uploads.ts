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
  folder?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type UploadViaPresignOptions = {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  name?: string;
  caption?: string;
  alt?: string;
  folder?: string;
  width?: number;
  height?: number;
};

export type AssetFolderItem = {
  path: string;
  label?: string;
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

export function buildAssetUrl(key: string) {
  return `/api/assets/file?key=${encodeURIComponent(key)}`;
}

export function buildAssetImageUrl(key: string, options?: AssetImageOptions) {
  return buildCdnImageUrl(buildAssetUrl(key), options);
}

export async function updateAssetMetadata(
  key: string,
  update: { name?: string; caption?: string; alt?: string; folder?: string; width?: number; height?: number }
): Promise<{ key: string; name?: string; caption?: string; alt?: string; folder?: string; width?: number; height?: number }> {
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
  return payload as { key: string; name?: string; caption?: string; alt?: string; folder?: string; width?: number; height?: number };
}

export async function listAssetFolders(): Promise<AssetFolderItem[]> {
  const res = await fetch('/api/assets/folders', { credentials: 'include', cache: 'no-store' });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to load folders';
    throw new Error(message);
  }
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.filter(Boolean) as AssetFolderItem[];
}

export async function createAssetFolder(input: { path: string; label?: string }): Promise<AssetFolderItem> {
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
  return item as AssetFolderItem;
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
      width: opts.width,
      height: opts.height,
      folder: opts.folder
    })
  });

  const presignPayload = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok) {
    const message = presignPayload?.error || 'Failed to get upload URL';
    throw new Error(message);
  }

  const { key, uploadUrl } = presignPayload as { key: string; uploadUrl: string };
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
    width: opts.width,
    height: opts.height,
    folder: opts.folder
  });

  return {
    key,
    url: buildAssetUrl(key),
    name: opts.name || file.name,
    size: file.size,
    type: file.type,
    folder: opts.folder,
    caption: opts.caption,
    alt: opts.alt,
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
  if (typeof opts.width === 'number' && Number.isFinite(opts.width) && opts.width > 0) {
    formData.append('width', String(Math.round(opts.width)));
  }
  if (typeof opts.height === 'number' && Number.isFinite(opts.height) && opts.height > 0) {
    formData.append('height', String(Math.round(opts.height)));
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
    caption: typeof caption === 'string' && caption.trim() ? caption.trim() : opts.caption,
    alt: typeof alt === 'string' && alt.trim() ? alt.trim() : opts.alt,
    width: typeof width === 'number' && Number.isFinite(width) ? width : opts.width,
    height: typeof height === 'number' && Number.isFinite(height) ? height : opts.height
  };
}

export async function uploadFile(
  file: File,
  opts: UploadViaPresignOptions = {}
): Promise<UploadedFileResult> {
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

export async function deleteAssets(keys: string[]) {
  const res = await fetch('/api/assets/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ keys })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error || 'Failed to delete assets';
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
