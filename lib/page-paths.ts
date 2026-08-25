// Shared page URL/location helpers.
// Client-safe: imported by editor dialogs and server routes alike — no server-only imports.
import { SITE_CHROME_SLUGS } from '@/lib/site-chrome-slugs';

export const SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_PATH_SEGMENTS = 5;
export const MAX_PATH_LENGTH = 200;

// Private route namespaces that must never be crawled. robots.ts consumes this
// so the robots disallow list and the reserved-name list cannot drift apart.
export const ROBOTS_DISALLOW_SEGMENTS = [
  'admin',
  'edit',
  'preview',
  'sign-in',
  'sign-up',
  'account',
  'api',
  'docs',
  'assets',
  'themes',
  'theme',
  'installer',
  'components',
  'cms'
] as const;

// First URL segments editors can never claim: the private namespaces above,
// plus static public routes and feature namespaces (stays serves /stays/*).
export const RESERVED_FIRST_SEGMENTS: ReadonlySet<string> = new Set([
  ...ROBOTS_DISALLOW_SEGMENTS,
  'install',
  'contact',
  'business-reviews',
  'legal',
  'stays',
  ...SITE_CHROME_SLUGS
]);

export function slugifySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Coercing normalizer for editor input ("/Our Work/ASAP Award" -> "our-work/asap-award").
// Returns null when nothing valid remains.
export function normalizePath(raw: string): string | null {
  const decoded = safeDecode(String(raw ?? '')).trim();
  const segments = decoded
    .split('/')
    .map((segment) => slugifySegment(segment))
    .filter(Boolean);
  if (!segments.length || segments.length > MAX_PATH_SEGMENTS) return null;
  const path = segments.join('/');
  if (path.length > MAX_PATH_LENGTH) return null;
  return path;
}

// Strict normalizer for incoming request URL segments: no coercion beyond
// decode/lowercase, so content is only served at its canonical URL.
export function normalizePathFromSegments(segments: readonly string[]): string | null {
  if (!segments.length || segments.length > MAX_PATH_SEGMENTS) return null;
  const normalized = segments.map((segment) => safeDecode(segment).trim().toLowerCase());
  if (!normalized.every((segment) => SEGMENT_PATTERN.test(segment))) return null;
  const path = normalized.join('/');
  if (path.length > MAX_PATH_LENGTH) return null;
  return path;
}

export function isReservedPath(path: string) {
  if (path === 'home') return true;
  const first = path.split('/', 1)[0];
  return RESERVED_FIRST_SEGMENTS.has(first);
}

export type PageHrefInput = { slug: string; path?: string | null };

// The single source of truth mapping a page record to its public URL.
export function pageHref(page: PageHrefInput): string {
  if (page.path) return `/${page.path}`;
  if (page.slug === 'home') return '/';
  if (page.slug.startsWith('stay-')) return `/stays/${page.slug.slice(5)}`;
  return `/${page.slug}`;
}

// Deterministic default slug for a page created at a path. Always single-segment,
// so /edit/[slug] and /api/cms/pages/[slug] keep working unchanged.
export function slugFromPath(path: string) {
  return path.replace(/\//g, '-');
}

export function editHref(slug: string) {
  // Keep page editing under a dedicated namespace. A stored page slug can
  // legitimately match a static editor route (for example `reviews`).
  return `/edit/pages/${encodeURIComponent(slug)}`;
}

export function previewHref(slug: string) {
  return `/preview/${encodeURIComponent(slug)}`;
}
