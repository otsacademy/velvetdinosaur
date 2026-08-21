import { FileText, Scale, type LucideIcon } from 'lucide-react';
import type { PageRow } from '@/components/edit/pages-index-types';
import { SITE_PAGE_METADATA, inferSitePageMetadata, type SitePageMetadata } from '@/components/edit/pages-index-metadata.site';
import { sitePageFallbackTitle, slugToPathname } from '@/lib/site-pages';

type PageMetadata = SitePageMetadata;

const DEFAULT_METADATA: PageMetadata = {
  description: 'Page content, layout, and publishing configuration.',
  icon: FileText
};

function humanizeSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildPagePath(slug: string) {
  const mapped = slugToPathname(slug);
  if (mapped) return mapped;
  return `/${slug}`;
}

function inferMetadata(slug: string): PageMetadata {
  if (slug.startsWith('legal-') || slug.includes('privacy') || slug.includes('terms') || slug.includes('policy')) {
    return {
      title: humanizeSlug(slug),
      description: 'Legal and policy information for visitors and members.',
      icon: Scale
    };
  }

  return {
    ...DEFAULT_METADATA,
    title: humanizeSlug(slug)
  };
}

function resolveTitle(page: PageRow, slug: string, metadata: PageMetadata) {
  const authoredTitle = typeof page.title === 'string' ? page.title.trim() : '';
  if (authoredTitle) {
    const normalizedAuthored = authoredTitle.toLowerCase();
    const slugWithSpaces = slug.replaceAll('-', ' ');
    if (normalizedAuthored !== slug && normalizedAuthored !== slugWithSpaces) {
      return authoredTitle;
    }
  }

  if (metadata.title) return metadata.title;

  const fallback = sitePageFallbackTitle(slug).trim();
  if (!fallback || fallback.toLowerCase() === slug) {
    return humanizeSlug(slug);
  }
  return fallback;
}

export type ResolvedPageMetadata = {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
};

export function getPageMetadata(page: PageRow): ResolvedPageMetadata {
  const slug = page.slug.trim().toLowerCase();
  const metadata = SITE_PAGE_METADATA[slug] || inferSitePageMetadata(slug) || inferMetadata(slug);
  return {
    title: resolveTitle(page, slug, metadata),
    description: metadata.description || DEFAULT_METADATA.description,
    icon: metadata.icon || DEFAULT_METADATA.icon,
    path: buildPagePath(slug)
  };
}
