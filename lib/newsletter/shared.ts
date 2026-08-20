import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/shared.ts');

export type NewsletterStatus = 'not_consented' | 'pending' | 'subscribed' | 'unsubscribed';

export function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value: unknown) {
  const normalized = clean(value).toLowerCase();
  return normalized;
}

export function toFirstName(value: unknown, fallbackEmail?: string) {
  const fromValue = clean(value)
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let source = fromValue;
  if (!source) {
    const email = normalizeEmail(fallbackEmail);
    const localPart = email.split('@')[0]?.split('+')[0] || '';
    source = localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const first = source.split(' ').find(Boolean) || '';
  return first ? `${first.charAt(0).toUpperCase()}${first.slice(1)}` : '';
}

export function toIdString(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'toString' in value) {
    const cast = value as { toString?: () => string };
    return cast.toString?.() || '';
  }
  return '';
}

export function hashLike(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}
