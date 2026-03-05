import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';
import { getR2Client } from '@/lib/r2';

async function headObject(bucket: string, key: string) {
  const client = getR2Client();
  const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
  try {
    return await client.send(command);
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null
        ? ((error as { $metadata?: { httpStatusCode?: unknown } }).$metadata?.httpStatusCode as unknown)
        : undefined;
    if (status === 404 || status === '404') return null;
    if (typeof status === 'number' && status >= 400 && status < 500) return null;
    const rawCode =
      typeof error === 'object' && error !== null
        ? ((error as { Code?: unknown; code?: unknown; name?: unknown }).Code ??
            (error as { code?: unknown }).code ??
            (error as { name?: unknown }).name)
        : undefined;
    const code = typeof rawCode === 'string' ? rawCode : '';
    if (code === 'NotFound' || code === 'NoSuchKey' || code === 'NoSuchBucket') {
      return null;
    }
    throw error;
  }
}

function inferFolderFromKey(key: string) {
  const prefix = 'uploads/';
  if (!key.startsWith(prefix)) return undefined;
  const rest = key.slice(prefix.length);
  const parts = rest.split('/').filter(Boolean);
  if (parts.length <= 1) return undefined;
  return parts.slice(0, -1).join('/');
}

function inferNameFromKey(key: string) {
  const filename = key.split('/').pop() || '';
  return filename.replace(/\.[^/.]+$/, '') || undefined;
}

function isImmutableUploadKey(key: string) {
  const filename = key.split('/').pop() || '';
  // Matches "...-<uuid>.ext" used by our upload pipeline.
  return /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i.test(filename);
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
  const key = (url.searchParams.get('key') || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/[\\/]+$/, '');
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

  // Prefer DB records (multi-bucket + admin metadata), but fall back to the default bucket
  // so legacy uploads do not break public pages if the Asset record is missing.
  const defaultBucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;

  const conn = await connectDB();
  let bucket = defaultBucket || undefined;
  if (conn) {
    const asset = (await Asset.findOne({ key }).lean().exec()) as { bucket?: string } | null;
    if (asset) {
      bucket = asset.bucket || defaultBucket || undefined;
    }
  }

  if (!bucket) {
    // No safe fallback without knowing which bucket to use.
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const head = await headObject(bucket, key);
  if (!head) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // If DB is up, backfill a minimal record so future list/search/edit works.
  if (conn) {
    await Asset.findOneAndUpdate(
      { key },
      {
        key,
        bucket,
        folder: inferFolderFromKey(key),
        name: inferNameFromKey(key),
        mime: typeof head.ContentType === 'string' ? head.ContentType : undefined,
        size: typeof head.ContentLength === 'number' ? head.ContentLength : undefined,
        etag: typeof head.ETag === 'string' ? head.ETag : undefined
      },
      { upsert: true }
    );
  }

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
