import type { MetadataRoute } from 'next';

function resolveSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.VD_SITE_URL || 'http://localhost:3000';
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl().replace(/\/$/, '');
  return [
    {
      url: siteUrl || 'http://localhost:3000',
      lastModified: new Date()
    }
  ];
}
