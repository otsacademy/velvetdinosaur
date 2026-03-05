export const SITE_HEADER_SLUG = 'global-header';
export const SITE_FOOTER_SLUG = 'global-footer';

export const SITE_CHROME_SLUGS = new Set([SITE_HEADER_SLUG, SITE_FOOTER_SLUG]);

export function isSiteChromeSlug(slug?: string | null) {
  if (!slug) return false;
  return SITE_CHROME_SLUGS.has(slug);
}
