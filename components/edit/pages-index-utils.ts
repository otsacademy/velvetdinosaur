import type { PageRow, SortKey } from '@/components/edit/pages-index-types';

export function formatWhen(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function liveHref(slug: string) {
  if (slug === 'home') return '/';
  if (slug.startsWith('stay-')) return `/stays/${slug.slice(5)}`;
  return `/${slug}`;
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

export function getSortValue(page: PageRow, key: SortKey) {
  const draft = parseTime(page.draftUpdatedAt);
  const published = parseTime(page.publishedAt);
  const updated = parseTime(page.updatedAt);

  if (key === 'draft-desc') return draft;
  if (key === 'published-desc') return published;
  if (key === 'updated-desc') return Math.max(draft, published, updated);
  return 0;
}
