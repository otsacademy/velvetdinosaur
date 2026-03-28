import type { MetadataRoute } from 'next';
import { resolveSiteUrl } from '@/lib/site-metadata';

const DISALLOW_PATHS = [
  '/admin',
  '/edit',
  '/preview',
  '/login',
  '/sign-in',
  '/sign-up',
  '/api',
  '/docs',
  '/assets',
  '/themes',
  '/theme',
  '/installer',
  '/components',
  '/cms',
  '/demo'
];

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
