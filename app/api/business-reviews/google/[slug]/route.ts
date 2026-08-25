import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getPublishedExternalReviewBusiness } from '@/lib/business-reviews/catalog';
import { getGooglePlaceReviews, isGooglePlacesConfigured } from '@/lib/business-reviews/google-places';
import { BUSINESS_REVIEW_SLUG_PATTERN } from '@/lib/business-reviews/shared';
import { claimGoogleReviewRequest } from '@/lib/business-reviews/usage';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

type RouteContext = { params: Promise<{ slug: string }> };
const noStoreHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive'
};

export async function GET(request: Request, context: RouteContext) {
  unstable_noStore();
  const { slug } = await context.params;
  if (!BUSINESS_REVIEW_SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404, headers: noStoreHeaders });
  }

  const business = await getPublishedExternalReviewBusiness(slug);
  if (!business?.googlePlaceId) {
    return NextResponse.json({ error: 'Google reviews are not available for this business' }, { status: 404, headers: noStoreHeaders });
  }

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      { error: 'Google reviews are unavailable right now. Please try again later.' },
      { status: 503, headers: noStoreHeaders }
    );
  }

  const rate = checkRateLimit({
    id: 'public-google-place-reviews',
    key: `${getRequestIp(request.headers) || 'unknown'}:${slug}`,
    limit: 10,
    windowMs: 60 * 60 * 1000
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Google reviews have been requested too often. Please try again later.' },
      { status: 429, headers: { ...noStoreHeaders, 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const budget = await claimGoogleReviewRequest();
  if (!budget.ok) {
    return NextResponse.json(
      { error: 'Today’s Google review allowance has been reached. You can still open the business on Google Maps.' },
      { status: 429, headers: noStoreHeaders }
    );
  }

  try {
    const place = await getGooglePlaceReviews(business.googlePlaceId);
    return NextResponse.json(
      { place, allowanceRemaining: budget.remaining },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error('[business-reviews] Google review request failed', error);
    return NextResponse.json(
      { error: 'Google reviews are unavailable right now. Please try again later.' },
      { status: 503, headers: noStoreHeaders }
    );
  }
}
