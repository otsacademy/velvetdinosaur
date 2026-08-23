import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { ServiceInputSchema } from '@/lib/booking/api-schemas';
import { createService, listServices } from '@/lib/booking/catalog';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ services: await listServices() });
}

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const result = ServiceInputSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }
  try {
    const service = await createService(result.data);
    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create service' },
      { status: 400 }
    );
  }
}
