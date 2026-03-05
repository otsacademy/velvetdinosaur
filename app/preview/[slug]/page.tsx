import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Render } from '@measured/puck/rsc';
import { getAuth } from '@/lib/auth';
import { config } from '@/puck/registry';
import { getDraftPageData } from '@/lib/pages';
import { getDraftSiteChrome } from '@/lib/site-chrome';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';

export default async function PreviewPage({ params }: { params: { slug: string } }) {
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/sign-in?next=/preview/${encodeURIComponent(params.slug)}`);
  }

  const slug = params.slug || 'home';
  const data = await getDraftPageData(slug);

  const isChrome = isSiteChromeSlug(slug);
  const chrome = isChrome ? null : await getDraftSiteChrome();

  const content = isChrome ? (
    <Render config={config} data={data} />
  ) : (
    <main className="container space-y-16 py-16">
      <Render config={config} data={data} />
    </main>
  );

  return (
    <>
      {chrome ? <Render config={config} data={chrome.header} /> : null}
      {content}
      {chrome ? <Render config={config} data={chrome.footer} /> : null}
    </>
  );
}
