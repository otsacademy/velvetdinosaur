import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/business-reviews/security.ts');

import { resolveConfiguredAuthOrigin, resolveConfiguredSiteOrigin } from '@/lib/request-origin';

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

export function isTrustedMutationRequest(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;

  const origin = normalizeOrigin(request.headers.get('origin'));
  if (!origin) return process.env.NODE_ENV !== 'production';

  const allowed = new Set(
    [
      normalizeOrigin(request.url),
      normalizeOrigin(resolveConfiguredSiteOrigin(request.url)),
      normalizeOrigin(resolveConfiguredAuthOrigin(request.url))
    ].filter(Boolean)
  );
  return allowed.has(origin);
}
