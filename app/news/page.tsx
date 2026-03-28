import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DemoNewsEditorClient } from '@/components/demo/news/demo-news-editor.client';
import { isDemoRequest, resolveDemoSiteUrl, resolvePrimarySiteUrl } from '@/lib/demo-site';

const canonical = resolveDemoSiteUrl('/news');

export const metadata: Metadata = {
  title: 'Article Editor Demo | Velvet Dinosaur',
  description: 'A sandboxed article editor demonstration using fictional editorial content, disposable media, and demo-only save and publish actions.',
  alternates: {
    canonical,
  },
  openGraph: {
    title: 'Article Editor Demo | Velvet Dinosaur',
    description: 'A sandboxed article editor demonstration using fictional editorial content, disposable media, and demo-only save and publish actions.',
    url: canonical,
  },
  twitter: {
    title: 'Article Editor Demo | Velvet Dinosaur',
    description: 'A sandboxed article editor demonstration using fictional editorial content, disposable media, and demo-only save and publish actions.',
  },
};

export default function DemoNewsHostPage() {
  return (
    <Suspense fallback={null}>
      <DemoNewsHostPageContent />
    </Suspense>
  );
}

async function DemoNewsHostPageContent() {
  const requestHeaders = await headers();
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl('/news'));
  }

  return <DemoNewsEditorClient closeHref={resolvePrimarySiteUrl('/')} mainSiteHref={resolvePrimarySiteUrl('/')} />;
}
