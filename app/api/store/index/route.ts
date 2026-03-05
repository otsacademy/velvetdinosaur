import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getStoreApiUrl, getStorePath, readStoreItems } from '@/lib/component-store';

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await readStoreItems();

  return NextResponse.json({
    storePath: getStorePath(),
    storeApiUrl: getStoreApiUrl(),
    items
  });
}
