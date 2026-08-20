function toUrlOrigin(value: string | undefined | null) {
  try {
    return new URL(value || '').origin;
  } catch {
    return '';
  }
}

export function resolveConfiguredAuthOrigin(fallbackUrl?: string | null) {
  return (
    toUrlOrigin(process.env.BETTERAUTH_URL) ||
    toUrlOrigin(process.env.NEXT_PUBLIC_BETTERAUTH_URL) ||
    toUrlOrigin(process.env.NEXT_PUBLIC_BASE_URL) ||
    toUrlOrigin(process.env.PUBLIC_BASE_URL) ||
    toUrlOrigin(fallbackUrl)
  );
}

export function resolveConfiguredSiteOrigin(fallbackUrl?: string | null) {
  return (
    toUrlOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    toUrlOrigin(process.env.VD_SITE_URL) ||
    toUrlOrigin(process.env.NEXT_PUBLIC_BASE_URL) ||
    toUrlOrigin(process.env.PUBLIC_BASE_URL) ||
    toUrlOrigin(process.env.BETTERAUTH_URL) ||
    toUrlOrigin(process.env.NEXT_PUBLIC_BETTERAUTH_URL) ||
    toUrlOrigin(fallbackUrl)
  );
}
