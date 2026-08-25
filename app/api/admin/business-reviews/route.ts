import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import {
  createExternalReviewBusiness,
  listExternalReviewBusinesses
} from '@/lib/business-reviews/catalog';
import { isTrustedMutationRequest } from '@/lib/business-reviews/security';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(
    { businesses: await listExternalReviewBusinesses() },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: 'Request origin not allowed' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  try {
    const business = await createExternalReviewBusiness(body, admin.id);
    await logAudit({
      action: 'business-reviews.create',
      actorUserId: admin.id,
      metadata: { businessId: business.id, slug: business.slug, published: business.published }
    });
    return NextResponse.json({ business }, { status: 201 });
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
    console.error('[business-reviews] Could not create business', error);
    return NextResponse.json({ error: 'Could not create the business' }, { status: 500 });
  }
}
