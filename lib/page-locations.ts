import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/page-locations.ts');

import { cacheLife, cacheTag, unstable_noStore } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { pageTags } from '@/lib/cache-tags';
import { pageHref } from '@/lib/page-paths';
import { slugToPathname } from '@/lib/site-pages';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import type { PageDoc } from '@/lib/pages-shared';

const disablePageCache =
  process.env.VD_DISABLE_PAGE_CACHE === 'true' || process.env.VD_DISABLE_PAGE_CACHE === '1';

function applyCacheLife(profile: 'minutes' | 'hours') {
  if (disablePageCache) {
    cacheLife('seconds');
    return;
  }
  // next 16.2's build-time checker rejects a union argument against the
  // cacheLife overloads; call with literals instead.
  if (profile === 'minutes') {
    cacheLife('minutes');
  } else {
    cacheLife('hours');
  }
}

function applyNoStore() {
  if (disablePageCache) {
    unstable_noStore();
  }
}

// A page's public URL: explicit path wins, then the legacy SITE_PAGE_DEFS
// flattened-slug mapping (our-work-journal -> /our-work/journal), then /<slug>.
export function sitePageHref(page: { slug: string; path?: string | null }) {
  if (page.path) return `/${page.path}`;
  const mapped = slugToPathname(page.slug);
  if (mapped) return mapped;
  return pageHref(page);
}

// Resolves the page occupying a public path: exact `path` match first, then
// legacy slug-as-path for single-segment paths — but only when that page has
// no explicit path (a moved page must not stay reachable at /<slug>).
async function resolvePageForPathUncached(path: string): Promise<PageDoc | null> {
  const conn = await connectDB();
  if (!conn) {
    return null;
  }
  const byPath = (await Page.findOne({ path }).lean()) as PageDoc | null;
  if (byPath) return byPath;
  if (path.includes('/')) return null;
  const bySlug = (await Page.findOne({ slug: path }).lean()) as PageDoc | null;
  if (bySlug && !bySlug.path) return bySlug;
  return null;
}

async function resolvePageForPathCached(path: string): Promise<PageDoc | null> {
  'use cache';
  applyCacheLife('minutes');
  cacheTag(pageTags.content);
  return resolvePageForPathUncached(path);
}

export async function resolvePageForPath(path: string): Promise<PageDoc | null> {
  if (disablePageCache) {
    applyNoStore();
    return resolvePageForPathUncached(path);
  }
  return resolvePageForPathCached(path);
}

// Resolves a redirect record for a path to the target page's *current* href.
// Chains collapse automatically because redirects point at the stable slug.
async function resolveRedirectForPathUncached(path: string): Promise<string | null> {
  const conn = await connectDB();
  if (!conn) return null;
  const { PageRedirect } = await import('@/models/PageRedirect');
  const record = (await PageRedirect.findOne({ fromPath: path }).lean()) as {
    toSlug?: string;
  } | null;
  if (!record?.toSlug) return null;
  const target = (await Page.findOne({ slug: record.toSlug })
    .select({ slug: 1, path: 1 })
    .lean()) as PageDoc | null;
  if (!target) return null;
  const href = sitePageHref(target);
  if (href === `/${path}`) return null;
  return href;
}

async function resolveRedirectForPathCached(path: string): Promise<string | null> {
  'use cache';
  applyCacheLife('minutes');
  cacheTag(pageTags.content);
  cacheTag(pageTags.redirects);
  return resolveRedirectForPathUncached(path);
}

export async function resolveRedirectForPath(path: string): Promise<string | null> {
  if (disablePageCache) {
    applyNoStore();
    return resolveRedirectForPathUncached(path);
  }
  return resolveRedirectForPathCached(path);
}

async function listPublishedPagePathsUncached(): Promise<
  Array<{ href: string; lastModified?: Date }>
> {
  const conn = await connectDB();
  if (!conn) {
    return [];
  }
  const pages = (await Page.find({
    $or: [
      { publishedData: { $exists: true, $ne: null } },
      { data: { $exists: true, $ne: null } }
    ]
  })
    .select({ slug: 1, path: 1, publishedAt: 1, updatedAt: 1 })
    .lean()) as Array<{ slug?: string; path?: string; publishedAt?: Date; updatedAt?: Date }>;

  return pages
    .filter((page): page is { slug: string; path?: string; publishedAt?: Date; updatedAt?: Date } =>
      Boolean(page.slug) && !isSiteChromeSlug(page.slug)
    )
    .map((page) => ({
      href: sitePageHref(page),
      lastModified: page.publishedAt ?? page.updatedAt
    }));
}

async function listPublishedPagePathsCached() {
  'use cache';
  applyCacheLife('hours');
  cacheTag(pageTags.content);
  return listPublishedPagePathsUncached();
}

export async function listPublishedPagePaths() {
  if (disablePageCache) {
    applyNoStore();
    return listPublishedPagePathsUncached();
  }
  return listPublishedPagePathsCached();
}
