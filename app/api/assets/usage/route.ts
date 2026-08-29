import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getAssetUsage } from '@/lib/assets/usage.server';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';
import { isAssetLiveCaptureAllowed } from '@/lib/security/asset-live-capture';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

function normalizeKeysInput(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',');
  return [];
}

async function resolveUsage(request: Request, keysInput: unknown) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    if (isEditorSmokeRequest(request.headers)) {
      return NextResponse.json({ items: [] }, { headers: NO_STORE_HEADERS });
    }
    const isLiveCapture = await isAssetLiveCaptureAllowed(request);
    if (!isLiveCapture) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }
  }

  const keys = normalizeKeysInput(keysInput);
  if (!keys.length) {
    return NextResponse.json({ items: [] }, { headers: NO_STORE_HEADERS });
  }

  const items = await getAssetUsage(keys);
  return NextResponse.json({ items }, { headers: NO_STORE_HEADERS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keys = url.searchParams.getAll('key');
  if (keys.length) {
    return resolveUsage(request, keys);
  }
  const csv = url.searchParams.get('keys');
  return resolveUsage(request, csv || []);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return resolveUsage(request, normalizeKeysInput(body?.keys));
}
