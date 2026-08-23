import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { ServiceInputSchema } from '@/lib/booking/api-schemas';
import { updateService } from '@/lib/booking/catalog';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const result = ServiceInputSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }
  try {
    const service = await updateService(id, result.data);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update service' },
      { status: 400 }
    );
  }
}
