import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';
import { normalizeAssetTags } from '@/lib/assets/tags';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';
import { isAssetLiveCaptureAllowed } from '@/lib/security/asset-live-capture';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

function normalizeLimit(value: string | null) {
  const parsed = Number(value || '');
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(Math.max(parsed, 1), 100);
}

type SortMode = 'newest' | 'oldest';
type AssetStatus = 'active' | 'trashed' | 'all';
type MissingFilter = 'none' | 'caption' | 'alt' | 'metadata';

function normalizeSort(value: string | null): SortMode {
  if (value === 'oldest') return 'oldest';
  return 'newest';
}

function normalizeStatus(value: string | null): AssetStatus {
  if (value === 'trashed') return 'trashed';
  if (value === 'all') return 'all';
  return 'active';
}

function normalizeMissing(value: string | null): MissingFilter {
  if (value === 'caption') return 'caption';
  if (value === 'alt') return 'alt';
  if (value === 'metadata') return 'metadata';
  return 'none';
}

function missingTextClause(field: 'caption' | 'alt') {
  return {
    $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: '' }]
  };
}

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const isSmoke = isEditorSmokeRequest(request.headers);
  if (!session) {
    if (isSmoke) {
      return NextResponse.json({ items: [], nextCursor: null }, { headers: NO_STORE_HEADERS });
    }
    const isLiveCapture = await isAssetLiveCaptureAllowed(request);
    if (!isLiveCapture) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const mimePrefix = (url.searchParams.get('mimePrefix') || '').trim();
  const folder = (url.searchParams.get('folder') || '').trim();
  const tag = normalizeAssetTags(url.searchParams.get('tag') || '')[0];
  const limit = normalizeLimit(url.searchParams.get('limit'));
  const sort = normalizeSort(url.searchParams.get('sort'));
  const status = normalizeStatus(url.searchParams.get('status'));
  const missing = normalizeMissing(url.searchParams.get('missing'));
  const cursor = url.searchParams.get('cursor');

  const conn = await connectDB();
  if (!conn) {
    if (isSmoke) {
      return NextResponse.json({ items: [], nextCursor: null }, { headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  type AssetQuery = Record<string, unknown>;
  const baseClauses: AssetQuery[] = [];
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    baseClauses.push({
      $or: [
        { key: { $regex: safe, $options: 'i' } },
        { name: { $regex: safe, $options: 'i' } },
        { caption: { $regex: safe, $options: 'i' } },
        { tags: { $regex: safe, $options: 'i' } }
      ]
    });
  }
  if (mimePrefix) {
    baseClauses.push({
      mime: { $regex: `^${mimePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' }
    });
  }
  if (status === 'active') {
    baseClauses.push({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
    });
  } else if (status === 'trashed') {
    baseClauses.push({
      deletedAt: { $exists: true, $ne: null }
    });
  }
  if (folder) {
    baseClauses.push({ folder });
  } else if (url.searchParams.has('folder')) {
    // Explicit root request: include docs with undefined folder for backwards compatibility.
    baseClauses.push({
      $or: [{ folder: { $exists: false } }, { folder: null }, { folder: '' }]
    });
  }
  if (tag) {
    baseClauses.push({ tags: tag });
  }
  if (missing === 'caption') {
    baseClauses.push(missingTextClause('caption'));
  } else if (missing === 'alt') {
    baseClauses.push(missingTextClause('alt'));
  } else if (missing === 'metadata') {
    baseClauses.push({
      $or: [missingTextClause('caption'), missingTextClause('alt')]
    });
  }
  const clauses: AssetQuery[] = [...baseClauses];
  if (cursor) {
    clauses.push({
      _id: sort === 'oldest' ? { $gt: cursor } : { $lt: cursor }
    });
  }
  const query: AssetQuery = clauses.length <= 1 ? clauses[0] || {} : { $and: clauses };
  const totalQuery: AssetQuery = baseClauses.length <= 1 ? baseClauses[0] || {} : { $and: baseClauses };

  type AssetSummary = {
    _id: string;
    key: string;
    name?: string;
    caption?: string;
    alt?: string;
    altSource?: 'manual' | 'auto' | null;
    altGeneratedAt?: Date | null;
    altModel?: string | null;
    altNeedsReview?: boolean;
    tags?: string[];
    folder?: string;
    bucket?: string;
    mime?: string;
    size?: number;
    etag?: string;
    originalKey?: string;
    originalMime?: string;
    originalSize?: number;
    optimizedSize?: number;
    processingStatus?: 'pending' | 'processed' | 'passthrough' | 'failed';
    processedAt?: Date;
    fallbackKey?: string;
    variants?: unknown;
    width?: number;
    height?: number;
    focalX?: number;
    focalY?: number;
    focalSetAt?: Date;
    focalSetBy?: string;
    deletedAt?: Date | null;
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
      altSource: 1,
      altGeneratedAt: 1,
      altModel: 1,
      altNeedsReview: 1,
      tags: 1,
      folder: 1,
      bucket: 1,
      mime: 1,
      size: 1,
      etag: 1,
      originalKey: 1,
      originalMime: 1,
      originalSize: 1,
      optimizedSize: 1,
      processingStatus: 1,
      processedAt: 1,
      fallbackKey: 1,
      variants: 1,
      width: 1,
      height: 1,
      focalX: 1,
      focalY: 1,
      focalSetAt: 1,
      focalSetBy: 1,
      deletedAt: 1,
      createdAt: 1
    })
    .lean()
    .exec()) as unknown as AssetSummary[];
  const total = await Asset.countDocuments(totalQuery).exec();

  const nextCursor = items.length === limit ? String(items[items.length - 1]._id) : null;

  return NextResponse.json(
    {
      items: items.map((asset) => ({
        key: asset.key,
        name: asset.name,
        caption: asset.caption,
        alt: asset.alt,
        altSource: asset.altSource,
        altGeneratedAt: asset.altGeneratedAt,
        altModel: asset.altModel,
        altNeedsReview: asset.altNeedsReview,
        tags: asset.tags,
        folder: asset.folder,
        mime: asset.mime,
        size: asset.size,
        originalKey: asset.originalKey,
        originalMime: asset.originalMime,
        originalSize: asset.originalSize,
        optimizedSize: asset.optimizedSize,
        processingStatus: asset.processingStatus,
        processedAt: asset.processedAt,
        fallbackKey: asset.fallbackKey,
        variants: asset.variants,
        width: asset.width,
        height: asset.height,
        focalX: asset.focalX,
        focalY: asset.focalY,
        focalSetAt: asset.focalSetAt,
        focalSetBy: asset.focalSetBy,
        deletedAt: asset.deletedAt,
        createdAt: asset.createdAt
      })),
      nextCursor,
      sort,
      status,
      total
    },
    { headers: NO_STORE_HEADERS }
  );
}
