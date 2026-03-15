import type { MetadataRoute } from 'next';
import { resolveSiteUrl } from '@/lib/site-metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl().replace(/\/$/, '');
  return [
    {
      url: siteUrl || 'http://localhost:3000',
      lastModified: new Date()
    }
  ];
}
