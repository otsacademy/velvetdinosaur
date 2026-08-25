import { NextResponse } from 'next/server';

export const BUSINESS_REVIEWS_API_HEADERS = {
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive'
} as const;

export function businessReviewsOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...BUSINESS_REVIEWS_API_HEADERS,
      'Access-Control-Max-Age': '86400'
    }
  });
}
