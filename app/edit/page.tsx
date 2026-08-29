import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import { getAuth } from '@/lib/auth';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { getDraftPageData, listPages } from '@/lib/pages';
import { requireAdmin } from '@/lib/roles';
import { getNewsArticlesForEdit } from '@/lib/news-articles.server';
import { getEventsForEdit } from '@/lib/events.server';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { PagesIndex } from '@/components/edit/pages-index.client';
import { EditorShell } from '@/components/edit/editor-shell';
import { EditorLoadingScreen } from '@/components/edit/editor-loading-screen';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';
import { ensureUserProfileForSessionUser, readSessionUser } from '@/lib/user-profile';

type EditIndexProps = {
  searchParams?: Promise<{ slug?: string }>;
};

async function EditIndexContent({ searchParams }: EditIndexProps) {
  unstable_noStore();
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const querySlug = typeof resolvedSearchParams?.slug === 'string' ? resolvedSearchParams.slug.trim() : '';

  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const isSmoke = isEditorSmokeRequest(requestHeaders);
  const sessionUser = readSessionUser(session);
  const profile = await ensureUserProfileForSessionUser(sessionUser);
  if (!session && !isSmoke) {
    const nextPath = querySlug ? `/edit?slug=${querySlug}` : '/edit';
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  if (querySlug) {
    // Keep article/event workspaces tab-based; pages remain editable inline via ?slug.
    if (querySlug === 'news') {
      redirect('/edit?tab=news');
    }
    if (querySlug === 'events') {
      redirect('/edit?tab=events');
    }

    const canPublishDirectly = isSmoke ? false : await requireAdmin(sessionUser?.id || null, sessionUser?.email ?? null);
    const initialData = await getDraftPageData(querySlug);
    return (
      <EditorShell
        initialData={initialData}
        initialSlug={querySlug}
        isAdmin={canPublishDirectly}
        activeProfile={
          profile
            ? {
                primaryChapterSlug: profile.primaryChapterSlug,
                chapterSlugs: profile.chapterSlugs
              }
            : null
        }
      />
    );
  }

  const pages = (await listPages()).filter((page) => !isSiteChromeSlug(page.slug));
  const [newsArticles, events] = await Promise.all([getNewsArticlesForEdit(), getEventsForEdit()]);
  const serialPages = pages.map((page) => ({
    ...page,
    path: page.path ?? null,
    draftUpdatedAt: page.draftUpdatedAt ? page.draftUpdatedAt.toISOString() : null,
    publishedAt: page.publishedAt ? page.publishedAt.toISOString() : null,
    updatedAt: page.updatedAt ? page.updatedAt.toISOString() : null,
    primaryChapterSlug: page.primaryChapterSlug ?? '',
    chapterSlugs: Array.isArray(page.chapterSlugs) ? page.chapterSlugs : [],
    primaryChapterName: page.primaryChapterName ?? null,
    pendingPublishRequestedAt: page.pendingPublishRequest?.requestedAt
      ? page.pendingPublishRequest.requestedAt.toISOString()
      : null
  }));

  return <PagesIndex data={{ pages: serialPages, newsArticles, events }} />;
}

export default function EditIndexPage(props: EditIndexProps) {
  return (
    <Suspense fallback={<EditorLoadingScreen />}>
      <EditIndexContent {...props} />
    </Suspense>
  );
}
