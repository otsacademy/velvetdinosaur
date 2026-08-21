import { headers } from 'next/headers';
import { AccessNotice } from '@/components/admin/access-notice';
import { redirect } from 'next/navigation';
import { Render } from '@puckeditor/core/rsc';
import { getAuth } from '@/lib/auth';
import { getUserRole } from '@/lib/roles';
import { listPages, getDraftPageData } from '@/lib/pages';
import { config } from '@/puck/registry';
import { ThemeEditorView } from '@/components/admin/theme/theme-editor-view.client';

export default async function ThemePage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string; slug?: string }>;
}) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/sign-in?next=/admin/theme');
  }
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
  const role = await getUserRole(userId);
  if (role !== 'admin' && role !== 'user') {
    return <AccessNotice workspace="the Theme Editor" />;
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawPage = resolvedSearchParams?.page || resolvedSearchParams?.slug || 'home';
  const selectedSlug = typeof rawPage === 'string' && rawPage.trim() ? rawPage.trim() : 'home';

  const pages = await listPages({ includeEmpty: true });
  const normalizedPages = [
    { slug: 'home', title: 'Home' },
    ...pages.filter((page) => page.slug !== 'home')
  ];

  const data = await getDraftPageData(selectedSlug);

  return (
    <ThemeEditorView pages={normalizedPages} selectedSlug={selectedSlug}>
      <main className="mx-auto w-full max-w-[1500px] space-y-16 px-8 py-16">
        <Render config={config} data={data} />
      </main>
    </ThemeEditorView>
  );
}
