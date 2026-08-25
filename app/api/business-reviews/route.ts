import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { listExternalReviewBusinesses } from '@/lib/business-reviews/catalog';
import {
  BUSINESS_REVIEWS_API_HEADERS,
  businessReviewsOptionsResponse
} from '@/lib/business-reviews/api';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

export function OPTIONS() {
  return businessReviewsOptionsResponse();
}

export async function GET(request: Request) {
  unstable_noStore();
  const rate = checkRateLimit({
    id: 'public-business-reviews-api',
    key: getRequestIp(request.headers) || 'unknown',
    limit: 60,
    windowMs: 60 * 1000
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'The business reviews API has been requested too often. Please try again shortly.' },
      { status: 429, headers: { ...BUSINESS_REVIEWS_API_HEADERS, 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const businesses = await listExternalReviewBusinesses({ publishedOnly: true });
    return NextResponse.json({ businesses }, { headers: BUSINESS_REVIEWS_API_HEADERS });
  } catch (error) {
    console.error('[business-reviews] Could not load client API data', error);
    return NextResponse.json(
      { error: 'The business reviews API is unavailable right now.' },
      { status: 503, headers: BUSINESS_REVIEWS_API_HEADERS }
    );
  }
}
