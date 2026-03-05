import { unstable_noStore } from 'next/cache';
import { getAuth } from '@/lib/auth';

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  return auth.handler(request);
}

export async function POST(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  return auth.handler(request);
}
