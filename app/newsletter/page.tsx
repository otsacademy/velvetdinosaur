import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { DemoNewsletterPage } from '@/components/demo/demo-pages';
import { isDemoRequest, resolveDemoSiteUrl } from '@/lib/demo-site';

const canonical = resolveDemoSiteUrl('/newsletter');

export const metadata: Metadata = {
  title: 'Newsletter Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed newsletter workspace with fictional subscribers, campaigns, delivery logs, and demo-only mail actions.',
  alternates: {
    canonical
  },
  openGraph: {
    title: 'Newsletter Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed newsletter workspace with fictional subscribers, campaigns, delivery logs, and demo-only mail actions.',
    url: canonical
  },
  twitter: {
    title: 'Newsletter Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed newsletter workspace with fictional subscribers, campaigns, delivery logs, and demo-only mail actions.'
  }
};

export default function NewsletterHostPage() {
  return (
    <Suspense fallback={null}>
      <NewsletterHostPageContent />
    </Suspense>
  );
}

async function NewsletterHostPageContent() {
  await connection();
  const requestHeaders = await headers();
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl('/newsletter'));
  }

  return <DemoNewsletterPage variant="host" />;
}
