import { Render } from '@measured/puck/rsc';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { getPublishedSiteChrome } from '@/lib/site-chrome';
import { config } from '@/puck/registry';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SiteLayoutContent>{children}</SiteLayoutContent>
    </Suspense>
  );
}

async function SiteLayoutContent({ children }: { children: React.ReactNode }) {
  // Site chrome is CMS-backed (Mongo). Ensure this segment opts out of prerendering.
  await connection();
  const { header, footer } = await getPublishedSiteChrome();

  return (
    <>
      <Render config={config} data={header} />
      {children}
      <Render config={config} data={footer} />
    </>
  );
}
