import type { NextResponse } from 'next/server';

/*
 * Security headers for every answer a site's proxy.ts gives: pages, API routes and files. The same copy of
 * this module serves the template and every site; what differs per site (which headers its web server already
 * sends, whether the theme editor may show it in a frame, what its pages load) is passed in by its proxy.ts.
 *
 * Enforced: the static headers below, frame protection, and in production HSTS for this host only.
 * Report-only: the Content-Security-Policy (the shared policy plus each site's own sources), so it blocks
 * nothing while it is checked against real pages. Browsers send what it would have blocked to /api/csp-report,
 * which counts it (lib/security/csp-reports.ts). Enforcing it is a separate, deliberate change: the same policy as
 * Content-Security-Policy, together with the frame-ancestors directive that is enforced already.
 */

// The theme editor's address. Its live preview shows a site's pages in a frame, so a site that offers the theme
// editor lets this origin (and THEME_EDITOR_ORIGIN when set) frame it, and no other.
export const THEME_EDITOR_PREVIEW_ORIGIN = 'https://theme.velvetdinosaur.com';

// Uploaded files keep their own sandbox policy (set by the proxy and the file route), never this module's.
const ASSET_FILE_PATH = '/api/assets/file';
export const CSP_REPORT_PATH = '/api/csp-report';

const HSTS_THIS_HOST_ONLY = 'max-age=31536000';

const STATIC_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

export type ReportOnlyDirective =
  | 'script-src'
  | 'connect-src'
  | 'img-src'
  | 'media-src'
  | 'frame-src'
  | 'font-src'
  | 'style-src'
  | 'worker-src';

export type SiteSecurityHeaders = {
  /** The theme editor may show this site's pages in its live preview frame. */
  themeEditorPreview: boolean;
  /** Headers this site's web server (nginx) already sends; left out here so no answer carries two of them. */
  sentByWebServer?: readonly string[];
  /** Sources this site's pages need beyond the shared policy, by directive (report-only policy). */
  reportOnlySources?: Readonly<Partial<Record<ReportOnlyDirective, readonly string[]>>>;
};

export type SecurityHeaderEnv = {
  production: boolean;
  themeEditorOrigin?: string;
  ga4?: string;
  clarity?: string;
  metaPixel?: string;
  linkedIn?: string;
};

function readEnv(): SecurityHeaderEnv {
  return {
    production: process.env.NODE_ENV === 'production',
    themeEditorOrigin: process.env.THEME_EDITOR_ORIGIN,
    ga4: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    clarity: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
    metaPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    linkedIn: process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID
  };
}

function webOrigin(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

export function frameAncestors(site: SiteSecurityHeaders, env: SecurityHeaderEnv = readEnv()) {
  if (!site.themeEditorPreview) return "frame-ancestors 'self'";
  const editors = new Set([THEME_EDITOR_PREVIEW_ORIGIN]);
  const configured = webOrigin(env.themeEditorOrigin);
  if (configured) editors.add(configured);
  return `frame-ancestors 'self' ${[...editors].join(' ')}`;
}

// Script hosts of the analytics a site has switched on (components/analytics/third-party-analytics.client.tsx).
// Their beacons and pixels need nothing more: connect-src and img-src already allow https.
function analyticsScriptSources(env: SecurityHeaderEnv) {
  const sources: string[] = [];
  if ((env.ga4 || '').trim()) sources.push('https://www.googletagmanager.com');
  if ((env.clarity || '').trim()) sources.push('https://www.clarity.ms', 'https://scripts.clarity.ms');
  if ((env.metaPixel || '').trim()) sources.push('https://connect.facebook.net');
  if ((env.linkedIn || '').trim()) sources.push('https://snap.licdn.com');
  return sources;
}

export function reportOnlyContentSecurityPolicy(site: SiteSecurityHeaders, env: SecurityHeaderEnv = readEnv()) {
  const extra = site.reportOnlySources ?? {};
  const directive = (name: ReportOnlyDirective, base: string[]) =>
    [name, ...new Set([...base, ...(extra[name] ?? [])])].join(' ');
  const optional = (name: ReportOnlyDirective) => (extra[name]?.length ? [directive(name, ["'self'"])] : []);
  // No frame-ancestors here: it is enforced already, and Safari refuses it in a report-only policy.
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    directive('img-src', ["'self'", 'data:', 'blob:', 'https:']),
    directive('font-src', ["'self'", 'data:', 'https:']),
    directive('style-src', ["'self'", "'unsafe-inline'", 'https:']),
    // Next.js pages need inline scripts unless every page carries a nonce.
    directive('script-src', ["'self'", "'unsafe-inline'", ...analyticsScriptSources(env)]),
    directive('connect-src', ["'self'", 'https:', 'wss:']),
    directive('frame-src', ["'self'", 'https:']),
    ...optional('media-src'),
    ...optional('worker-src'),
    // Without somewhere to report to, Safari logs an error on every page and Firefox a warning.
    `report-uri ${CSP_REPORT_PATH}`
  ].join('; ');
}

export function securityHeaders(pathname: string, site: SiteSecurityHeaders, env: SecurityHeaderEnv = readEnv()) {
  const skip = new Set((site.sentByWebServer ?? []).map((name) => name.toLowerCase()));
  const headers: Record<string, string> = {};
  const add = (name: string, value: string) => {
    if (!skip.has(name.toLowerCase())) headers[name] = value;
  };
  for (const [name, value] of Object.entries(STATIC_HEADERS)) add(name, value);
  // X-Frame-Options cannot name another origin, so it is sent only where nothing but the site may frame it.
  if (!site.themeEditorPreview) add('X-Frame-Options', 'SAMEORIGIN');
  if (pathname !== ASSET_FILE_PATH) add('Content-Security-Policy', frameAncestors(site, env));
  if (env.production) {
    add('Strict-Transport-Security', HSTS_THIS_HOST_ONLY);
    if (pathname !== ASSET_FILE_PATH) {
      add('Content-Security-Policy-Report-Only', reportOnlyContentSecurityPolicy(site, env));
    }
  }
  return headers;
}

// Adds the headers without replacing any the proxy already set for this path (the file sandbox, no-referrer on
// emailed links), so the stricter path-specific values stay.
export function applySecurityHeaders<T extends NextResponse>(response: T, pathname: string, site: SiteSecurityHeaders) {
  for (const [name, value] of Object.entries(securityHeaders(pathname, site))) {
    if (!response.headers.has(name)) response.headers.set(name, value);
  }
  return response;
}
