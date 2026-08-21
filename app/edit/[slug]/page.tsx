import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import { getAuth } from '@/lib/auth';
import { EditorShell } from '@/components/edit/editor-shell';
import { EditorLoadingScreen } from '@/components/edit/editor-loading-screen';
import { requireAdmin } from '@/lib/roles';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { getDraftPageData } from '@/lib/pages';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';
import { ensureUserProfileForSessionUser, readSessionUser } from '@/lib/user-profile';

type EditPageProps = {
  params: Promise<{ slug?: string }>;
};

async function EditPageContent({ params }: EditPageProps) {
  unstable_noStore();
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }

  const resolvedParams = await params;
  const slug = resolvedParams?.slug ? String(resolvedParams.slug) : 'home';

  // Legacy direct URLs should route to their dedicated workspaces immediately.
  if (slug === 'home') {
    redirect('/edit?slug=home');
  }
  if (slug === 'news') {
    redirect('/edit?tab=news');
  }
  if (slug === 'events') {
    redirect('/edit?tab=events');
  }

  const auth = getAuth();
  const requestHeaders = await headers();
  const isSmoke = isEditorSmokeRequest(requestHeaders);
  const session = isSmoke ? null : await auth.api.getSession({ headers: requestHeaders });
  const sessionUser = readSessionUser(session);
  const canPublishDirectly = isSmoke ? false : await requireAdmin(sessionUser?.id || null, sessionUser?.email || null);
  const profile = await ensureUserProfileForSessionUser(sessionUser);

  if (!session && !isSmoke) {
    redirect(`/sign-in?next=/edit/${encodeURIComponent(slug)}`);
  }

  const initialData = await getDraftPageData(slug);
  return (
    <EditorShell
      initialData={initialData}
      initialSlug={slug}
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
    <Suspense fallback={<EditorLoadingScreen />}>
      <EditPageContent {...props} />
    </Suspense>
  );
}
