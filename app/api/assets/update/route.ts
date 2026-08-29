import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';
import { clamp01 } from '@/lib/media/focal-point';
import { normalizeAssetTags } from '@/lib/assets/tags';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

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
  const isSmoke = isEditorSmokeRequest(request.headers);
  if (!session && !isSmoke) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        key?: unknown;
        name?: unknown;
        caption?: unknown;
        alt?: unknown;
        folder?: unknown;
        width?: unknown;
        height?: unknown;
        focalX?: unknown;
        focalY?: unknown;
        altNeedsReview?: unknown;
        tags?: unknown;
      }
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
  const hasFocalX = Object.prototype.hasOwnProperty.call(body ?? {}, 'focalX');
  const hasFocalY = Object.prototype.hasOwnProperty.call(body ?? {}, 'focalY');
  const hasAltNeedsReview = Object.prototype.hasOwnProperty.call(body ?? {}, 'altNeedsReview');
  const hasTags = Object.prototype.hasOwnProperty.call(body ?? {}, 'tags');
  if (
    !hasName &&
    !hasCaption &&
    !hasAlt &&
    !hasFolder &&
    !hasWidth &&
    !hasHeight &&
    !hasFocalX &&
    !hasFocalY &&
    !hasAltNeedsReview &&
    !hasTags
  ) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  type AssetUpdates = {
    name?: string;
    caption?: string;
    alt?: string;
    altSource?: 'manual' | 'auto';
    altGeneratedAt?: Date | null;
    altModel?: string | null;
    altNeedsReview?: boolean;
    tags?: string[];
    folder?: string;
    width?: number;
    height?: number;
    focalX?: number;
    focalY?: number;
    focalSetAt?: Date;
    focalSetBy?: string;
  };
  const updates: AssetUpdates = {};
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
    updates.alt = nextAlt || '';
    updates.altSource = 'manual';
    updates.altNeedsReview = false;
    updates.altGeneratedAt = null;
    updates.altModel = null;
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
  if (hasFocalX) {
    const parsed = clamp01((body as { focalX?: unknown }).focalX);
    if (parsed === undefined && body && Object.prototype.hasOwnProperty.call(body, 'focalX')) {
      return NextResponse.json({ error: 'Invalid focalX value' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    updates.focalX = parsed;
  }
  if (hasFocalY) {
    const parsed = clamp01((body as { focalY?: unknown }).focalY);
    if (parsed === undefined && body && Object.prototype.hasOwnProperty.call(body, 'focalY')) {
      return NextResponse.json({ error: 'Invalid focalY value' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    updates.focalY = parsed;
  }
  if (hasAltNeedsReview) {
    updates.altNeedsReview =
      typeof body?.altNeedsReview === 'boolean' ? body.altNeedsReview : false;
  }
  if (hasTags) {
    updates.tags = normalizeAssetTags((body as { tags?: unknown }).tags);
  }
  if (hasFocalX || hasFocalY) {
    updates.focalSetAt = new Date();
    const sessionUser = (session as { user?: { id?: string } } | null)?.user;
    updates.focalSetBy = sessionUser?.id || undefined;
  }

  if (isSmoke && !session) {
    return NextResponse.json(
      {
        key,
        name: updates.name,
        caption: updates.caption,
        alt: updates.alt,
        altSource: updates.altSource,
        altGeneratedAt: updates.altGeneratedAt,
        altModel: updates.altModel,
        altNeedsReview: updates.altNeedsReview,
        tags: updates.tags,
        folder: updates.folder,
        width: updates.width,
        height: updates.height,
        focalX: updates.focalX,
        focalY: updates.focalY,
        focalSetAt: updates.focalSetAt,
        focalSetBy: updates.focalSetBy
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const updated = (await Asset.findOneAndUpdate({ key }, updates, { new: true })
    .lean()
    .exec()) as {
    name?: string;
    caption?: string;
    alt?: string;
    altSource?: 'manual' | 'auto';
    altGeneratedAt?: Date | null;
    altModel?: string | null;
    altNeedsReview?: boolean;
    tags?: string[];
    folder?: string;
    width?: number;
    height?: number;
    focalX?: number;
    focalY?: number;
    focalSetAt?: Date;
    focalSetBy?: string;
  } | null;

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    {
      key,
      name: updated.name,
      caption: updated.caption,
      alt: updated.alt,
      altSource: updated.altSource,
      altGeneratedAt: updated.altGeneratedAt,
      altModel: updated.altModel,
      altNeedsReview: updated.altNeedsReview,
      tags: updated.tags,
      folder: updated.folder,
      width: updated.width,
      height: updated.height,
      focalX: updated.focalX,
      focalY: updated.focalY,
      focalSetAt: updated.focalSetAt,
      focalSetBy: updated.focalSetBy
    },
    { headers: NO_STORE_HEADERS }
  );
}
