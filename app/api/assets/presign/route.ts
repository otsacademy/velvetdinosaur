import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createPresignedUpload } from '@/lib/presign';
import { v4 as uuidv4 } from 'uuid';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

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

export async function POST(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json();
  const filename = body?.filename || 'upload';
  const contentType = body?.contentType || 'application/octet-stream';
  const rawName = typeof body?.name === 'string' ? body.name.trim() : '';
  const rawCaption = typeof body?.caption === 'string' ? body.caption.trim() : '';
  const rawAlt = typeof body?.alt === 'string' ? body.alt.trim() : '';
  const rawFolder = body?.folder;
  const rawWidth = typeof body?.width === 'number' ? body.width : undefined;
  const rawHeight = typeof body?.height === 'number' ? body.height : undefined;
  const name = rawName || stripExtension(filename);
  const caption = rawCaption || undefined;
  const alt = rawAlt || undefined;
  const folder = normalizeFolderPath(rawFolder) || undefined;
  const width = typeof rawWidth === 'number' && Number.isFinite(rawWidth) && rawWidth > 0 ? Math.round(rawWidth) : undefined;
  const height =
    typeof rawHeight === 'number' && Number.isFinite(rawHeight) && rawHeight > 0 ? Math.round(rawHeight) : undefined;

  const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: 'R2_BUCKET not set' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const ext = filename.includes('.') ? filename.split('.').pop() : 'bin';
  const keyBase = slugifyName(name);
  const folderPrefix = folder ? `${folder}/` : '';
  const key = `uploads/${folderPrefix}${keyBase}-${uuidv4()}.${ext}`;

  const uploadUrl = await createPresignedUpload({
    bucket,
    key,
    contentType
  });

  return NextResponse.json(
    {
      key,
      uploadUrl,
      bucket,
      name,
      caption,
      alt,
      width,
      height,
      folder
    },
    { headers: NO_STORE_HEADERS }
  );
}
