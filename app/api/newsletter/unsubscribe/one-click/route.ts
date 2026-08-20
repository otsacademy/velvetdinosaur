import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { unsubscribeNewsletterWithToken } from '@/lib/newsletter/unsubscribe';

function tokenFromUrl(url: URL) {
  return (url.searchParams.get('token') || '').trim();
}

async function tokenFromBody(request: Request) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as { token?: string };
    return (body?.token || '').trim();
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text().catch(() => '');
    const params = new URLSearchParams(text);
    return (params.get('token') || '').trim();
  }

  return '';
}

async function handleRequest(request: Request) {
  unstable_noStore();
  const url = new URL(request.url);
  const queryToken = tokenFromUrl(url);
  const bodyToken = queryToken ? '' : await tokenFromBody(request);
  const token = queryToken || bodyToken;
  if (!token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const result = await unsubscribeNewsletterWithToken(token, {
    source: 'newsletter-one-click-unsubscribe',
    actorType: 'one-click'
  });
  if (!result.ok) {
    const status = result.error === 'misconfigured' ? 500 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, email: result.email, updated: result.updated });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
