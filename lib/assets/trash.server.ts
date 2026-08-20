import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { connectDB } from '@/lib/db';
import { getR2Client } from '@/lib/r2';
import { Asset } from '@/models/Asset';

const DAY_MS = 24 * 60 * 60 * 1000;

type TrashAssetRecord = {
  key: string;
  bucket?: string;
  deletedAt?: Date | null;
};

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
    .select({ key: 1, bucket: 1, deletedAt: 1 })
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
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      keysToRemoveFromDb.add(key);
      results.push({ key, status: 'purged' });
    } catch (error) {
      if (isNotFoundError(error)) {
        keysToRemoveFromDb.add(key);
        results.push({ key, status: 'purged' });
        continue;
      }
      const reason = error instanceof Error ? error.message : 'Delete failed';
      results.push({ key, status: 'failed', reason });
    }
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
