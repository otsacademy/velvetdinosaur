import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getR2Client } from '@/lib/r2';
import { Asset } from '@/models/Asset';
import { collectAssetStorageKeys, type AssetStorageRecord } from '@/lib/assets/image-variants';
import { deleteAssetObjects } from '@/lib/assets/trash.server';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};
type DeleteMode = 'trash' | 'purge';

function normalizeKeys(input: unknown): string[] {
  const keys = Array.isArray(input) ? input : typeof input === 'string' ? [input] : [];
  return keys
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().replace(/\\/g, '/'))
    .filter((value) => value.startsWith('uploads/'));
}

function normalizeMode(input: unknown): DeleteMode {
  if (input === 'purge') return 'purge';
  return 'trash';
}

export async function POST(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = (await request.json().catch(() => null)) as
    | { key?: unknown; keys?: unknown; mode?: unknown; emptyTrash?: unknown }
    | null;
  const mode = normalizeMode(body?.mode);
  const emptyTrash = body?.emptyTrash === true;
  if (emptyTrash && mode !== 'purge') {
    return NextResponse.json({ error: 'emptyTrash requires purge mode' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const defaultBucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  if (!defaultBucket) {
    return NextResponse.json({ error: 'R2_BUCKET not set' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  let keys = normalizeKeys(body?.keys ?? body?.key);
  if (emptyTrash) {
    keys = (
      (await Asset.find({ deletedAt: { $exists: true, $ne: null } })
        .select({ key: 1 })
        .lean()
        .exec()) as unknown as Array<{ key?: string }>
    )
      .map((item) => (typeof item.key === 'string' ? item.key : ''))
      .filter(Boolean);
    if (!keys.length) {
      return NextResponse.json({ ok: true, results: [] }, { headers: NO_STORE_HEADERS });
    }
  } else if (!keys.length) {
    return NextResponse.json({ error: 'No keys provided' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  if (mode === 'trash') {
    const found = (
      (await Asset.find({ key: { $in: keys } })
        .select({ key: 1 })
        .lean()
        .exec()) as unknown as Array<{ key?: string }>
    )
      .map((item) => (typeof item.key === 'string' ? item.key : ''))
      .filter(Boolean);
    const foundSet = new Set(found);
    const sessionUserId = (session as { user?: { id?: string } }).user?.id?.trim();
    await Asset.updateMany(
      { key: { $in: keys } },
      {
        $set: {
          deletedAt: new Date(),
          ...(sessionUserId ? { deletedBy: sessionUserId } : {})
        }
      }
    ).exec();
    const results = keys.map((key) => (foundSet.has(key) ? { key, ok: true } : { key, ok: false, error: 'Not found' }));
    const failed = results.filter((item) => !item.ok);
    if (failed.length) {
      return NextResponse.json({ ok: false, results }, { status: 207, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ ok: true, results }, { headers: NO_STORE_HEADERS });
  }

  type PurgeRecord = AssetStorageRecord & { key: string; bucket?: string };
  const records = (await Asset.find({ key: { $in: keys } })
    .select({ key: 1, bucket: 1, originalKey: 1, fallbackKey: 1, variants: 1 })
    .lean()
    .exec()) as unknown as PurgeRecord[];

  const recordByKey = new Map<string, PurgeRecord>();
  for (const record of records) {
    if (record?.key) recordByKey.set(record.key, record);
  }

  const client = getR2Client();
  const results: Array<{ key: string; ok: boolean; error?: string; removedObjects?: number }> = [];
  const keysToRemoveFromDb = new Set<string>();
  for (const key of keys) {
    const record = recordByKey.get(key);
    const bucket = record?.bucket || defaultBucket;
    // Purge everything the record owns (public key, private original, every
    // rendered variant). Deleting only the public key left the rest in storage.
    const storageKeys = record ? collectAssetStorageKeys(record) : [key];
    if (!storageKeys.includes(key)) storageKeys.unshift(key);
    const outcome = await deleteAssetObjects({ client, bucket, keys: storageKeys });
    if (outcome.failed.length) {
      // Keep the record so the purge can be retried for the objects that remain.
      results.push({
        key,
        ok: false,
        error: outcome.failed.map((failure) => `${failure.key}: ${failure.reason}`).join('; '),
        removedObjects: outcome.deleted.length
      });
      continue;
    }
    keysToRemoveFromDb.add(key);
    results.push({ key, ok: true, removedObjects: outcome.deleted.length });
  }

  if (keysToRemoveFromDb.size > 0) {
    await Asset.deleteMany({ key: { $in: Array.from(keysToRemoveFromDb) } }).exec();
  }

  const failed = results.filter((item) => !item.ok);
  if (failed.length) {
    return NextResponse.json({ ok: false, results }, { status: 207, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ ok: true, results }, { headers: NO_STORE_HEADERS });
}
