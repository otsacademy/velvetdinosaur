import type { UploadedFileResult, UploadViaPresignOptions } from './uploads';
import { buildAssetUrl } from './uploads-url';
import { readStatus } from './uploads-errors';
import { putObjectWithProgress, postFormWithProgress } from './uploads-http';

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
