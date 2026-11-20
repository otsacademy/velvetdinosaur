import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { enforceSameOriginForPublicForm } from '@/lib/csrf-protection';
import { isBlockedPath } from '@/lib/security-paths';
import { applySecurityHeaders, type SiteSecurityHeaders } from '@/lib/security-headers';

// Security headers on every answer (lib/security-headers.ts). The theme editor's live preview frames this site.
// nginx sends none of them. HSTS covers velvetdinosaur.com only: includeSubDomains or preload would cover every
// *.velvetdinosaur.com host and be slow to undo, so that is the owner's decision.
const SECURITY_HEADERS: SiteSecurityHeaders = { themeEditorPreview: true };

const NOINDEX_PREFIXES = [
  '/admin', '/edit', '/preview',
  '/newsletter/unsubscribe', '/api/newsletter/unsubscribe',
  '/newsletter/confirm', '/events/registration/confirm', '/api/newsletter/confirm', '/api/events/registration/confirm'
];
// Same-origin only, with or without cookies (see enforceSameOriginForPublicForm).
// The one-click unsubscribe endpoint stays open to mailbox providers (RFC 8058).
const PUBLIC_FORM_PREFIXES = [
  '/api/newsletter/subscribe', '/api/newsletter/consent',
  '/api/newsletter/confirm', '/api/events/registration/confirm'
];
// Pages and endpoints that carry a signed email-link token: never cached,
// never indexed, and never sent on as a referrer.
const PRIVATE_EMAIL_LINK_PATH = /^\/(?:api\/)?(?:newsletter\/(?:unsubscribe|confirm)|events\/registration\/confirm)(?:\/|$)/;
// Uploaded files are served from the site's own address. As in ASAP, every
// answer on the file route keeps the sandbox and nosniff here as well as in
// the file response itself (proxy headers take precedence in Next).
const ASSET_FILE_PATH = '/api/assets/file';
const ASSET_SANDBOX_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "sandbox; default-src 'none'; base-uri 'none'; form-action 'none'",
  'X-Content-Type-Options': 'nosniff'
};
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

function shouldEnforcePublicFormOrigin(pathname: string) {
  if (pathname === '/api/newsletter/unsubscribe') return true;
  return PUBLIC_FORM_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function withPrivateLinkHeaders(response: NextResponse, pathname: string) {
  if (PRIVATE_EMAIL_LINK_PATH.test(pathname)) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
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

function routeRequest(request: NextRequest) {
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

  if (shouldEnforcePublicFormOrigin(pathname)) {
    const originBlock = enforceSameOriginForPublicForm(request);
    if (originBlock) return withPrivateLinkHeaders(originBlock, pathname);
  }

  const response = NextResponse.next();
  if (shouldNoIndex(pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  if (pathname === ASSET_FILE_PATH) {
    for (const [name, value] of Object.entries(ASSET_SANDBOX_HEADERS)) response.headers.set(name, value);
  }
  return withPrivateLinkHeaders(response, pathname);
}

export function proxy(request: NextRequest) {
  return applySecurityHeaders(routeRequest(request), request.nextUrl.pathname || '/', SECURITY_HEADERS);
}

export const config = {
  matcher: '/:path*'
};
