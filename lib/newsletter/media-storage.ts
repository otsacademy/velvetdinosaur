import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { assertServerOnly } from '@/lib/_server/guard';
import { connectDB } from '@/lib/db';
import { getR2Client } from '@/lib/r2';
import { assetOwnerSite, isTrustedAsset } from '@/lib/assets/ownership.server';
import { isOriginalKeyOf } from '@/lib/assets/image-variants';
import { Asset } from '@/models/Asset';
import { NewsletterMedia } from '@/models/NewsletterMedia';
import { mediaChecksum, NEWSLETTER_SOURCE_BYTES, normalizeMediaAssetKey } from './media-validation';
import { decryptNewsletterAttachment, encryptNewsletterAttachment } from './media-crypto';
assertServerOnly('lib/newsletter/media-storage.ts');

export type NewsletterMediaRecord = {
  id: string; ownerSite: string; kind: 'image' | 'attachment'; assetKey: string;
  bucket: string; storageKey: string; sha256: string; name: string; mime: string;
  size: number; width?: number; height?: number; campaignId?: string;
  expiresAt?: Date; deletingAt?: Date;
  retained?: boolean; ready?: boolean; writingUntil?: Date;
};

export async function requireMediaDatabase() {
  if (!await connectDB()) throw new Error('The Media Library database is unavailable.');
  return assetOwnerSite();
}

export async function readMediaBytes(bucket: string, key: string, limit = NEWSLETTER_SOURCE_BYTES, timeoutMs = 60_000) {
  const client = getR2Client();
  const controller = new AbortController();
  const timeoutError = new Error('Reading the newsletter file timed out. Try again.');
  let body: (AsyncIterable<Uint8Array> & { destroy?: () => void }) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let completed = false;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(timeoutError), timeoutMs);
  });
  const read = async () => {
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: controller.signal });
    body = object.Body as typeof body;
    // A late response still needs cleanup if the SDK did not honor cancellation.
    if (controller.signal.aborted) { body?.destroy?.(); throw timeoutError; }
    if (!body || (object.ContentLength != null && object.ContentLength > limit)) throw new Error('The selected file is missing or too large.');
    const chunks: Buffer[] = [];
    let size = 0;
    // Enforce the deadline through the entire stream, not just response headers.
    for await (const chunk of body) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > limit) throw new Error('The selected file is too large.');
      chunks.push(bytes);
    }
    if (!size) throw new Error('The selected file is empty.');
    return Buffer.concat(chunks);
  };
  try {
    const bytes = await Promise.race([read(), deadline]);
    completed = true;
    return bytes;
  } finally {
    clearTimeout(timer);
    if (!completed) controller.abort();
    body?.destroy?.();
    client.destroy();
  }
}

export async function resolveNewsletterSource(assetKey: string) {
  normalizeMediaAssetKey(assetKey);
  const ownerSite = await requireMediaDatabase();
  const asset = await Asset.findOne({ key: assetKey, deletedAt: null }).lean().exec() as {
    key: string; bucket: string; ownerSite?: string; ownershipSource?: string;
    originalKey?: string; originalMime?: string; name?: string; alt?: string; caption?: string;
  } | null;
  if (!asset || !isTrustedAsset(asset, ownerSite)) {
    throw new Error('This file has no verified ownership in this site’s Media Library. Upload it again or ask an administrator to review its legacy ownership.');
  }
  if (asset.originalKey && !isOriginalKeyOf(asset.key, asset.originalKey)) throw new Error('This file’s original does not match its verified Media Library record.');
  const key = asset.originalKey || asset.key;
  return { asset, ownerSite, bytes: await readMediaBytes(asset.bucket, key) };
}

export async function storeNewsletterMedia(record: NewsletterMediaRecord, bytes: Buffer) {
  // The intent must exist before any object write. A crash on either side of
  // PUT leaves a discoverable pending record that retries or cleanup can resume.
  await NewsletterMedia.updateOne({ id: record.id, ownerSite: record.ownerSite }, {
    $setOnInsert: { ...record, ready: false },
  }, { upsert: true });
  const existing = await NewsletterMedia.findOne({ id: record.id, ownerSite: record.ownerSite }).lean().exec() as NewsletterMediaRecord | null;
  if (!existing || existing.deletingAt) throw new Error('This media is being cleaned up. Select it again after cleanup finishes.');
  const writingUntil = new Date(Date.now() + 15 * 60 * 1000);
  const claimed = await NewsletterMedia.updateOne({ id: record.id, deletingAt: null }, {
    $set: { writingUntil },
    ...(!existing.retained && record.expiresAt ? { $max: { expiresAt: record.expiresAt } } : {}),
  });
  if (!claimed.matchedCount) throw new Error('This media is being cleaned up. Please select it again.');
  if (existing.ready) await verifyNewsletterMedia(existing);
  else {
    const storedBytes = record.kind === 'attachment' ? encryptNewsletterAttachment(bytes, record.id) : bytes;
    try {
      await getR2Client().send(new PutObjectCommand({
        Bucket: record.bucket, Key: record.storageKey, Body: storedBytes,
        ContentType: record.kind === 'attachment' ? 'application/octet-stream' : record.mime,
        CacheControl: record.kind === 'image' ? 'public, max-age=31536000, immutable' : 'private, no-store',
        IfNoneMatch: '*',
      }));
    } catch (error) {
      // A simultaneous preparation may have already written these exact bytes.
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 412) throw error;
      const raw = await readMediaBytes(record.bucket, record.storageKey);
      const stored = record.kind === 'attachment' ? decryptNewsletterAttachment(raw, record.id) : raw;
      if (mediaChecksum(stored) !== record.sha256) throw new Error('The immutable media checksum did not match.');
    }
  }
  const ready = await NewsletterMedia.updateOne({ id: record.id, deletingAt: null }, { $set: { ready: true } });
  if (!ready.matchedCount) throw new Error('Media preparation was interrupted. Please try again.');
  // Do not clear a lease acquired by a concurrent preparation.
  await NewsletterMedia.updateOne({ id: record.id, writingUntil }, { $unset: { writingUntil: '' } });
  return { ...existing, ready: true };
}

export async function getNewsletterMediaRecord(id: string, kind: 'image' | 'attachment') {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid newsletter media reference.');
  const ownerSite = await requireMediaDatabase();
  const record = await NewsletterMedia.findOne({ id, ownerSite, kind, ready: true, deletingAt: null }).lean().exec() as NewsletterMediaRecord | null;
  if (!record) throw new Error('A required newsletter file is unavailable. Select the file again.');
  return record;
}

export async function verifyNewsletterMedia(record: NewsletterMediaRecord) {
  const raw = await readMediaBytes(record.bucket, record.storageKey);
  const bytes = record.kind === 'attachment' ? decryptNewsletterAttachment(raw, record.id) : raw;
  if (bytes.length !== record.size || mediaChecksum(bytes) !== record.sha256) {
    throw new Error(`The frozen newsletter file “${record.name}” is missing or has changed. Delivery was stopped.`);
  }
  return bytes;
}
