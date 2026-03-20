import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { listPages } from '@/lib/pages';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { PagesIndex } from '@/components/edit/pages-index.client';
import { getWorkArticlesForEdit } from '@/lib/work-articles.server';

type EditIndexProps = {
  searchParams?: { slug?: string };
};

async function EditIndexContent({ searchParams }: EditIndexProps) {
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }
  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN;
  const isSmoke = Boolean(smokeToken && requestHeaders.get('x-vd-editor-smoke') === smokeToken);
  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit');
  }

  const querySlug = typeof searchParams?.slug === 'string' ? searchParams.slug : '';
  if (querySlug) {
    redirect(`/edit/${encodeURIComponent(querySlug)}`);
  }

  const pages = (await listPages()).filter((page) => !isSiteChromeSlug(page.slug));
  const workArticles = await getWorkArticlesForEdit();
  const serialPages = pages.map((page) => ({
    ...page,
    draftUpdatedAt: page.draftUpdatedAt ? page.draftUpdatedAt.toISOString() : null,
    publishedAt: page.publishedAt ? page.publishedAt.toISOString() : null,
    updatedAt: page.updatedAt ? page.updatedAt.toISOString() : null
  }));

  return <PagesIndex pages={serialPages} workArticles={workArticles} />;
}

export default function EditIndexPage(props: EditIndexProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading pages…</div>}>
      <EditIndexContent {...props} />
    </Suspense>
  );
}
