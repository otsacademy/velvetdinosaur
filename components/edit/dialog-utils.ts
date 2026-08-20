import { slugifySegment } from '@/lib/page-paths';

export function slugify(value: string) {
  return slugifySegment(value);
}

export function cleanText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function parseList(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

export function compactObject<T extends Record<string, unknown>>(value: T) {
  const entries = Object.entries(value).filter(([, val]) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && !val.trim()) return false;
    return true;
  });
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}
