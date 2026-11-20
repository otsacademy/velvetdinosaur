import { NextResponse } from 'next/server';
import { unsubscribeNewsletterWithToken } from '@/lib/newsletter/unsubscribe';
import { getRequestIp } from '@/lib/security/rate-limit';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' };

// Link scanners and people opening the header URL must never change preferences.
export function GET(request: Request) {
  const url = new URL(request.url);
  const destination = new URL('/newsletter/unsubscribe', url.origin);
  const token = url.searchParams.get('token');
  if (token) destination.searchParams.set('token', token);
  // A relative Location preserves the public host behind nginx/Next's proxy.
  return new NextResponse(null, { status: 303, headers: { ...headers, Location: destination.pathname + destination.search } });
}

export function HEAD(request: Request) {
  return GET(request);
}

export async function POST(request: Request) {
  const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!['application/x-www-form-urlencoded', 'multipart/form-data'].includes(contentType)) {
    return NextResponse.json({ error: 'Expected a one-click form submission' }, { status: 400, headers });
  }
  const form = await request.formData().catch(() => null);
  // RFC 8058 requires this explicit marker; an empty POST is not consent.
  if (form?.get('List-Unsubscribe') !== 'One-Click') {
    return NextResponse.json({ error: 'Invalid one-click request' }, { status: 400, headers });
  }
  const token = new URL(request.url).searchParams.get('token') || '';
  try {
    const result = await unsubscribeNewsletterWithToken(token, {
      source: 'newsletter-one-click-unsubscribe', actorType: 'one-click',
      ip: getRequestIp(request.headers), userAgent: request.headers.get('user-agent') || ''
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'misconfigured' ? 503 : 400, headers });
    }
    return NextResponse.json({ ok: true, updated: result.updated }, { headers });
  } catch {
    console.error('[newsletter] one-click unsubscribe failed');
    return NextResponse.json({ error: 'Unsubscribe temporarily unavailable' }, { status: 503, headers });
  }
}
