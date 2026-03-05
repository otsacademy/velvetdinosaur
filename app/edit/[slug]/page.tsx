import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { EditorShell } from '@/components/edit/editor-shell';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { getDraftPageData } from '@/lib/pages';

type EditPageProps = {
  params: { slug?: string } | Promise<{ slug?: string }>;
};

async function EditPageContent({ params }: EditPageProps) {
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }
  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN;
  const isSmoke = Boolean(smokeToken && requestHeaders.get('x-vd-editor-smoke') === smokeToken);
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug ? String(resolvedParams.slug) : 'home';
  if (!session && !isSmoke) {
    redirect(`/sign-in?next=/edit/${encodeURIComponent(slug)}`);
  }

  const initialData = await getDraftPageData(slug);
  return <EditorShell initialData={initialData} initialSlug={slug} />;
}

export default function EditPage(props: EditPageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading editor...</div>}>
      <EditPageContent {...props} />
    </Suspense>
  );
}
