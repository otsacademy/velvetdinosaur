import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
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

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const found = (
    (await Asset.find({ key: { $in: keys } })
      .select({ key: 1 })
      .lean()
      .exec()) as unknown as Array<{ key?: string }>
  )
    .map((item) => (typeof item.key === 'string' ? item.key : ''))
    .filter(Boolean);
  const foundSet = new Set(found);

  await Asset.updateMany(
    { key: { $in: keys } },
    {
      $unset: {
        deletedAt: '',
        deletedBy: ''
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
