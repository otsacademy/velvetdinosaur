import type { MetadataRoute } from 'next';
import { resolveSiteUrl } from '@/lib/site-metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl().replace(/\/$/, '');
  const baseUrl = siteUrl || 'http://localhost:3000';
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified
    },
    {
      url: `${baseUrl}/work`,
      lastModified
    }
  ];
}
