import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getR2Client } from '@/lib/r2';
import { Asset } from '@/models/Asset';
import { storeAssetWithVariants } from '@/lib/assets/image-pipeline.server';
import { getOriginalExtension } from '@/lib/assets/image-variants';

function parsePositiveInt(input: unknown) {
  if (typeof input !== 'string') return undefined;
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return undefined;
  const rounded = Math.round(parsed);
  if (rounded <= 0) return undefined;
  return rounded;
}

function buildReplacementOriginalKey(publicKey: string, extension: string) {
  const withoutUploadPrefix = publicKey.replace(/^uploads\//, '');
  const withoutExtension = withoutUploadPrefix.replace(/\.[^/.]+$/, '');
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  return `asset-originals/${withoutExtension}--replace-${timestamp}.${extension}`;
}

export async function POST(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const key = typeof formData.get('key') === 'string' ? String(formData.get('key')).trim().replace(/\\/g, '/') : '';
  const file = formData.get('file');
  if (!key || !key.startsWith('uploads/')) {
    return NextResponse.json({ error: 'Invalid asset key' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing replacement file' }, { status: 400 });
  }

  const width = parsePositiveInt(formData.get('width'));
  const height = parsePositiveInt(formData.get('height'));

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const existing = (await Asset.findOne({ key })
    .select({
      key: 1,
      bucket: 1
    })
    .lean()
    .exec()) as { key?: string; bucket?: string } | null;
  if (!existing?.key) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const defaultBucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  const bucket = existing.bucket || defaultBucket;
  if (!bucket) {
    return NextResponse.json({ error: 'R2 bucket is not configured' }, { status: 500 });
  }

  const contentType = file.type || 'application/octet-stream';
  const buffer = Buffer.from(await file.arrayBuffer());
  const client = getR2Client();
  const originalKey = buildReplacementOriginalKey(key, getOriginalExtension(file.name || '', contentType));
  const stored = await storeAssetWithVariants({
    client,
    bucket,
    publicKey: key,
    originalKey,
    body: buffer,
    contentType
  });

  const setPayload: Record<string, unknown> = {
    bucket,
    originalKey: stored.originalKey,
    originalMime: stored.originalMime,
    originalSize: stored.originalSize,
    optimizedSize: stored.optimizedSize,
    processingStatus: stored.processingStatus,
    processedAt: stored.processedAt,
    fallbackKey: stored.fallbackKey,
    variants: stored.variants,
    mime: stored.mime,
    size: stored.size,
    etag: stored.etag
  };
  if (stored.mime.startsWith('image/')) {
    setPayload.altNeedsReview = true;
  }
  const unsetPayload: Record<string, ''> = {};
  const nextWidth = width ?? stored.width;
  const nextHeight = height ?? stored.height;
  if (typeof nextWidth === 'number') setPayload.width = nextWidth;
  else unsetPayload.width = '';
  if (typeof nextHeight === 'number') setPayload.height = nextHeight;
  else unsetPayload.height = '';

  const updatePayload: Record<string, unknown> = { $set: setPayload };
  if (Object.keys(unsetPayload).length) {
    updatePayload.$unset = unsetPayload;
  }

  const updated = (await Asset.findOneAndUpdate(
    { key },
    updatePayload,
    { new: true }
  )
    .select({
      key: 1,
      name: 1,
      caption: 1,
      alt: 1,
      tags: 1,
      altSource: 1,
      altGeneratedAt: 1,
      altModel: 1,
      altNeedsReview: 1,
      folder: 1,
      mime: 1,
      size: 1,
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
      focalY: 1
    })
    .lean()
    .exec()) as
    | {
        key: string;
        name?: string;
        caption?: string;
        alt?: string;
        tags?: string[];
        altSource?: 'manual' | 'auto' | null;
        altGeneratedAt?: Date | null;
        altModel?: string | null;
        altNeedsReview?: boolean | null;
        folder?: string;
        mime?: string;
        size?: number;
        originalKey?: string;
        originalMime?: string;
        originalSize?: number;
        optimizedSize?: number;
        processingStatus?: string;
        processedAt?: Date;
        fallbackKey?: string;
        variants?: unknown;
        width?: number;
        height?: number;
        focalX?: number;
        focalY?: number;
      }
    | null;

  if (!updated) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json({
    key: updated.key,
    name: updated.name,
    caption: updated.caption,
    alt: updated.alt,
    tags: updated.tags,
    altSource: updated.altSource,
    altGeneratedAt: updated.altGeneratedAt,
    altModel: updated.altModel,
    altNeedsReview: updated.altNeedsReview,
    folder: updated.folder,
    mime: updated.mime,
    size: updated.size,
    originalKey: updated.originalKey,
    originalMime: updated.originalMime,
    originalSize: updated.originalSize,
    optimizedSize: updated.optimizedSize,
    processingStatus: updated.processingStatus,
    processedAt: updated.processedAt,
    fallbackKey: updated.fallbackKey,
    variants: updated.variants,
    width: updated.width,
    height: updated.height,
    focalX: updated.focalX,
    focalY: updated.focalY
  });
}
