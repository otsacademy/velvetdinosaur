const isLhci = process.env.VD_LHCI === 'true' || process.env.NEXT_PUBLIC_LHCI === 'true';

export const isAdminOnly = () =>
  !isLhci && (process.env.VD_ADMIN_ONLY === 'true' || process.env.NEXT_PUBLIC_ADMIN_ONLY === 'true');

export const adminHomePath = '/admin';

export const siteConfig = {
  googleReviewsUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL || ''
};

// Who this site is, for fallbacks in shared code: unsigned news, event
// organisers, default author and profile pictures, calendar files. The same
// functions as the template's lib/site-config.ts, with this site's defaults.
const SITE_IDENTITY_NAME = 'Velvet Dinosaur';
const SITE_IDENTITY_LOGO_PATH = '/brand/mark-navy.png';

function cleanIdentityValue(value: string | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export function resolvePublicSiteName() {
  return cleanIdentityValue(process.env.NEXT_PUBLIC_SITE_NAME) || SITE_IDENTITY_NAME;
}

export function resolvePublicSiteLogoPath() {
  return cleanIdentityValue(process.env.NEXT_PUBLIC_SITE_LOGO_PATH) || SITE_IDENTITY_LOGO_PATH;
}

export function resolvePublicSiteTeamName(siteName = resolvePublicSiteName()) {
  return cleanIdentityValue(process.env.NEXT_PUBLIC_SITE_TEAM_NAME) || `${siteName} Team`;
}

export function resolvePublicSiteEditorialName(siteName = resolvePublicSiteName()) {
  return cleanIdentityValue(process.env.NEXT_PUBLIC_SITE_EDITORIAL_NAME) || `${siteName} Editorial`;
}

export function resolvePublicSiteStaffName(siteName = resolvePublicSiteName()) {
  return cleanIdentityValue(process.env.NEXT_PUBLIC_SITE_STAFF_NAME) || `${siteName} Staff`;
}
