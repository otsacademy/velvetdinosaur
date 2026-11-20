import { fileTypeFromBuffer } from 'file-type';

export const MAX_ASSET_BYTES = 100 * 1024 * 1024;
const INLINE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'
]);
const DOCUMENT_TYPES = new Set([
  'application/pdf', 'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv'
]);

export class UnsafeAssetError extends Error {}

export function normalizeAssetMime(value: unknown) {
  return typeof value === 'string' ? value.split(';')[0].trim().toLowerCase() : '';
}

export function assertAllowedAssetType(mime: unknown, filename = '') {
  const type = normalizeAssetMime(mime);
  if (!INLINE_TYPES.has(type) && !DOCUMENT_TYPES.has(type) && type !== 'image/svg+xml') {
    throw new UnsafeAssetError('Unsupported file type. Upload an image, media file, PDF or office document.');
  }
  if (/\.(?:html?|xhtml|shtml|xml|js|mjs|cjs|php|exe|swf)$/i.test(filename)) {
    throw new UnsafeAssetError('Executable documents cannot be uploaded.');
  }
  return type;
}

export async function validateAssetBytes(body: Buffer, mime: string) {
  const type = assertAllowedAssetType(mime);
  if (!body.length || body.length > MAX_ASSET_BYTES) {
    throw new UnsafeAssetError('Files must contain data and be no larger than 100 MB.');
  }
  if (type === 'image/svg+xml') {
    // SVG is accepted only by the server rasterization path. Reject entities,
    // embedded web documents and external resources before the native parser.
    const svg = body.toString('utf8');
    if (!/<svg[\s>]/i.test(svg) || /<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject|iframe|object|embed)\b|\bon\w+\s*=|(?:href|src)\s*=\s*["']\s*(?!#)|url\(\s*(?!#)/i.test(svg)) {
      throw new UnsafeAssetError('SVG contains unsupported active content or external resources.');
    }
    return;
  }
  if (type === 'text/plain' || type === 'text/csv') {
    if (body.includes(0) || /<(?:!doctype|html|script|svg|iframe)\b/i.test(body.toString('utf8'))) {
      throw new UnsafeAssetError('The file contents do not match a plain text document.');
    }
    return;
  }
  const detected = await fileTypeFromBuffer(body).catch(() => undefined);
  if (!detected || normalizeAssetMime(detected.mime) !== type) {
    throw new UnsafeAssetError('The file contents do not match the declared type.');
  }
}

export function assetResponseHeaders(mime: unknown, key: string) {
  const type = normalizeAssetMime(mime);
  const inline = INLINE_TYPES.has(type);
  const filename = (key.split('/').pop() || 'download').replace(/[^a-zA-Z0-9._-]/g, '_');
  return {
    'Content-Type': inline ? type : 'application/octet-stream',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "sandbox; default-src 'none'; base-uri 'none'; form-action 'none'"
  };
}
