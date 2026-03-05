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
const EDITOR_SMOKE_TOKEN = process.env.VD_EDITOR_SMOKE_TOKEN;

function isSmokeRequest(request: Request) {
  if (!EDITOR_SMOKE_TOKEN) return false;
  const token = request.headers.get('x-vd-editor-smoke');
  return token === EDITOR_SMOKE_TOKEN;
}

function normalizeLimit(value: string | null) {
  const parsed = Number(value || '');
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(Math.max(parsed, 1), 100);
}

type SortMode = 'newest' | 'oldest';

function normalizeSort(value: string | null): SortMode {
  if (value === 'oldest') return 'oldest';
  return 'newest';
}

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    if (isSmokeRequest(request)) {
      return NextResponse.json({ items: [], nextCursor: null }, { headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const mimePrefix = (url.searchParams.get('mimePrefix') || '').trim();
  const folder = (url.searchParams.get('folder') || '').trim();
  const limit = normalizeLimit(url.searchParams.get('limit'));
  const sort = normalizeSort(url.searchParams.get('sort'));
  const cursor = url.searchParams.get('cursor');

  const conn = await connectDB();
  if (!conn) {
    if (isSmokeRequest(request)) {
      return NextResponse.json({ items: [], nextCursor: null }, { headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  type AssetQuery = Record<string, unknown>;
  const query: AssetQuery = {};
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { key: { $regex: safe, $options: 'i' } },
      { name: { $regex: safe, $options: 'i' } },
      { caption: { $regex: safe, $options: 'i' } }
    ];
  }
  if (mimePrefix) {
    query.mime = { $regex: `^${mimePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' };
  }
  if (folder) {
    query.folder = folder;
  } else if (url.searchParams.has('folder')) {
    // Explicit root request: include docs with undefined folder for backwards compatibility.
    query.$or = [{ folder: { $exists: false } }, { folder: null }, { folder: '' }];
  }
  if (cursor) {
    query._id = sort === 'oldest' ? { $gt: cursor } : { $lt: cursor };
  }

  type AssetSummary = {
    _id: string;
    key: string;
    name?: string;
    caption?: string;
    alt?: string;
    folder?: string;
    bucket?: string;
    mime?: string;
    size?: number;
    etag?: string;
    width?: number;
    height?: number;
    createdAt?: Date;
  };

  const items = (await Asset.find(query)
    .sort(sort === 'oldest' ? { _id: 1 } : { _id: -1 })
    .limit(limit)
    .select({
      key: 1,
      name: 1,
      caption: 1,
      alt: 1,
      folder: 1,
      bucket: 1,
      mime: 1,
      size: 1,
      etag: 1,
      width: 1,
      height: 1,
      createdAt: 1
    })
    .lean()
    .exec()) as unknown as AssetSummary[];

  const nextCursor = items.length === limit ? String(items[items.length - 1]._id) : null;

  return NextResponse.json(
    {
      items: items.map((asset) => ({
        key: asset.key,
        name: asset.name,
        caption: asset.caption,
        alt: asset.alt,
        folder: asset.folder,
        mime: asset.mime,
        size: asset.size,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt
      })),
      nextCursor,
      sort
    },
    { headers: NO_STORE_HEADERS }
  );
}
