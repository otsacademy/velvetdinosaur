import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AssetFolder } from '@/models/AssetFolder';
import { Asset } from '@/models/Asset';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';
import { isAssetLiveCaptureAllowed } from '@/lib/security/asset-live-capture';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

function slugifySegment(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  const slug = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
  return slug;
}

function normalizeFolderPath(input: string) {
  const raw = input.trim().replace(/\\/g, '/');
  const parts = raw
    .split('/')
    .map((part) => slugifySegment(part))
    .filter(Boolean);
  return parts.join('/');
}

const createSchema = z.object({
  path: z.string().min(1),
  label: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().min(1).max(240).optional()
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildActiveAssetClause() {
  return {
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
  };
}

type FolderItem = {
  path: string;
  label?: string;
  description?: string;
  count?: number;
};

type FolderCountRow = {
  _id?: string;
  count?: number;
};

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const isSmoke = isEditorSmokeRequest(request.headers);
  if (!session && !isSmoke) {
    const isLiveCapture = await isAssetLiveCaptureAllowed(request);
    if (!isLiveCapture) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }
  }

  const conn = await connectDB();
  if (!conn) {
    if (isSmoke) {
      return NextResponse.json({ items: [] }, { headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const explicitFolders = (await AssetFolder.find({})
    .sort({ path: 1 })
    .select({ path: 1, label: 1, description: 1 })
    .lean()
    .exec()) as unknown as Array<{ path: string; label?: string; description?: string }>;

  const impliedPaths = (
    await Asset.distinct('folder', {
      folder: { $exists: true, $ne: '' },
      ...buildActiveAssetClause()
    }).exec()
  ).filter((value) => typeof value === 'string' && value.trim()) as string[];

  const countRows = (await Asset.aggregate([
    {
      $match: {
        folder: { $exists: true, $type: 'string', $ne: '' },
        ...buildActiveAssetClause()
      }
    },
    {
      $group: {
        _id: '$folder',
        count: { $sum: 1 }
      }
    }
  ])) as FolderCountRow[];
  const countByPath = new Map(
    countRows
      .map((row) => [
        typeof row._id === 'string' ? row._id : '',
        typeof row.count === 'number' ? row.count : 0
      ] as const)
      .filter(([path]) => path)
  );

  const merged = new Map<string, FolderItem>();
  for (const folder of explicitFolders) {
    if (folder?.path) merged.set(folder.path, folder);
  }
  for (const path of impliedPaths) {
    if (!merged.has(path)) merged.set(path, { path });
  }

  const items = Array.from(merged.values())
    .map((folder) => ({
      path: folder.path,
      label: folder.label,
      description: folder.description,
      count: countByPath.get(folder.path) || 0
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return NextResponse.json({ items }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const isSmoke = isEditorSmokeRequest(request.headers);
  if (!session && !isSmoke) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  if (isSmoke && !session) {
    return NextResponse.json({ error: 'Smoke mode is read-only' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const path = normalizeFolderPath(parsed.data.path);
  if (!path) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const label = parsed.data.label?.trim() || undefined;
  const description = parsed.data.description?.trim() || undefined;

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const setPayload: { path: string; label?: string; description?: string } = { path };
  if (label) setPayload.label = label;
  if (description) setPayload.description = description;

  const folder = (await AssetFolder.findOneAndUpdate(
    { path },
    setPayload,
    { upsert: true, new: true }
  )
    .select({ path: 1, label: 1, description: 1 })
    .lean()
    .exec()) as { path: string; label?: string; description?: string } | null;

  const count = await Asset.countDocuments({
    folder: path,
    ...buildActiveAssetClause()
  }).exec();

  return NextResponse.json(
    {
      item: folder ? { ...folder, count } : folder
    },
    { headers: NO_STORE_HEADERS }
  );
}

const updateSchema = z.object({
  path: z.string().min(1),
  nextPath: z.string().min(1).optional(),
  label: z.string().trim().max(80).optional(),
  description: z.string().trim().max(240).optional()
});

export async function PATCH(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const isSmoke = isEditorSmokeRequest(request.headers);
  if (!session && !isSmoke) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  if (isSmoke && !session) {
    return NextResponse.json({ error: 'Smoke mode is read-only' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid folder update' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const currentPath = normalizeFolderPath(parsed.data.path);
  const nextPathRaw = typeof parsed.data.nextPath === 'string' ? normalizeFolderPath(parsed.data.nextPath) : currentPath;
  if (!currentPath || !nextPathRaw) {
    return NextResponse.json({ error: 'Invalid folder path' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const isRename = currentPath !== nextPathRaw;
  if (isRename) {
    const targetExists = await AssetFolder.exists({ path: nextPathRaw }).exec();
    if (targetExists) {
      return NextResponse.json({ error: 'Target folder already exists' }, { status: 409, headers: NO_STORE_HEADERS });
    }
    const prefixPattern = new RegExp(`^${escapeRegExp(currentPath)}(?:/|$)`);
    const assetRows = (await Asset.find({
      folder: { $regex: prefixPattern }
    })
      .select({ _id: 1, folder: 1 })
      .lean()
      .exec()) as Array<{ _id: string; folder?: string }>;
    if (assetRows.length) {
      await Asset.bulkWrite(
        assetRows
          .filter((row) => typeof row.folder === 'string')
          .map((row) => ({
            updateOne: {
              filter: { _id: row._id },
              update: {
                $set: {
                  folder:
                    row.folder === currentPath
                      ? nextPathRaw
                      : `${nextPathRaw}${row.folder!.slice(currentPath.length)}`
                }
              }
            }
          }))
      );
    }
    const folderRows = (await AssetFolder.find({
      path: { $regex: prefixPattern }
    })
      .select({ _id: 1, path: 1 })
      .lean()
      .exec()) as Array<{ _id: string; path?: string }>;
    if (folderRows.length) {
      await AssetFolder.bulkWrite(
        folderRows
          .filter((row) => typeof row.path === 'string')
          .map((row) => ({
            updateOne: {
              filter: { _id: row._id },
              update: {
                $set: {
                  path: row.path === currentPath ? nextPathRaw : `${nextPathRaw}${row.path!.slice(currentPath.length)}`
                }
              }
            }
          }))
      );
    }
  }

  const hasLabel = Object.prototype.hasOwnProperty.call(body ?? {}, 'label');
  const hasDescription = Object.prototype.hasOwnProperty.call(body ?? {}, 'description');
  const label = typeof parsed.data.label === 'string' ? parsed.data.label.trim() : '';
  const description = typeof parsed.data.description === 'string' ? parsed.data.description.trim() : '';

  const setPayload: Record<string, unknown> = { path: nextPathRaw };
  const unsetPayload: Record<string, ''> = {};
  if (hasLabel) {
    if (label) setPayload.label = label;
    else unsetPayload.label = '';
  }
  if (hasDescription) {
    if (description) setPayload.description = description;
    else unsetPayload.description = '';
  }

  const updatePayload: Record<string, unknown> = { $set: setPayload };
  if (Object.keys(unsetPayload).length) {
    updatePayload.$unset = unsetPayload;
  }

  const folder = (await AssetFolder.findOneAndUpdate(
    { path: nextPathRaw },
    updatePayload,
    { new: true, upsert: true }
  )
    .select({ path: 1, label: 1, description: 1 })
    .lean()
    .exec()) as { path: string; label?: string; description?: string } | null;

  const count = await Asset.countDocuments({
    folder: nextPathRaw,
    ...buildActiveAssetClause()
  }).exec();

  return NextResponse.json(
    { item: folder ? { ...folder, count } : folder },
    { headers: NO_STORE_HEADERS }
  );
}

const deleteSchema = z.object({
  path: z.string().min(1)
});

export async function DELETE(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const isSmoke = isEditorSmokeRequest(request.headers);
  if (!session && !isSmoke) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  if (isSmoke && !session) {
    return NextResponse.json({ error: 'Smoke mode is read-only' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid folder path' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const path = normalizeFolderPath(parsed.data.path);
  if (!path) {
    return NextResponse.json({ error: 'Invalid folder path' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const directAssets = await Asset.countDocuments({ folder: path }).exec();
  if (directAssets > 0) {
    return NextResponse.json(
      { error: 'Folder is not empty. Move assets out before deleting.', assetCount: directAssets },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  }

  const nestedPath = new RegExp(`^${escapeRegExp(path)}/`);
  const nestedAssetCount = await Asset.countDocuments({ folder: { $regex: nestedPath } }).exec();
  if (nestedAssetCount > 0) {
    return NextResponse.json(
      { error: 'Folder has subfolders with assets. Move those assets first.', assetCount: nestedAssetCount },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  }

  await AssetFolder.deleteMany({
    $or: [{ path }, { path: { $regex: nestedPath } }]
  }).exec();

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
