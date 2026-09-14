import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { EditorShell } from '@/components/edit/editor-shell';
import { getDraftPageData } from '@/lib/pages';
import { requireAdmin } from '@/lib/roles';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';
import { getDraftSiteChrome } from '@/lib/site-chrome';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { editHref } from '@/lib/page-paths';
import { ensureUserProfileForSessionUser, readSessionUser } from '@/lib/user-profile';

type EditPageProps = {
  params: Promise<{ slug?: string }>;
};

async function EditPageContent({ params }: EditPageProps) {
  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const isSmoke = isEditorSmokeRequest(requestHeaders);
  const resolvedParams = await params;
  const slug = resolvedParams?.slug ? String(resolvedParams.slug) : 'home';
  if (!session && !isSmoke) {
    redirect(`/sign-in?next=${encodeURIComponent(editHref(slug))}`);
  }

  // Same rules as the dashboard's `?slug=` editor (app/edit/page.tsx): the publish
  // button must say what the publish route will do, and that route decides by role.
  // Without this the shell defaulted to a non-admin and every admin saw
  // "Submit for approval" on a button that published immediately.
  const sessionUser = readSessionUser(session);
  const [profile, canPublishDirectly, initialData, initialChrome] = await Promise.all([
    ensureUserProfileForSessionUser(sessionUser),
    isSmoke ? Promise.resolve(false) : requireAdmin(sessionUser?.id || null, sessionUser?.email ?? null),
    getDraftPageData(slug),
    isSiteChromeSlug(slug) ? Promise.resolve(null) : getDraftSiteChrome()
  ]);
  return (
    <EditorShell
      initialData={initialData}
      initialSlug={slug}
      initialChrome={initialChrome}
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

export default function EditPage(props: EditPageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading editor...</div>}>
      <EditPageContent {...props} />
    </Suspense>
  );
}
