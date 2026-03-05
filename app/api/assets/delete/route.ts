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

function normalizeKeys(input: unknown): string[] {
  const keys = Array.isArray(input) ? input : typeof input === 'string' ? [input] : [];
  return keys
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().replace(/\\/g, '/'))
    .filter((value) => value.startsWith('uploads/'));
}

export async function POST(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = (await request.json().catch(() => null)) as { key?: unknown; keys?: unknown } | null;
  const keys = normalizeKeys(body?.keys ?? body?.key);
  if (!keys.length) {
    return NextResponse.json({ error: 'No keys provided' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const defaultBucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  if (!defaultBucket) {
    return NextResponse.json({ error: 'R2_BUCKET not set' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
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
  for (const key of keys) {
    const bucket = bucketByKey.get(key) || defaultBucket;
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      results.push({ key, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      results.push({ key, ok: false, error: message });
    }
  }

  await Asset.deleteMany({ key: { $in: keys } }).exec();

  const failed = results.filter((item) => !item.ok);
  if (failed.length) {
    return NextResponse.json({ ok: false, results }, { status: 207, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ ok: true, results }, { headers: NO_STORE_HEADERS });
}
