import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { ResourceInputSchema } from '@/lib/booking/api-schemas';
import { createResource, listResources } from '@/lib/booking/catalog';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ resources: await listResources() });
}

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const result = ResourceInputSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
  }
  try {
    const resource = await createResource(result.data);
    return NextResponse.json({ resource });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create resource' },
      { status: 400 }
    );
  }
}
