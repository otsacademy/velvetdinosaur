import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { isInstallerAdmin } from '@/lib/admin';
import { listPages } from '@/lib/pages';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { PagesIndex } from '@/components/edit/pages-index.client';
import { getWorkArticlesForEdit } from '@/lib/work-articles.server';
import { getNewsArticlesForEdit } from '@/lib/news-articles.server';
import { getEventsForEdit } from '@/lib/events.server';

type EditIndexProps = {
  searchParams?: Promise<{ slug?: string }> | { slug?: string };
};

async function EditIndexContent({ searchParams }: EditIndexProps) {
  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN;
  const isSmoke = Boolean(smokeToken && requestHeaders.get('x-vd-editor-smoke') === smokeToken);
  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit');
  }

  const resolvedSearchParams = await Promise.resolve(searchParams);
  const querySlug =
    typeof resolvedSearchParams?.slug === 'string' ? resolvedSearchParams.slug : '';
  if (querySlug) {
    redirect(`/edit/${encodeURIComponent(querySlug)}`);
  }

  const pages = (await listPages()).filter((page) => !isSiteChromeSlug(page.slug));
  const [workArticles, newsArticles, events] = await Promise.all([
    getWorkArticlesForEdit(),
    getNewsArticlesForEdit(),
    getEventsForEdit()
  ]);
  const sessionEmail =
    (session as { user?: { email?: string | null } } | null)?.user?.email || null;
  const platformAdmin = isInstallerAdmin(sessionEmail);
  const serialPages = pages.map((page) => ({
    ...page,
    draftUpdatedAt: page.draftUpdatedAt ? page.draftUpdatedAt.toISOString() : null,
    publishedAt: page.publishedAt ? page.publishedAt.toISOString() : null,
    updatedAt: page.updatedAt ? page.updatedAt.toISOString() : null
  }));

  return (
    <PagesIndex
      pages={serialPages}
      workArticles={workArticles}
      newsArticles={newsArticles}
      events={events}
      platformAdmin={platformAdmin}
    />
  );
}

export default function EditIndexPage(props: EditIndexProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading pages…</div>}>
      <EditIndexContent {...props} />
    </Suspense>
  );
}
