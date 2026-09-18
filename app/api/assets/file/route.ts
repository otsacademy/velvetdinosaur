import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';
import { getR2Client } from '@/lib/r2';
import {
  normalizeAssetImageIntent,
  selectAssetVariantKey,
  type AssetImageVariantMap
} from '@/lib/assets/image-variants';

function isImmutableUploadKey(key: string) {
  const filename = key.split('/').pop() || '';
  // Matches "...-<uuid>.ext" used by our upload pipeline.
  return /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:--[a-z]+)?\.[a-z0-9]+$/i.test(filename);
}

function toWebStream(body: unknown) {
  if (!body) return null;
  if (typeof (body as { getReader?: unknown }).getReader === 'function') {
    return body as ReadableStream;
  }
  if (body instanceof Readable) {
    return Readable.toWeb(body) as unknown as ReadableStream;
  }
  return null;
}

export async function GET(request: Request) {
  unstable_noStore();
  const url = new URL(request.url);
  let key = (url.searchParams.get('key') || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/[\\/]+$/, '');
  const intent = normalizeAssetImageIntent(url.searchParams.get('intent'));
  if (!key) {
    // Next may (incorrectly) prefetch internal URLs as RSC requests, dropping query params.
    // Returning 204 avoids noisy console errors without masking real missing-key issues.
    if (url.searchParams.has('_rsc')) {
      return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  // Safety: only serve uploads.
  if (!key.startsWith('uploads/')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Public requests must never manufacture library records or use a shared
  // bucket as an ownership oracle. Existing registered legacy assets continue
  // to work; newsletter preparation additionally requires verified provenance.
  const conn = await connectDB();
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const asset = (await Asset.findOne({ key })
    .select({ bucket: 1, key: 1, fallbackKey: 1, variants: 1 })
    .lean().exec()) as {
      bucket?: string; key?: string; fallbackKey?: string;
      variants?: AssetImageVariantMap | null;
    } | null;
  if (!asset?.bucket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const bucket = asset.bucket;
  const variantKey = selectAssetVariantKey(asset, intent);
  if (variantKey?.startsWith('uploads/')) key = variantKey;

  try {
    const client = getR2Client();
    const obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const stream = toWebStream(obj.Body);
    if (!stream) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', typeof obj.ContentType === 'string' ? obj.ContentType : 'application/octet-stream');
    if (typeof obj.ContentLength === 'number') headers.set('Content-Length', String(obj.ContentLength));
    if (typeof obj.ETag === 'string') headers.set('ETag', obj.ETag);
    if (obj.LastModified instanceof Date) headers.set('Last-Modified', obj.LastModified.toUTCString());
    headers.set(
      'Cache-Control',
      isImmutableUploadKey(key) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
    );

    return new NextResponse(stream, { status: 200, headers });
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null
        ? ((error as { $metadata?: { httpStatusCode?: unknown } }).$metadata?.httpStatusCode as unknown)
        : undefined;
    const rawCode =
      typeof error === 'object' && error !== null
        ? ((error as { Code?: unknown; code?: unknown; name?: unknown }).Code ??
            (error as { code?: unknown }).code ??
            (error as { name?: unknown }).name)
        : undefined;
    const code = typeof rawCode === 'string' ? rawCode : '';
    if (status === 403 || code === 'AccessDenied') {
      return NextResponse.json({ error: 'R2 access denied. Check R2 credentials/bucket permissions.' }, { status: 403 });
    }
    if (status === 404 || code === 'NotFound' || code === 'NoSuchKey') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw error;
  }
}
