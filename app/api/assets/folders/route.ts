import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AssetFolder } from '@/models/AssetFolder';
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
  label: z.string().trim().min(1).max(80).optional()
});

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !isSmokeRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const conn = await connectDB();
  if (!conn) {
    if (isSmokeRequest(request)) {
      return NextResponse.json({ items: [] }, { headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const explicitFolders = (await AssetFolder.find({})
    .sort({ path: 1 })
    .select({ path: 1, label: 1 })
    .lean()
    .exec()) as unknown as Array<{ path: string; label?: string }>;

  const impliedPaths = (await Asset.distinct('folder', { folder: { $exists: true, $ne: '' } }).exec()).filter(
    (value) => typeof value === 'string' && value.trim()
  ) as string[];

  const merged = new Map<string, { path: string; label?: string }>();
  for (const folder of explicitFolders) {
    if (folder?.path) merged.set(folder.path, folder);
  }
  for (const path of impliedPaths) {
    if (!merged.has(path)) merged.set(path, { path });
  }

  const items = Array.from(merged.values()).sort((a, b) => a.path.localeCompare(b.path));

  return NextResponse.json({ items }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !isSmokeRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  if (isSmokeRequest(request) && !session) {
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

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const folder = (await AssetFolder.findOneAndUpdate(
    { path },
    { path, ...(label ? { label } : {}) },
    { upsert: true, new: true }
  )
    .select({ path: 1, label: 1 })
    .lean()
    .exec()) as { path: string; label?: string } | null;

  return NextResponse.json({ item: folder }, { headers: NO_STORE_HEADERS });
}
