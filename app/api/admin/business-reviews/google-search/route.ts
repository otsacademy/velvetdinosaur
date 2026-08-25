import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { GooglePlaceSearchInputSchema } from '@/lib/business-reviews/shared';
import { isGooglePlacesConfigured, searchGooglePlaces } from '@/lib/business-reviews/google-places';
import { isTrustedMutationRequest } from '@/lib/business-reviews/security';
import { claimGoogleSearchRequest } from '@/lib/business-reviews/usage';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: 'Request origin not allowed' }, { status: 403 });
  }

  const rate = checkRateLimit({
    id: 'business-reviews-google-search',
    key: admin.id,
    limit: 12,
    windowMs: 5 * 60 * 1000
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many searches. Please wait a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const input = GooglePlaceSearchInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: 'Enter at least three characters' }, { status: 400 });
  }

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      { error: 'Google Places is not configured yet. Add GOOGLE_PLACES_API_KEY to the server environment.' },
      { status: 503 }
    );
  }

  const budget = await claimGoogleSearchRequest();
  if (!budget.ok) {
    return NextResponse.json(
      { error: 'Today’s Google business-search allowance has been reached.' },
      { status: 429 }
    );
  }

  try {
    const places = await searchGooglePlaces(input.data.query);
    return NextResponse.json(
      { places },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('[business-reviews] Google business search failed', error);
    return NextResponse.json(
      { error: 'Google business search is unavailable right now.' },
      { status: 503 }
    );
  }
}
