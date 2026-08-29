export const DEMO_DISCLAIMER =
  "Unofficial website concept prepared privately by Velvet Dinosaur. This is not the business's current website.";

export const DEMO_ACTION_MESSAGE =
  'This is a private website demonstration. Public enquiries, bookings, subscriptions, orders and payments are disabled.';

const NON_PUBLIC_PREFIXES = [
  '/account',
  '/admin',
  '/edit',
  '/preview',
  '/reset-password',
  '/sign-in',
  '/sign-up'
];
const INTERNAL_MUTATION_PREFIXES = [
  '/api/account',
  '/api/admin',
  '/api/assets',
  '/api/calendar',
  '/api/cms',
  '/api/components',
  '/api/inbox',
  '/api/news',
  '/api/pages',
  '/api/puck',
  '/api/review',
  '/api/support',
  '/api/theme',
  '/api/vd-telemetry'
];

const PUBLIC_SIDE_EFFECT_SEGMENTS = new Set([
  'basket',
  'baskets',
  'booking',
  'bookings',
  'cart',
  'checkout',
  'contact',
  'enquiry',
  'enquiries',
  'order',
  'orders',
  'payment',
  'payments',
  'register',
  'registration',
  'reservations',
  'subscribe',
  'subscription'
]);

function normalizePathname(value: string) {
  const pathname = String(value || '/').split(/[?#]/, 1)[0] || '/';
  return pathname.startsWith('/') ? pathname.toLowerCase() : `/${pathname.toLowerCase()}`;
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicDemoPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  return !NON_PUBLIC_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix));
}

export function shouldBlockDemoSideEffect(pathname: string, method: string) {
  const normalized = normalizePathname(pathname);
  if (!normalized.startsWith('/api/')) return false;
  if (INTERNAL_MUTATION_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix))) return false;

  if (matchesPrefix(normalized, '/api/auth/sign-up') || matchesPrefix(normalized, '/api/auth/signup')) {
    return true;
  }
  if (matchesPrefix(normalized, '/api/newsletter') && normalized !== '/api/newsletter/settings') {
    return true;
  }
  if (/^\/api\/events\/[^/]+\/(register|registration)$/.test(normalized)) return true;
  if (normalized === '/api/contact' || normalized === '/api/stays/enquiry') return true;

  const normalizedMethod = String(method || 'GET').toUpperCase();
  if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD' || normalizedMethod === 'OPTIONS') {
    return false;
  }

  const segments = normalized.split('/').filter(Boolean).slice(1);
  return segments.some((segment) => PUBLIC_SIDE_EFFECT_SEGMENTS.has(segment));
}

export function isPublicSearchForm(form: HTMLFormElement) {
  const role = (form.getAttribute('role') || '').trim().toLowerCase();
  const action = normalizePathname(form.getAttribute('action') || '');
  return role === 'search' || action === '/search' || action.startsWith('/search/');
}

export function isBlockedPublicActionHref(href: string) {
  const value = String(href || '').trim();
  if (/^(mailto|tel):/i.test(value)) return true;
  if (!value) return false;

  try {
    const parsed = new URL(value, 'https://demo.invalid');
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'wa.me' ||
      hostname === 'api.whatsapp.com' ||
      hostname.endsWith('.whatsapp.com') ||
      hostname.endsWith('.resdiary.com') ||
      hostname.endsWith('.opentable.com') ||
      hostname.endsWith('.bookatable.com')
    ) {
      return true;
    }
    const segments = parsed.pathname.toLowerCase().split('/').filter(Boolean);
    return segments.some((segment) => PUBLIC_SIDE_EFFECT_SEGMENTS.has(segment));
  } catch {
    return false;
  }
}

export function isBlockedPublicActionLabel(label: string) {
  return /\b(book|buy|checkout|contact|enquire|enquiry|order|pay|purchase|reserve|subscribe)\b/i.test(
    String(label || '')
  );
}
