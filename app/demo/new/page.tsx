import type { Metadata } from 'next';
import { DemoEditorClient } from '@/components/demo/demo-editor.client';
import { getDemoEditorSeedData } from '@/lib/demo-editor-seed';
import { resolvePrimarySiteUrl } from '@/lib/demo-site';
import { getThemePayload } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Page Editor Demo | Velvet Dinosaur',
  description: 'A disposable page editor demonstration with the full component library, media picker, and theme controls.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DemoNewPage() {
  const payload = await getThemePayload();
  const mainSiteHref = resolvePrimarySiteUrl('/');
  const initialData = getDemoEditorSeedData(mainSiteHref);

  return (
    <DemoEditorClient
      initialSlug="new-page"
      closeHref="/"
      mainSiteHref={mainSiteHref}
      initialData={initialData}
      initialThemePayload={payload}
    />
  );
}
