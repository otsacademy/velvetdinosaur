import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import {
  deleteExternalReviewBusiness,
  updateExternalReviewBusiness
} from '@/lib/business-reviews/catalog';
import { isTrustedMutationRequest } from '@/lib/business-reviews/security';
import { logAudit } from '@/lib/audit';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: 'Request origin not allowed' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  try {
    const business = await updateExternalReviewBusiness(id, body, admin.id);
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    await logAudit({
      action: 'business-reviews.update',
      actorUserId: admin.id,
      metadata: { businessId: business.id, slug: business.slug, published: business.published }
    });
    return NextResponse.json({ business });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Check the business details and try again' },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : '';
    if (message === 'That API slug is already in use') {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error('[business-reviews] Could not update business', error);
    return NextResponse.json({ error: 'Could not update the business' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: 'Request origin not allowed' }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const deleted = await deleteExternalReviewBusiness(id);
    if (!deleted) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    await logAudit({
      action: 'business-reviews.delete',
      actorUserId: admin.id,
      metadata: { businessId: id }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[business-reviews] Could not delete business', error);
    return NextResponse.json({ error: 'Could not delete the business' }, { status: 500 });
  }
}
