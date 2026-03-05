import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isBlockedPath } from '@/lib/security-paths';

const NOINDEX_PREFIXES = ['/admin', '/edit', '/preview'];

function shouldNoIndex(pathname: string) {
  if (!pathname) return false;
  return NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function getNfcRedirectPath(pathname: string) {
  if (!pathname) return null;
  const lower = pathname.toLowerCase();
  if (!lower.startsWith('/nfc')) return null;

  if (pathname !== lower) return lower;
  if (lower === '/nfc' || lower === '/nfc/') return '/nfc/ian-wickens';
  if (lower === '/nfc/ianwickens') return '/nfc/ian-wickens';
  return null;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname || '/';
  const nfcRedirectPath = getNfcRedirectPath(pathname);
  if (nfcRedirectPath) {
    const url = request.nextUrl.clone();
    url.pathname = nfcRedirectPath;
    return NextResponse.redirect(url, 308);
  }

  if (isBlockedPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.next();
  if (shouldNoIndex(pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
}

export const config = {
  matcher: '/:path*'
};
