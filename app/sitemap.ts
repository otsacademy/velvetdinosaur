import type { MetadataRoute } from 'next';
import { resolveSiteUrl } from '@/lib/site-metadata';

// The case studies the Work page links to (components/home/work-grid.client.tsx).
// Listed by hand so the sitemap stays static and never waits on the database;
// add a slug here when a new case study is given a card on the Work page.
const CASE_STUDY_SLUGS = [
  'academics-stand-against-poverty',
  'the-brave',
  'rising-dust-adventures',
  'scholardemia'
] as const;

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
    },
    {
      url: `${baseUrl}/about`,
      lastModified
    },
    {
      url: `${baseUrl}/contact`,
      lastModified
    },
    {
      url: `${baseUrl}/audit`,
      lastModified
    },
    ...CASE_STUDY_SLUGS.map((slug) => ({
      url: `${baseUrl}/work/${slug}`,
      lastModified
    }))
  ];
}
