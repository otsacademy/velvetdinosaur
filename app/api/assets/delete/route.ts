import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getR2Client } from '@/lib/r2';
import { Asset } from '@/models/Asset';

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

  const records = (await Asset.find({ key: { $in: keys } })
    .select({ key: 1, bucket: 1 })
    .lean()
    .exec()) as unknown as Array<{ key: string; bucket?: string }>;

  const bucketByKey = new Map<string, string>();
  for (const record of records) {
    if (record?.key) {
      bucketByKey.set(record.key, record.bucket || defaultBucket);
    }
  }

  const client = getR2Client();
  const results: Array<{ key: string; ok: boolean; error?: string }> = [];
  const keysToRemoveFromDb = new Set<string>();
  for (const key of keys) {
    const bucket = bucketByKey.get(key) || defaultBucket;
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      keysToRemoveFromDb.add(key);
      results.push({ key, ok: true });
    } catch (error) {
      if (isNotFoundError(error)) {
        keysToRemoveFromDb.add(key);
        results.push({ key, ok: true });
        continue;
      }
      const message = error instanceof Error ? error.message : 'Delete failed';
      results.push({ key, ok: false, error: message });
    }
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
