import type { Metadata } from 'next';
import { mainHeroCopy, socialPreviewAlt } from '@/lib/site-copy';

export const siteName = 'Velvet Dinosaur';
export const siteTitle = `${mainHeroCopy.heading} | ${siteName}`;
export const siteDescription = mainHeroCopy.description;
export const socialTitle = `${siteName} | Founder-led bespoke websites and apps`;
export const socialDescription =
  'Founder-led bespoke websites, web apps, and mobile apps built for conversion, search visibility, and long-term maintainability.';

const fallbackSiteUrl = 'http://localhost:3000';

function normalizeSiteUrl(candidate: string | undefined | null) {
  const value = String(candidate || '').trim();
  if (!value) return null;

  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    try {
      return new URL(`https://${value.replace(/^\/+|\/+$/g, '')}`).toString().replace(/\/$/, '');
    } catch {
      return null;
    }
  }
}

export function resolveSiteUrl() {
  const candidates = [
    process.env.CANONICAL_ORIGIN,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VD_SITE_URL,
    process.env.DOMAIN
  ];

  for (const candidate of candidates) {
    const resolved = normalizeSiteUrl(candidate);
    if (resolved) return resolved;
  }

  return fallbackSiteUrl;
}

export function resolveMetadataBase() {
  return new URL(resolveSiteUrl());
}

export const siteMetadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName,
    title: socialTitle,
    description: socialDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: socialPreviewAlt
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: socialTitle,
    description: socialDescription,
    images: ['/twitter-image']
  }
};
