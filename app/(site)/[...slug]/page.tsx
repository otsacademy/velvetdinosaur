import { Suspense } from 'react';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { PublishedDoc } from '@/lib/puck-render';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { resolvePageForPath, resolveRedirectForPath } from '@/lib/page-locations';
import { normalizePathFromSegments } from '@/lib/page-paths';
import { isSitePathBlocked } from '@/lib/site-reserved-paths';

type PageParams = { slug: string[] };

type PageRecord = {
  slug?: string;
  publishedData?: unknown;
  data?: unknown;
  status?: string | null;
} | null;

function hasPublishedContent(page: PageRecord) {
  if (!page) return false;
  return Boolean(page.publishedData ?? page.data ?? null);
}

type Resolution =
  | { kind: 'page'; page: NonNullable<PageRecord>; path: string }
  | { kind: 'redirect'; href: string }
  | { kind: 'home' }
  | { kind: 'not-found' };

// Resolution order: exact path match → legacy slug-as-path → redirect record → 404.
// A real page always shadows a stale redirect; redirects are permanent (308).
async function resolve(params: PageParams | Promise<PageParams>): Promise<Resolution> {
  const resolvedParams = await Promise.resolve(params);
  const segments = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [];
  const path = normalizePathFromSegments(segments);

  if (!path) return { kind: 'not-found' };
  if (path === 'home') return { kind: 'home' };
  if (isSitePathBlocked(path)) return { kind: 'not-found' };

  const page = (await resolvePageForPath(path)) as PageRecord;
  if (page && hasPublishedContent(page)) {
    return { kind: 'page', page, path };
  }

  const redirectHref = await resolveRedirectForPath(path);
  if (redirectHref) {
    return { kind: 'redirect', href: redirectHref };
  }

  return { kind: 'not-found' };
}

export default function SlugPage({ params }: { params: PageParams | Promise<PageParams> }) {
  return (
    <Suspense fallback={null}>
      <SlugPageContent params={params} />
    </Suspense>
  );
}

async function SlugPageContent({ params }: { params: PageParams | Promise<PageParams> }) {
  await connection();
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }

  const resolution = await resolve(params);
  if (resolution.kind === 'home') {
    redirect('/');
  }
  if (resolution.kind === 'redirect') {
    permanentRedirect(resolution.href);
  }
  if (resolution.kind !== 'page') {
    notFound();
  }

  const slug = typeof resolution.page.slug === 'string' ? resolution.page.slug : resolution.path;

  return (
    <main>
      <PublishedDoc slug={slug} />
    </main>
  );
}
