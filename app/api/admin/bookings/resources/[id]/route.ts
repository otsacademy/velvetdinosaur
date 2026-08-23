import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/booking/auth';
import { ResourceInputSchema } from '@/lib/booking/api-schemas';
import { updateResource } from '@/lib/booking/catalog';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const result = ResourceInputSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
  }
  try {
    const resource = await updateResource(id, result.data);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    return NextResponse.json({ resource });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update resource' },
      { status: 400 }
    );
  }
}
