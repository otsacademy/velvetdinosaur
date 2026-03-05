import type { MetadataRoute } from 'next';

const DISALLOW_PATHS = [
  '/admin',
  '/edit',
  '/preview',
  '/sign-in',
  '/sign-up',
  '/api',
  '/docs',
  '/assets',
  '/themes',
  '/theme',
  '/installer',
  '/components',
  '/cms'
];

function resolveSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.VD_SITE_URL || '';
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW_PATHS
      }
    ],
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined
  };
}
