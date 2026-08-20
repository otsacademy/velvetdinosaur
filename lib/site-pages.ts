export type SitePageDef = {
  slug: string;
  title: string;
  pathname: string;
};

export const SITE_PAGE_DEFS: SitePageDef[] = [
  { slug: 'home', title: 'Home', pathname: '/' },
  { slug: 'about', title: 'About', pathname: '/about' },
  { slug: 'work', title: 'Work', pathname: '/work' },
  { slug: 'news', title: 'News', pathname: '/news' },
  { slug: 'contact', title: 'Contact', pathname: '/contact' },
  { slug: 'audit', title: 'Website Audit', pathname: '/audit' },
  { slug: 'privacy', title: 'Privacy Policy', pathname: '/privacy' },
  { slug: 'terms', title: 'Terms of Service', pathname: '/terms' }
];

const SITE_PAGE_BY_SLUG = new Map(SITE_PAGE_DEFS.map((page) => [page.slug, page] as const));
const SITE_PAGE_BY_PATHNAME = new Map(SITE_PAGE_DEFS.map((page) => [page.pathname, page] as const));

export function getSitePageBySlug(slug: string) {
  return SITE_PAGE_BY_SLUG.get((slug || '').trim().toLowerCase()) || null;
}

export function getSitePageByPathname(pathname: string) {
  return SITE_PAGE_BY_PATHNAME.get(pathname) || null;
}

export function slugToPathname(slug: string) {
  const normalized = (slug || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'home') return '/';
  return getSitePageBySlug(normalized)?.pathname || `/${normalized}`;
}

export function sitePageFallbackTitle(slug: string) {
  const normalized = (slug || '').trim().toLowerCase();
  if (!normalized) return '';
  return getSitePageBySlug(normalized)?.title || normalized;
}
