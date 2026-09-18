import { createHash } from 'node:crypto';
import sharp from 'sharp';
import {
  NEWSLETTER_ATTACHMENT_BYTES, NEWSLETTER_ATTACHMENT_LIMIT, NEWSLETTER_MESSAGE_BYTES,
  type NewsletterPreparedAttachment,
} from './media-types';

export const NEWSLETTER_SOURCE_BYTES = 25 * 1024 * 1024;
export const NEWSLETTER_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const mediaChecksum = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

export function normalizeMediaAssetKey(value: unknown) {
  if (typeof value !== 'string' || value.length > 1024 || !value.startsWith('uploads/') ||
    /[\\\x00-\x1f]/.test(value) || value.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error('Choose a file from this site’s Media Library.');
  }
  return value;
}

export function normalizeAttachmentKeys(values: unknown): string[] {
  if (values == null) return [];
  if (!Array.isArray(values) || values.length > NEWSLETTER_ATTACHMENT_LIMIT) {
    throw new Error(`Choose at most ${NEWSLETTER_ATTACHMENT_LIMIT} attachments.`);
  }
  const keys = values.map((value) => normalizeMediaAssetKey(value?.assetKey));
  if (new Set(keys).size !== keys.length) throw new Error('The same file cannot be attached twice.');
  return keys;
}

export function detectNewsletterMime(bytes: Buffer) {
  if (bytes.subarray(0, 5).toString('ascii') === '%PDF-' && /%%EOF\s*$/.test(bytes.subarray(-2048).toString('ascii'))) return 'application/pdf';
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  throw new Error('The file contents are not a supported PDF, JPEG or PNG image.');
}

export function safeAttachmentName(name: string | undefined, mime: string) {
  const extension = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
  const base = (name || 'attachment').replace(/[\/\\\x00-\x1f\x7f<>:"|?*]/g, '-').replace(/\.[a-z0-9]{1,8}$/i, '').trim().slice(0, 160);
  return `${base || 'attachment'}.${extension}`;
}

export async function createNewsletterImage(bytes: Buffer) {
  const mime = detectNewsletterMime(bytes);
  if (!mime.startsWith('image/')) throw new Error('Choose a JPEG, PNG or WebP image.');
  const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'warning', animated: false });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error('This image could not be decoded.');
  const resized = image.rotate().resize({ width: 1120, withoutEnlargement: true, fit: 'inside' });
  const alpha = metadata.hasAlpha === true;
  const result = await (alpha ? resized.png({ compressionLevel: 9 }) : resized.jpeg({ quality: 88, mozjpeg: true })).toBuffer({ resolveWithObject: true });
  if (result.data.length > NEWSLETTER_SOURCE_BYTES) throw new Error('This image is too large for newsletter delivery. Choose a smaller image.');
  return { bytes: result.data, mime: alpha ? 'image/png' : 'image/jpeg', width: result.info.width, height: result.info.height };
}

export async function validateNewsletterAttachment(bytes: Buffer, name?: string) {
  if (!bytes.length || bytes.length > NEWSLETTER_ATTACHMENT_BYTES) throw new Error('Attachments must total no more than 5 MiB.');
  let mime = detectNewsletterMime(bytes);
  let content = bytes;
  if (mime === 'image/webp') {
    const converted = await createNewsletterImage(bytes);
    content = converted.bytes;
    mime = converted.mime;
  } else if (mime.startsWith('image/')) {
    // Force a complete decode; MIME labels and header bytes alone are not proof.
    await sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'warning' }).raw().toBuffer();
  }
  return { bytes: content, mime, name: safeAttachmentName(name, mime), size: content.length };
}

export function assertNewsletterMessageSize(input: {
  htmlBody: string; textBody: string; subject?: string; attachments?: NewsletterPreparedAttachment[];
}) {
  const bodyBytes = Buffer.byteLength(input.htmlBody) + Buffer.byteLength(input.textBody) + Buffer.byteLength(input.subject || '');
  if (Buffer.byteLength(input.htmlBody) > 1024 * 1024 || Buffer.byteLength(input.textBody) > 1024 * 1024) {
    throw new Error('Newsletter HTML and text must each be smaller than 1 MiB.');
  }
  // MIME base64 has a CRLF every 76 characters; allow ample per-part overhead.
  const attachmentBytes = (input.attachments || []).reduce((sum, item) => sum + item.Content.length + Math.ceil(item.Content.length / 76) * 2 + 2048, 0);
  if (Math.ceil(bodyBytes * 4 / 3) + attachmentBytes + 64 * 1024 > NEWSLETTER_MESSAGE_BYTES) {
    throw new Error('The encoded newsletter exceeds the email size limit. Remove an attachment or shorten the message.');
  }
}
