import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';
import { createPresignedDownload } from '@/lib/presign';

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const asset = await Asset.findOne({ key }).lean();
  if (!asset) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: 'R2_BUCKET not set' }, { status: 500 });
  }

  const signedUrl = await createPresignedDownload({ bucket, key });
  return NextResponse.json({ signedUrl });
}
