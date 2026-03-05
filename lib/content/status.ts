import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/content/status.ts');

import { connectDB } from '@/lib/db';

export async function isContentStoreAvailable() {
  try {
    const conn = await connectDB();
    return Boolean(conn);
  } catch (error) {
    console.error('[content-store] unavailable', error instanceof Error ? error.message : error);
    return false;
  }
}

