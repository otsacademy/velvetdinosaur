import type { Metadata } from 'next';
import { socialPreviewAlt } from '@/lib/site-copy';

export const siteName = 'Velvet Dinosaur';
// Search-facing title and description: they say what the business is and where,
// because that is what people type ("web design Witney"). The price is left out
// on purpose so this survives a change of pricing.
export const siteTitle = `Web design in Witney, Oxfordshire | ${siteName}`;
export const siteDescription =
  'Web designer based in Minster Lovell, near Witney. I build your new website first, so you see it before you pay. Hosting, updates and support included.';
export const socialTitle = `${siteName} | Your new website, built before you pay a penny — £99/month`;
export const socialDescription =
  'Managed websites designed and built before you pay anything — £99 a month, everything included, from a founder-led studio in Oxfordshire.';

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
