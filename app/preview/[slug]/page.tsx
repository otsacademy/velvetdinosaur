import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Render } from '@puckeditor/core/rsc';
import { getAuth } from '@/lib/auth';
import { config } from '@/puck/registry';
import { getDraftPageData } from '@/lib/pages';
import { getDraftSiteChrome } from '@/lib/site-chrome';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { SiteDesignFrame } from '@/components/site/site-design-frame';

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const resolvedParams = await params;
  if (!session) {
    redirect(`/sign-in?next=/preview/${encodeURIComponent(resolvedParams.slug)}`);
  }

  const slug = resolvedParams.slug || 'home';
  const data = await getDraftPageData(slug);

  const isChrome = isSiteChromeSlug(slug);
  const chrome = isChrome ? null : await getDraftSiteChrome();

  return (
    <SiteDesignFrame>
      {chrome ? <Render config={config} data={chrome.header} /> : null}
      <Render config={config} data={data} />
      {chrome ? <Render config={config} data={chrome.footer} /> : null}
    </SiteDesignFrame>
  );
}
