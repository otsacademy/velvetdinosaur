import { DeleteObjectsCommand, ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';
import { connectDB } from '@/lib/db';
import { getR2Client } from '@/lib/r2';
import { Asset } from '@/models/Asset';
import {
  collectAssetStorageKeys,
  isOriginalKeyOf,
  originalKeyStem,
  type AssetStorageRecord
} from '@/lib/assets/image-variants';

const DAY_MS = 24 * 60 * 60 * 1000;

type TrashAssetRecord = AssetStorageRecord & {
  key: string;
  bucket?: string;
  deletedAt?: Date | null;
};

const DELETE_BATCH_SIZE = 1000;

export type DeleteAssetObjectsResult = {
  deleted: string[];
  missing: string[];
  failed: Array<{ key: string; reason: string }>;
};

/**
 * Deletes every key from the bucket in DeleteObjects batches. Objects that no
 * longer exist count as success; each failure is reported per key so callers
 * can keep the database record (and retry) when storage is only partly cleared.
 */
export async function deleteAssetObjects(input: {
  client: S3Client;
  bucket: string;
  keys: string[];
}): Promise<DeleteAssetObjectsResult> {
  const result: DeleteAssetObjectsResult = { deleted: [], missing: [], failed: [] };
  const keys = Array.from(new Set(input.keys.filter((key) => typeof key === 'string' && key.length > 0)));
  for (let index = 0; index < keys.length; index += DELETE_BATCH_SIZE) {
    const batch = keys.slice(index, index + DELETE_BATCH_SIZE);
    try {
      const response = await input.client.send(
        new DeleteObjectsCommand({
          Bucket: input.bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: false }
        })
      );
      const failures = new Map<string, string>();
      for (const error of response.Errors || []) {
        if (!error.Key) continue;
        const code = error.Code || '';
        if (code === 'NoSuchKey' || code === 'NotFound') {
          result.missing.push(error.Key);
          continue;
        }
        failures.set(error.Key, error.Message || code || 'Delete failed');
      }
      for (const key of batch) {
        const reason = failures.get(key);
        if (reason) result.failed.push({ key, reason });
        else if (!result.missing.includes(key)) result.deleted.push(key);
      }
    } catch (error) {
      if (isNotFoundError(error)) {
        result.missing.push(...batch);
        continue;
      }
      const reason = error instanceof Error ? error.message : 'Delete failed';
      for (const key of batch) result.failed.push({ key, reason });
    }
  }
  return result;
}

/**
 * The private originals stored for a public upload, found by listing the
 * original's stem. Needed for every record created before `originalKey` was
 * persisted (the Asset schema did not declare it until Sep 2026) and for
 * `--replace-<timestamp>` originals the replace route leaves behind.
 */
export async function listStoredOriginalKeys(input: {
  client: S3Client;
  bucket: string;
  publicKey: string;
}): Promise<string[]> {
  const stem = originalKeyStem(input.publicKey);
  if (!stem) return [];
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const page = await input.client.send(
      new ListObjectsV2Command({ Bucket: input.bucket, Prefix: stem, ContinuationToken: token })
    );
    for (const object of page.Contents || []) {
      if (object.Key && isOriginalKeyOf(input.publicKey, object.Key)) keys.push(object.Key);
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/**
 * Every storage object a purge must remove for a record: the keys the record
 * knows about plus the private originals found by stem. A listing failure is
 * reported so the caller keeps the record (and the purge stays retryable)
 * instead of silently leaving the original behind.
 */
export async function collectPurgeKeys(input: {
  client: S3Client;
  bucket: string;
  record: AssetStorageRecord & { key: string };
}): Promise<{ keys: string[]; error?: string }> {
  const keys = collectAssetStorageKeys(input.record);
  if (!keys.includes(input.record.key)) keys.unshift(input.record.key);
  try {
    for (const key of await listStoredOriginalKeys({
      client: input.client,
      bucket: input.bucket,
      publicKey: input.record.key
    })) {
      if (!keys.includes(key)) keys.push(key);
    }
    return { keys };
  } catch (error) {
    if (isNotFoundError(error)) return { keys };
    return { keys, error: error instanceof Error ? error.message : 'Listing originals failed' };
  }
}

function isNotFoundError(error: unknown) {
  const status =
    typeof error === 'object' && error !== null
      ? ((error as { $metadata?: { httpStatusCode?: unknown } }).$metadata?.httpStatusCode as unknown)
      : undefined;
  if (status === 404 || status === '404') return true;
  const rawCode =
    typeof error === 'object' && error !== null
      ? ((error as { Code?: unknown; code?: unknown; name?: unknown }).Code ??
          (error as { code?: unknown }).code ??
          (error as { name?: unknown }).name)
      : undefined;
  const code = typeof rawCode === 'string' ? rawCode : '';
  return code === 'NotFound' || code === 'NoSuchKey' || code === 'NoSuchBucket';
}

function normalizePositiveInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

export type PurgeExpiredTrashedAssetsOptions = {
  retentionDays?: unknown;
  dryRun?: boolean;
  limit?: unknown;
  now?: Date;
};

export type PurgeExpiredTrashedAssetsSummary = {
  dryRun: boolean;
  retentionDays: number;
  limit: number;
  cutoff: string;
  checked: number;
  purged: number;
  failed: number;
  results: Array<{ key: string; status: 'would-purge' | 'purged' | 'failed'; reason?: string }>;
};

export async function purgeExpiredTrashedAssets(
  options: PurgeExpiredTrashedAssetsOptions = {}
): Promise<PurgeExpiredTrashedAssetsSummary> {
  const now = options.now instanceof Date ? options.now : new Date();
  const retentionDays = normalizePositiveInt(options.retentionDays, 30, 1, 3650);
  const limit = normalizePositiveInt(options.limit, 500, 1, 5000);
  const dryRun = options.dryRun === true;
  const cutoff = new Date(now.getTime() - retentionDays * DAY_MS);

  const conn = await connectDB();
  if (!conn) {
    throw new Error('Database unavailable');
  }

  const records = (await Asset.find({
    key: { $regex: '^uploads/' },
    deletedAt: { $exists: true, $ne: null, $lte: cutoff }
  })
    .sort({ deletedAt: 1 })
    .limit(limit)
    .select({ key: 1, bucket: 1, originalKey: 1, fallbackKey: 1, variants: 1, deletedAt: 1 })
    .lean()
    .exec()) as unknown as TrashAssetRecord[];

  if (dryRun) {
    return {
      dryRun: true,
      retentionDays,
      limit,
      cutoff: cutoff.toISOString(),
      checked: records.length,
      purged: records.length,
      failed: 0,
      results: records.map((record) => ({ key: record.key, status: 'would-purge' as const }))
    };
  }

  const defaultBucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  const client = getR2Client();
  const keysToRemoveFromDb = new Set<string>();
  const results: Array<{ key: string; status: 'purged' | 'failed'; reason?: string }> = [];

  for (const record of records) {
    const key = record.key;
    const bucket = record.bucket || defaultBucket;
    if (!bucket) {
      results.push({ key, status: 'failed', reason: 'Missing bucket configuration' });
      continue;
    }
    // Purge the public key, the private original(s) and every rendered variant —
    // not just the public key, which left originals and thumbnails behind.
    const { keys: storageKeys, error: listError } = await collectPurgeKeys({ client, bucket, record });
    if (listError) {
      results.push({ key, status: 'failed', reason: `listing originals: ${listError}` });
      continue;
    }
    const outcome = await deleteAssetObjects({ client, bucket, keys: storageKeys });
    if (outcome.failed.length) {
      results.push({
        key,
        status: 'failed',
        reason: outcome.failed.map((failure) => `${failure.key}: ${failure.reason}`).join('; ')
      });
      continue;
    }
    keysToRemoveFromDb.add(key);
    results.push({ key, status: 'purged' });
  }

  if (keysToRemoveFromDb.size > 0) {
    await Asset.deleteMany({ key: { $in: Array.from(keysToRemoveFromDb) } }).exec();
  }

  const failed = results.filter((result) => result.status === 'failed').length;
  const purged = results.length - failed;

  return {
    dryRun: false,
    retentionDays,
    limit,
    cutoff: cutoff.toISOString(),
    checked: records.length,
    purged,
    failed,
    results
  };
}
