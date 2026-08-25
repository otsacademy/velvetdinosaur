import { isReservedPath } from '@/lib/page-paths';
import { SITE_PAGE_DEFS } from '@/lib/site-pages';
import { SITE_CHROME_SLUGS } from '@/lib/site-chrome-slugs';

// Site-owned route inventory consumed by the shared pages-locations machinery.
// URL namespaces owned entirely by app routes with their own dynamic children —
// editor pages under them would be shadowed or collide.
const RESERVED_SITE_FIRST_SEGMENTS = new Set([
  'admin',
  'api',
  'assets',
  'bookings',
  'business-reviews',
  'calendar',
  'cms',
  'components',
  'contact-templates',
  'content',
  'demo',
  'docs',
  'edit',
  'inbox',
  'install',
  'installer',
  'legal',
  'login',
  'media',
  'new',
  'news',
  'newsletter',
  'nfc',
  'page-builder',
  'preview',
  'reviews',
  'routes',
  'sign-in',
  'sign-up',
  'stays',
  'support',
  'theme',
  'theme-editor',
  'themes',
  'work',
  ...SITE_CHROME_SLUGS
]);

// Exact URLs served by hardcoded routes under app/. Editor pages *beneath*
// these are fine (static segments win only on exact match).
const RESERVED_EXACT_PATHS = new Set(
  SITE_PAGE_DEFS.filter((page) => page.slug !== 'home').map((page) => page.pathname.replace(/^\/+/, ''))
);

export function isSitePathBlocked(path: string) {
  if (isReservedPath(path)) return true;
  const first = path.split('/', 1)[0];
  if (RESERVED_SITE_FIRST_SEGMENTS.has(first)) return true;
  return RESERVED_EXACT_PATHS.has(path);
}

/** True when the pathname is served by a hardcoded (site) route. */
export function isStaticSitePathname(pathname: string) {
  const path = pathname.replace(/^\/+/, '');
  return RESERVED_EXACT_PATHS.has(path) || path === '';
}
