import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Render } from '@measured/puck/rsc';
import { getAuth } from '@/lib/auth';
import { config } from '@/puck/registry';
import { getDraftPageData } from '@/lib/pages';
import { getDraftSiteChrome } from '@/lib/site-chrome';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';

type PreviewPageParams = { slug: string };

export default async function PreviewPage({
  params
}: {
  params: PreviewPageParams | Promise<PreviewPageParams>;
}) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const resolvedParams = await Promise.resolve(params);
  if (!session) {
    redirect(`/sign-in?next=/preview/${encodeURIComponent(resolvedParams.slug)}`);
  }

  const slug = resolvedParams.slug || 'home';
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
