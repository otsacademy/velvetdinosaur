import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from '@/lib/auth';
import { getR2Client } from '@/lib/r2';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';

function getExtension(filename: string) {
  if (!filename) return 'bin';
  const parts = filename.split('.');
  if (parts.length < 2) return 'bin';
  return parts.pop() || 'bin';
}

function stripExtension(filename: string) {
  if (!filename) return 'upload';
  return filename.replace(/\.[^/.]+$/, '');
}

function slugifyName(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return 'upload';
  const slug = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
  return slug || 'upload';
}

function normalizeFolderPath(input: unknown) {
  if (typeof input !== 'string') return '';
  const raw = input.trim().replace(/\\/g, '/');
  if (!raw) return '';
  const parts = raw
    .split('/')
    .map((part) => slugifyName(part))
    .filter(Boolean);
  return parts.join('/');
}

function parsePositiveInt(input: unknown) {
  if (typeof input !== 'string') return undefined;
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return undefined;
  const rounded = Math.round(parsed);
  if (rounded <= 0) return undefined;
  return rounded;
}

export async function POST(request: Request) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json({ error: 'R2_BUCKET not set' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const rawName = formData.get('name');
    const rawCaption = formData.get('caption');
    const rawAlt = formData.get('alt');
    const rawFolder = formData.get('folder');
    const rawWidth = formData.get('width');
    const rawHeight = formData.get('height');
    const fallbackName = stripExtension(file.name || 'upload');
    const name =
      typeof rawName === 'string' && rawName.trim() ? rawName.trim() : fallbackName;
    const caption =
      typeof rawCaption === 'string' && rawCaption.trim() ? rawCaption.trim() : undefined;
    const alt = typeof rawAlt === 'string' && rawAlt.trim() ? rawAlt.trim() : undefined;
    const folder = normalizeFolderPath(rawFolder) || undefined;
    const width = parsePositiveInt(rawWidth);
    const height = parsePositiveInt(rawHeight);

    const keyBase = slugifyName(name);
    const folderPrefix = folder ? `${folder}/` : '';
    const key = `uploads/${folderPrefix}${keyBase}-${uuidv4()}.${getExtension(file.name || '')}`;
    const contentType = file.type || 'application/octet-stream';
    const body = Buffer.from(await file.arrayBuffer());

    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    });
    const result = await client.send(command);

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    await Asset.findOneAndUpdate(
      { key },
      {
        key,
        bucket,
        etag: result.ETag,
        size: file.size,
        mime: contentType,
        folder,
        name,
        caption,
        alt,
        width,
        height
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      key,
      url: `/api/assets/file?key=${encodeURIComponent(key)}`,
      name,
      caption,
      alt,
      width,
      height,
      folder
    });
  } catch (error) {
    const rawCode =
      typeof error === 'object' && error !== null
        ? ((error as { Code?: unknown; code?: unknown; name?: unknown }).Code ??
            (error as { code?: unknown }).code ??
            (error as { name?: unknown }).name)
        : undefined;
    const code = typeof rawCode === 'string' ? rawCode : undefined;
    const message = error instanceof Error ? error.message : 'Upload failed';
    if (code === 'AccessDenied') {
      return NextResponse.json(
        { error: 'R2 access denied. Check R2 credentials/bucket permissions.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
