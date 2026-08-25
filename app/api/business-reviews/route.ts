import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { listExternalReviewBusinesses } from '@/lib/business-reviews/catalog';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit';

const responseHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive'
};

export async function GET(request: Request) {
  unstable_noStore();
  const rate = checkRateLimit({
    id: 'public-business-reviews-directory',
    key: getRequestIp(request.headers) || 'unknown',
    limit: 60,
    windowMs: 60 * 1000
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'The business directory has been requested too often. Please try again shortly.' },
      { status: 429, headers: { ...responseHeaders, 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const businesses = await listExternalReviewBusinesses({ publishedOnly: true });
    return NextResponse.json({ businesses }, { headers: responseHeaders });
  } catch (error) {
    console.error('[business-reviews] Could not load public directory', error);
    return NextResponse.json(
      { error: 'The business directory is unavailable right now.' },
      { status: 503, headers: responseHeaders }
    );
  }
}
