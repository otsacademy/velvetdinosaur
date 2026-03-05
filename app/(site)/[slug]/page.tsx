import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { PublishedDoc } from '@/lib/puck-render';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { getPageRecord } from '@/lib/pages';
import { SITE_CHROME_SLUGS } from '@/lib/site-chrome-slugs';

type PageParams = { slug: string };

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'edit',
  'preview',
  'sign-in',
  'sign-up',
  'docs',
  'assets',
  'themes',
  'theme',
  'installer',
  'install',
  'components',
  'cms',
  'contact',
  'legal',
  ...SITE_CHROME_SLUGS
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type PageRecord = {
  publishedData?: unknown;
  data?: unknown;
  status?: string | null;
} | null;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasPublishedContent(page: PageRecord) {
  if (!page) return false;
  return Boolean(page.publishedData ?? page.data ?? null);
}

function normalizeSlug(raw: string) {
  return safeDecode(raw).trim().toLowerCase();
}

function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug);
}

export default function SlugPage({ params }: { params: PageParams | Promise<PageParams> }) {
  return (
    <Suspense fallback={null}>
      <SlugPageContent params={params} />
    </Suspense>
  );
}

async function SlugPageContent({
  params
}: {
  params: PageParams | Promise<PageParams>;
}) {
  await connection();
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }
  const resolvedParams = await Promise.resolve(params);
  const slug = normalizeSlug(resolvedParams?.slug || '');

  if (!slug) {
    notFound();
  }
  if (slug === 'home') {
    redirect('/');
  }
  if (!isValidSlug(slug) || isReservedSlug(slug)) {
    notFound();
  }

  const page = await getPageRecord(slug);
  if (!hasPublishedContent(page)) {
    notFound();
  }

  return (
    <main>
      <PublishedDoc slug={slug} />
    </main>
  );
}
