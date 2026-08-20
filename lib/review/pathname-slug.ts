import { getSitePageByPathname, slugToPathname } from '@/lib/site-pages';

const REVIEW_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REVIEW_PATH_KEY_PREFIX = 'review-path-';

export const REVIEW_BLOCKED_TOP_LEVEL_SEGMENTS = new Set([
  'api',
  'preview',
  'review',
  '_next',
  'sign-in',
  'sign-up',
  'forgot-password',
  'review-screenshots'
]);

export const REVIEW_INTERNAL_TOP_LEVEL_SEGMENTS = new Set([
  'admin',
  'edit',
  'account',
  'email-preview'
]);

function normalizePageSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export function normalizeReviewPathname(pathname: string) {
  const value = pathname.trim();
  if (!value) return '/';

  const withoutQuery = value.split('?')[0]?.split('#')[0] || '';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, '/');
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }
  return collapsed;
}

function pathnameToPageSlug(pathname: string) {
  const normalizedPathname = normalizeReviewPathname(pathname);
  if (normalizedPathname === '/') return 'home';
  return normalizedPathname
    .split('/')
    .filter(Boolean)
    .map((segment) => normalizePageSlug(segment))
    .join('-');
}

function pageSlugToPathname(slug: string) {
  const mapped = slugToPathname(slug);
  if (mapped) return mapped;
  if (slug === 'home') return '/';
  return `/${slug}`;
}

function getFirstPathSegment(pathname: string) {
  return normalizeReviewPathname(pathname)
    .split('/')
    .filter(Boolean)
    .map((segment) => normalizePageSlug(segment))
    .find(Boolean);
}

function toHexPath(pathname: string) {
  return Array.from(pathname)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

function fromHexPath(value: string) {
  if (!value || value.length % 2 !== 0) return null;
  if (!/^[a-f0-9]+$/i.test(value)) return null;
  let output = '';
  for (let index = 0; index < value.length; index += 2) {
    const code = Number.parseInt(value.slice(index, index + 2), 16);
    if (Number.isNaN(code)) return null;
    output += String.fromCharCode(code);
  }
  return output;
}

function encodeReviewPathKey(pathname: string) {
  return `${REVIEW_PATH_KEY_PREFIX}${toHexPath(pathname)}`;
}

function decodeReviewPathKey(key: string) {
  if (!key.startsWith(REVIEW_PATH_KEY_PREFIX)) return null;
  const encoded = key.slice(REVIEW_PATH_KEY_PREFIX.length);
  const decoded = fromHexPath(encoded);
  if (!decoded) return null;
  const normalized = normalizeReviewPathname(decoded);
  if (!normalized.startsWith('/')) return null;
  return normalized;
}

export function reviewSlugToPathname(slug: string) {
  const normalizedSlug = normalizePageSlug(slug);
  if (!normalizedSlug) return null;

  if (normalizedSlug.startsWith(REVIEW_PATH_KEY_PREFIX)) {
    return decodeReviewPathKey(normalizedSlug);
  }

  if (normalizedSlug !== 'home' && !REVIEW_SLUG_PATTERN.test(normalizedSlug)) return null;
  return pageSlugToPathname(normalizedSlug);
}

export function previewSlugToPathname(slug: string) {
  return reviewSlugToPathname(slug);
}

export function isReviewPathBlocked(pathname: string) {
  const normalizedPathname = normalizeReviewPathname(pathname);
  if (normalizedPathname === '/') return false;

  const firstSegment = getFirstPathSegment(normalizedPathname);
  if (!firstSegment) return true;
  return REVIEW_BLOCKED_TOP_LEVEL_SEGMENTS.has(firstSegment);
}

export function isInternalReviewPath(pathname: string) {
  const normalizedPathname = normalizeReviewPathname(pathname);
  if (normalizedPathname === '/') return false;
  const firstSegment = getFirstPathSegment(normalizedPathname);
  if (!firstSegment) return false;
  return REVIEW_INTERNAL_TOP_LEVEL_SEGMENTS.has(firstSegment);
}

function canUseLegacySlug(pathname: string) {
  if (pathname === '/') return true;
  if (getSitePageByPathname(pathname)) return true;
  const segments = pathname.split('/').filter(Boolean);
  return segments.length === 1;
}

export function pathnameToReviewSlug(pathname: string) {
  const normalizedPathname = normalizeReviewPathname(pathname);
  if (isReviewPathBlocked(normalizedPathname)) return null;
  if (canUseLegacySlug(normalizedPathname)) {
    return pathnameToPageSlug(normalizedPathname);
  }
  return encodeReviewPathKey(normalizedPathname);
}
