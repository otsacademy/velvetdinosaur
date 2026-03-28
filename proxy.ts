import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isBlockedPath } from '@/lib/security-paths';

const NOINDEX_PREFIXES = ['/admin', '/edit', '/preview'];
const DEMO_HOST_LOCKED_PREFIXES = ['/admin', '/edit', '/preview', '/sign-in', '/sign-up'];
const DEMO_HOST_REWRITES = new Map<string, string>([
  ['/', '/demo'],
  ['/new', '/demo/new'],
  ['/theme-editor', '/demo/theme-editor'],
  ['/inbox', '/demo/inbox'],
  ['/calendar', '/demo/calendar'],
  ['/media', '/demo/media'],
  ['/support', '/demo/support'],
  ['/login', '/demo/login']
]);

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

function isDemoHost(hostname: string) {
  return hostname.toLowerCase().startsWith('demo.');
}

function isDemoLockedPath(pathname: string) {
  if (!pathname) return false;
  return DEMO_HOST_LOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function getDemoRewritePath(pathname: string) {
  if (!pathname) return null;
  return DEMO_HOST_REWRITES.get(pathname) ?? null;
}

function getRequestHost(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const hostHeader = forwardedHost || request.headers.get('host') || request.nextUrl.hostname;
  const [firstHost = ''] = hostHeader.split(',');
  return firstHost.trim().toLowerCase();
}

function getRequestHostname(request: NextRequest) {
  return getRequestHost(request).split(':')[0].toLowerCase();
}

function getRequestPort(host: string) {
  const separator = host.lastIndexOf(':');
  if (separator === -1) return null;
  return host.slice(separator + 1) || null;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname || '/';
  const hostname = getRequestHostname(request);
  const nfcRedirectPath = getNfcRedirectPath(pathname);
  if (nfcRedirectPath) {
    const url = request.nextUrl.clone();
    url.pathname = nfcRedirectPath;
    return NextResponse.redirect(url, 308);
  }

  if (isDemoHost(hostname) && isDemoLockedPath(pathname)) {
    const requestHost = getRequestHost(request);
    const url = request.nextUrl.clone();
    url.hostname = hostname.replace(/^demo\./i, '');
    const requestPort = getRequestPort(requestHost);
    url.port = requestPort ?? '';
    return NextResponse.redirect(url, 308);
  }

  if (isDemoHost(hostname)) {
    const demoRewritePath = getDemoRewritePath(pathname);
    if (demoRewritePath) {
      const url = request.nextUrl.clone();
      url.pathname = demoRewritePath;
      return NextResponse.rewrite(url);
    }
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
