import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { DemoMediaPage } from '@/components/demo/demo-pages';
import { isDemoRequest, resolveDemoSiteUrl } from '@/lib/demo-site';

const canonical = resolveDemoSiteUrl('/media');

export const metadata: Metadata = {
  title: 'Media Library Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed Sauro CMS media library with fictional folders, disposable uploads, and demo-only actions.',
  alternates: {
    canonical
  },
  openGraph: {
    title: 'Media Library Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed Sauro CMS media library with fictional folders, disposable uploads, and demo-only actions.',
    url: canonical
  },
  twitter: {
    title: 'Media Library Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed Sauro CMS media library with fictional folders, disposable uploads, and demo-only actions.'
  }
};

export default function MediaDemoPage() {
  return (
    <Suspense fallback={null}>
      <MediaDemoPageContent />
    </Suspense>
  );
}

async function MediaDemoPageContent() {
  await connection();
  const requestHeaders = await headers();
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl('/media'));
  }

  return <DemoMediaPage variant="host" />;
}
