export function resolveCanonicalOrigin() {
  const raw =
    process.env.CANONICAL_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    '';

  if (!raw) return '';

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.origin;
  } catch {
    return '';
  }
}
export function isDemoSite() {
  const explicit = (process.env.VD_DEMO_SITE || '').trim().toLowerCase();
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;

  const origin = resolveCanonicalOrigin();
  if (!origin) return false;

  try {
    return new URL(origin).hostname.endsWith('.velvetdinosaur.com');
  } catch {
    return false;
  }
}
