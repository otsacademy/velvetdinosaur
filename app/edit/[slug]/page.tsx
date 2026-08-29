import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { EditorShell } from '@/components/edit/editor-shell';
import { getDraftPageData } from '@/lib/pages';
import { getDraftSiteChrome } from '@/lib/site-chrome';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { editHref } from '@/lib/page-paths';

type EditPageProps = {
  params: Promise<{ slug?: string }>;
};

async function EditPageContent({ params }: EditPageProps) {
  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN;
  const isSmoke = Boolean(smokeToken && requestHeaders.get('x-vd-editor-smoke') === smokeToken);
  const resolvedParams = await params;
  const slug = resolvedParams?.slug ? String(resolvedParams.slug) : 'home';
  if (!session && !isSmoke) {
    redirect(`/sign-in?next=${encodeURIComponent(editHref(slug))}`);
  }

  const [initialData, initialChrome] = await Promise.all([
    getDraftPageData(slug),
    isSiteChromeSlug(slug) ? Promise.resolve(null) : getDraftSiteChrome()
  ]);
  return <EditorShell initialData={initialData} initialSlug={slug} initialChrome={initialChrome} />;
}

export default function EditPage(props: EditPageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading editor...</div>}>
      <EditPageContent {...props} />
    </Suspense>
  );
}
