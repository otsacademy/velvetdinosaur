const DEFAULT_AUTH_DESTINATION = '/edit';

export function resolveSafeAuthDestination(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_DESTINATION
) {
  const candidate = value?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback;
  }

  try {
    const url = new URL(candidate, 'https://velvetdinosaur.com');
    if (url.origin !== 'https://velvetdinosaur.com') {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
