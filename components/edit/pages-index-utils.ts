import type { PageRow, SortKey } from '@/components/edit/pages-index-types';
import { slugToPathname } from '@/lib/site-pages';
import { getSitePageBySlug } from '@/lib/site-pages';
import type { PageHrefInput } from '@/lib/page-paths';
import { isStaticSitePathname } from '@/lib/site-reserved-paths';

export function formatWhen(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function liveHref(page: PageHrefInput) {
  if (page.path) return `/${page.path}`;
  const mapped = slugToPathname(page.slug);
  if (mapped) return mapped;
  if (page.slug.startsWith('stay-')) return `/stays/${page.slug.slice(5)}`;
  return `/${page.slug}`;
}

export function canMovePage(page: Pick<PageRow, 'slug'>) {
  if (page.slug === 'home' || page.slug.startsWith('stay-')) return false;
  const sitePage = getSitePageBySlug(page.slug);
  return !(sitePage && isStaticSitePathname(sitePage.pathname));
}

export function isStayPageSlug(slug: string) {
  return slug === 'stays' || slug.startsWith('stay-');
}

export function isTextPageSlug(slug: string) {
  const normalized = slug.toLowerCase();
  if (normalized.startsWith('legal-')) return true;
  const textSlugs = new Set([
    'privacy',
    'terms',
    'cookies',
    'cookie-policy',
    'policy',
    'policies',
    'legal'
  ]);
  if (textSlugs.has(normalized)) return true;
  return normalized.includes('privacy') || normalized.includes('terms');
}

function parseTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function toRelativeOrAbsolute(time: number) {
  const now = Date.now();
  const deltaMs = now - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (deltaMs < hour) {
    const minutes = Math.max(1, Math.round(deltaMs / minute));
    return `${minutes} min ago`;
  }

  if (deltaMs < day) {
    const hours = Math.round(deltaMs / hour);
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  }

  if (deltaMs < day * 30) {
    const days = Math.round(deltaMs / day);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(time));
}

export function getPageLastUpdatedTime(page: PageRow) {
  const draft = parseTime(page.draftUpdatedAt);
  const published = parseTime(page.publishedAt);
  const updated = parseTime(page.updatedAt);
  return Math.max(draft, published, updated);
}

export function getPageLastUpdatedLabel(page: PageRow) {
  const lastUpdated = getPageLastUpdatedTime(page);
  if (!lastUpdated) return null;
  return toRelativeOrAbsolute(lastUpdated);
}

export function getSortValue(page: PageRow, key: SortKey) {
  const draft = parseTime(page.draftUpdatedAt);
  const published = parseTime(page.publishedAt);
  const updated = parseTime(page.updatedAt);

  if (key === 'draft-desc') return draft;
  if (key === 'published-desc') return published;
  if (key === 'updated-desc') return Math.max(draft, published, updated);
  return 0;
}
