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

function slugifySegment(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
}

function normalizeFolderPath(input: string) {
  const raw = input.trim().replace(/\\/g, '/');
  if (!raw) return '';
  const parts = raw
    .split('/')
    .map((part) => slugifySegment(part))
    .filter(Boolean);
  return parts.join('/');
}

export async function POST(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !isSmokeRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = (await request.json().catch(() => null)) as
    | { key?: unknown; name?: unknown; caption?: unknown; alt?: unknown; folder?: unknown; width?: unknown; height?: unknown }
    | null;
  const key = typeof body?.key === 'string' ? body.key.trim() : '';
  if (!key || !key.startsWith('uploads/')) {
    return NextResponse.json({ error: 'Invalid asset key' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const hasName = Object.prototype.hasOwnProperty.call(body ?? {}, 'name');
  const hasCaption = Object.prototype.hasOwnProperty.call(body ?? {}, 'caption');
  const hasAlt = Object.prototype.hasOwnProperty.call(body ?? {}, 'alt');
  const hasFolder = Object.prototype.hasOwnProperty.call(body ?? {}, 'folder');
  const hasWidth = Object.prototype.hasOwnProperty.call(body ?? {}, 'width');
  const hasHeight = Object.prototype.hasOwnProperty.call(body ?? {}, 'height');
  if (!hasName && !hasCaption && !hasAlt && !hasFolder && !hasWidth && !hasHeight) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const updates: { name?: string; caption?: string; alt?: string; folder?: string; width?: number; height?: number } = {};
  if (hasName) {
    const nextName = typeof body?.name === 'string' ? body.name.trim() : '';
    updates.name = nextName || undefined;
  }
  if (hasCaption) {
    const nextCaption = typeof body?.caption === 'string' ? body.caption.trim() : '';
    updates.caption = nextCaption || undefined;
  }
  if (hasAlt) {
    const nextAlt = typeof body?.alt === 'string' ? body.alt.trim() : '';
    updates.alt = nextAlt || undefined;
  }
  if (hasFolder) {
    const nextFolder = typeof body?.folder === 'string' ? normalizeFolderPath(body.folder) : '';
    updates.folder = nextFolder || undefined;
  }
  if (hasWidth) {
    const nextWidth = typeof body?.width === 'number' && Number.isFinite(body.width) ? Math.round(body.width) : NaN;
    updates.width = Number.isFinite(nextWidth) && nextWidth > 0 ? nextWidth : undefined;
  }
  if (hasHeight) {
    const nextHeight = typeof body?.height === 'number' && Number.isFinite(body.height) ? Math.round(body.height) : NaN;
    updates.height = Number.isFinite(nextHeight) && nextHeight > 0 ? nextHeight : undefined;
  }

  if (isSmokeRequest(request) && !session) {
    return NextResponse.json(
      { key, name: updates.name, caption: updates.caption, alt: updates.alt, folder: updates.folder, width: updates.width, height: updates.height },
      { headers: NO_STORE_HEADERS }
    );
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const updated = (await Asset.findOneAndUpdate({ key }, updates, { new: true })
    .lean()
    .exec()) as { name?: string; caption?: string; alt?: string; folder?: string; width?: number; height?: number } | null;

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    {
      key,
      name: updated.name,
      caption: updated.caption,
      alt: updated.alt,
      folder: updated.folder,
      width: updated.width,
      height: updated.height
    },
    { headers: NO_STORE_HEADERS }
  );
}
