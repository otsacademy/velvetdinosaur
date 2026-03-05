import type { Data } from '@measured/puck';
import { getDraftPageData, getPublishedPageData } from '@/lib/pages';
import { SITE_FOOTER_SLUG, SITE_HEADER_SLUG } from '@/lib/site-chrome-slugs';

export type SiteChrome = {
  header: Data;
  footer: Data;
};

export async function getPublishedSiteChrome(): Promise<SiteChrome> {
  const [header, footer] = await Promise.all([
    getPublishedPageData(SITE_HEADER_SLUG),
    getPublishedPageData(SITE_FOOTER_SLUG)
  ]);

  return { header, footer };
}

export async function getDraftSiteChrome(): Promise<SiteChrome> {
  const [header, footer] = await Promise.all([
    getDraftPageData(SITE_HEADER_SLUG),
    getDraftPageData(SITE_FOOTER_SLUG)
  ]);

  return { header, footer };
}
