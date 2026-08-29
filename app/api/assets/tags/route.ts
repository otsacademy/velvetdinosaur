import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';
import { isAssetLiveCaptureAllowed } from '@/lib/security/asset-live-capture';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

type AssetStatus = 'active' | 'trashed' | 'all';

function normalizeStatus(value: string | null): AssetStatus {
  if (value === 'trashed') return 'trashed';
  if (value === 'all') return 'all';
  return 'active';
}

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    if (isEditorSmokeRequest(request.headers)) {
      return NextResponse.json({ items: [] }, { headers: NO_STORE_HEADERS });
    }
    const isLiveCapture = await isAssetLiveCaptureAllowed(request);
    if (!isLiveCapture) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const url = new URL(request.url);
  const status = normalizeStatus(url.searchParams.get('status'));
  const folder = (url.searchParams.get('folder') || '').trim();

  const clauses: Record<string, unknown>[] = [];
  if (status === 'active') {
    clauses.push({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
    });
  } else if (status === 'trashed') {
    clauses.push({
      deletedAt: { $exists: true, $ne: null }
    });
  }
  if (folder) {
    clauses.push({ folder });
  } else if (url.searchParams.has('folder')) {
    clauses.push({
      $or: [{ folder: { $exists: false } }, { folder: null }, { folder: '' }]
    });
  }

  const matchStage = clauses.length <= 1 ? clauses[0] || {} : { $and: clauses };

  const rows = (await Asset.aggregate([
    { $match: matchStage },
    { $project: { tags: { $ifNull: ['$tags', []] } } },
    { $unwind: '$tags' },
    { $match: { tags: { $type: 'string', $ne: '' } } },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 200 }
  ])) as Array<{ _id?: string; count?: number }>;

  return NextResponse.json(
    {
      items: rows
        .map((row) => ({
          tag: typeof row._id === 'string' ? row._id : '',
          count: typeof row.count === 'number' ? row.count : 0
        }))
        .filter((row) => row.tag)
    },
    { headers: NO_STORE_HEADERS }
  );
}
