import { createHash } from 'node:crypto';
import { assertServerOnly } from '@/lib/_server/guard';
import { NewsletterMedia } from '@/models/NewsletterMedia';
import type { NewsletterAttachment, NewsletterMediaItem, NewsletterMediaManifest, NewsletterPreparedAttachment } from './media-types';
import { NEWSLETTER_ATTACHMENT_BYTES } from './media-types';
import {
  createNewsletterImage, mediaChecksum, NEWSLETTER_RETENTION_MS, normalizeAttachmentKeys,
  safeAttachmentName, validateNewsletterAttachment, assertNewsletterMessageSize,
} from './media-validation';
import {
  getNewsletterMediaRecord, requireMediaDatabase, resolveNewsletterSource, storeNewsletterMedia,
  verifyNewsletterMedia, type NewsletterMediaRecord,
} from './media-storage';
export { cleanupNewsletterMedia, releaseNewsletterMedia } from './media-lifecycle';
assertServerOnly('lib/newsletter/media.ts');

const mediaId = (...parts: string[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex');
const imageUrl = (id: string) => `{{appUrl}}/api/newsletter/media/${id}`;

export async function selectNewsletterMedia(assetKey: string, kind: 'image' | 'attachment'): Promise<NewsletterMediaItem> {
  const { asset, ownerSite, bytes } = await resolveNewsletterSource(assetKey);
  if (kind === 'attachment') {
    const attachment = await validateNewsletterAttachment(bytes, asset.name);
    return { assetKey, name: attachment.name, mime: attachment.mime, size: attachment.size, url: `/api/assets/file?key=${encodeURIComponent(assetKey)}` };
  }
  const image = await createNewsletterImage(bytes);
  const sha256 = mediaChecksum(image.bytes);
  const id = mediaId(ownerSite, 'image-v1', assetKey, sha256);
  const extension = image.mime === 'image/png' ? 'png' : 'jpg';
  await storeNewsletterMedia({
    id, ownerSite, kind, assetKey, bucket: asset.bucket,
    storageKey: `newsletter-images/${ownerSite}/${id}.${extension}`, sha256,
    name: safeAttachmentName(asset.name, image.mime), mime: image.mime, size: image.bytes.length,
    width: image.width, height: image.height, expiresAt: new Date(Date.now() + NEWSLETTER_RETENTION_MS),
  }, image.bytes);
  return {
    assetKey, name: safeAttachmentName(asset.name, image.mime), mime: image.mime, size: image.bytes.length,
    url: imageUrl(id), renditionId: id, width: image.width, height: image.height,
    alt: asset.alt || '', caption: asset.caption || '',
  };
}

function visualImageIds(value: unknown, result = new Map<string, string>()) {
  if (Array.isArray(value)) value.forEach((item) => visualImageIds(item, result));
  else if (value && typeof value === 'object') {
    const node = value as Record<string, unknown>;
    if (node.type === 'img') {
      if (typeof node.renditionId !== 'string' || typeof node.assetKey !== 'string') throw new Error('Select a Media Library image again before sending.');
      result.set(node.renditionId, node.assetKey);
    }
    if (node.children) visualImageIds(node.children, result);
  }
  return result;
}

function htmlImageIds(html: string) {
  const ids = new Set<string>();
  for (const match of html.matchAll(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    const source = match[1] || match[2] || match[3] || '';
    if (source.includes('/api/assets/file')) throw new Error('Replace the legacy inline image using the newsletter Media Library picker before sending.');
    if (source.includes('/api/newsletter/media/')) {
      const id = source.match(/\/api\/newsletter\/media\/([a-f0-9]{64})$/)?.[1];
      if (!id) throw new Error('An inline newsletter image reference is invalid.');
      ids.add(id);
    }
  }
  return ids;
}

async function retainImages(records: NewsletterMediaRecord[], permanent: boolean) {
  for (const record of records) {
    const mutation = permanent
      ? { $set: { retained: true }, $unset: { expiresAt: '' } }
      : { $set: { expiresAt: new Date(Date.now() + NEWSLETTER_RETENTION_MS) } };
    const result = await NewsletterMedia.updateOne({ id: record.id, deletingAt: null, ...(permanent ? {} : { retained: { $ne: true } }) }, mutation);
    if (!result.matchedCount && !record.retained) throw new Error('The selected image is being cleaned up. Please select it again.');
  }
}

/** A submitted test may be accepted even if its provider response is lost. */
export async function retainNewsletterMediaImages(manifest: NewsletterMediaManifest) {
  const images: NewsletterMediaRecord[] = [];
  for (const reference of manifest.images) {
    const record = await getNewsletterMediaRecord(reference.id, 'image');
    if (record.sha256 !== reference.sha256 || record.assetKey !== reference.assetKey) throw new Error('A newsletter image reference has changed.');
    images.push(record);
  }
  await retainImages(images, true);
}

export async function prepareNewsletterMedia(input: {
  htmlBody: string; visualBody?: unknown; attachments?: NewsletterAttachment[]; campaignId?: string;
}) {
  const keys = normalizeAttachmentKeys(input.attachments);
  const visualIds = visualImageIds(input.visualBody);
  const ids = htmlImageIds(input.htmlBody);
  for (const id of visualIds.keys()) {
    if (!ids.has(id)) throw new Error('An image in the visual document is missing from the email body. Save the draft again.');
  }
  const manifest: NewsletterMediaManifest = { version: 1, preparedAt: new Date().toISOString(), images: [], attachments: [] };
  const attachments: NewsletterPreparedAttachment[] = [];
  let htmlBody = input.htmlBody;
  if (!ids.size && !keys.length) return { htmlBody, attachments, manifest };
  const ownerSite = await requireMediaDatabase();
  const images: NewsletterMediaRecord[] = [];
  for (const id of ids) {
    const record = await getNewsletterMediaRecord(id, 'image');
    if (visualIds.has(id) && visualIds.get(id) !== record.assetKey) throw new Error('The selected image does not match its Media Library reference.');
    await verifyNewsletterMedia(record);
    images.push(record);
    manifest.images.push({ id, assetKey: record.assetKey, sha256: record.sha256 });
    // Canonicalize only the image source, retaining the site's existing origin token.
    htmlBody = htmlBody.replace(new RegExp(`(?:https?:\/\/[^\\s"'<>]+)?\/api\/newsletter\/media\/${id}`, 'g'), (match, offset: number) => {
      return htmlBody.slice(Math.max(0, offset - 10), offset).endsWith('{{appUrl}}') ? match : imageUrl(id);
    });
  }
  let totalBytes = 0;
  for (const assetKey of keys) {
    const { asset, bytes } = await resolveNewsletterSource(assetKey);
    const attachment = await validateNewsletterAttachment(bytes, asset.name);
    totalBytes += attachment.size;
    if (totalBytes > NEWSLETTER_ATTACHMENT_BYTES) throw new Error('Attachments must total no more than 5 MiB.');
    const sha256 = mediaChecksum(attachment.bytes);
    const id = mediaId(ownerSite, 'attachment-v1', input.campaignId || 'temporary', assetKey, sha256);
    const record = await storeNewsletterMedia({
      id, ownerSite, kind: 'attachment', assetKey, bucket: asset.bucket,
      storageKey: `newsletter-private/${ownerSite}/${id}`, sha256,
      name: attachment.name, mime: attachment.mime, size: attachment.size,
      campaignId: input.campaignId,
      ...(input.campaignId ? {} : { expiresAt: new Date(Date.now() + NEWSLETTER_RETENTION_MS) }),
    }, attachment.bytes);
    if (input.campaignId) {
      const result = await NewsletterMedia.updateOne({ id, deletingAt: null }, { $unset: { expiresAt: '' } });
      if (!result.matchedCount) throw new Error('The attachment is being cleaned up. Try preparing the campaign again.');
    }
    manifest.attachments.push({ id, assetKey, sha256, name: record.name, mime: record.mime, size: record.size });
    attachments.push({ Name: record.name, ContentType: record.mime, Content: attachment.bytes.toString('base64'), ContentID: null });
  }
  await retainImages(images, Boolean(input.campaignId));
  assertNewsletterMessageSize({ htmlBody, textBody: '', attachments });
  return { htmlBody, attachments, manifest };
}

export async function loadNewsletterMedia(manifest: NewsletterMediaManifest) {
  if (manifest?.version !== 1 || !Array.isArray(manifest.images) || !Array.isArray(manifest.attachments)) throw new Error('Unsupported newsletter media manifest.');
  const attachments: NewsletterPreparedAttachment[] = [];
  let totalBytes = 0;
  normalizeAttachmentKeys(manifest.attachments);
  for (const [kind, entries] of [['image', manifest.images], ['attachment', manifest.attachments]] as const) {
    for (const item of entries) {
      const record = await getNewsletterMediaRecord(item.id, kind);
      if (record.sha256 !== item.sha256 || record.assetKey !== item.assetKey) throw new Error('A frozen newsletter media reference has changed.');
      const bytes = await verifyNewsletterMedia(record);
      if (kind === 'attachment') {
        totalBytes += bytes.length;
        if (totalBytes > NEWSLETTER_ATTACHMENT_BYTES) throw new Error('Attachments must total no more than 5 MiB.');
        attachments.push({ Name: record.name, ContentType: record.mime, Content: bytes.toString('base64'), ContentID: null });
      }
    }
  }
  return { attachments };
}
