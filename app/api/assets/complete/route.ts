import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';

export async function POST(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const key = body?.key;
  const etag = body?.etag;
  const size = body?.size;
  const mime = body?.mime;
  const folder = typeof body?.folder === 'string' && body.folder.trim() ? body.folder.trim() : undefined;
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : undefined;
  const caption =
    typeof body?.caption === 'string' && body.caption.trim() ? body.caption.trim() : undefined;
  const alt = typeof body?.alt === 'string' && body.alt.trim() ? body.alt.trim() : undefined;
  const width = typeof body?.width === 'number' && Number.isFinite(body.width) && body.width > 0 ? Math.round(body.width) : undefined;
  const height =
    typeof body?.height === 'number' && Number.isFinite(body.height) && body.height > 0 ? Math.round(body.height) : undefined;

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: 'R2_BUCKET not set' }, { status: 500 });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }
  const update: Record<string, unknown> = { key, bucket, etag, size, mime };
  if (folder) update.folder = folder;
  if (name) update.name = name;
  if (caption) update.caption = caption;
  if (alt) update.alt = alt;
  if (width) update.width = width;
  if (height) update.height = height;

  await Asset.findOneAndUpdate({ key }, update, { upsert: true, new: true });

  return NextResponse.json({ ok: true });
}
