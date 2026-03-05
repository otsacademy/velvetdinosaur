const isLhci = process.env.VD_LHCI === 'true' || process.env.NEXT_PUBLIC_LHCI === 'true';

export const isAdminOnly = () =>
  !isLhci && (process.env.VD_ADMIN_ONLY === 'true' || process.env.NEXT_PUBLIC_ADMIN_ONLY === 'true');

export const adminHomePath = '/admin/sites';

export const siteConfig = {
  googleReviewsUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL || ''
};
