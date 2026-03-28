import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { DemoContactTemplatesPage } from '@/components/demo/demo-pages';
import { isDemoRequest, resolveDemoSiteUrl } from '@/lib/demo-site';

const canonical = resolveDemoSiteUrl('/contact-templates');

export const metadata: Metadata = {
  title: 'Contact Templates Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed contact template workbench with token previews, demo-only saves, and fictional email copy.',
  alternates: {
    canonical
  },
  openGraph: {
    title: 'Contact Templates Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed contact template workbench with token previews, demo-only saves, and fictional email copy.',
    url: canonical
  },
  twitter: {
    title: 'Contact Templates Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed contact template workbench with token previews, demo-only saves, and fictional email copy.'
  }
};

export default function ContactTemplatesHostPage() {
  return (
    <Suspense fallback={null}>
      <ContactTemplatesHostPageContent />
    </Suspense>
  );
}

async function ContactTemplatesHostPageContent() {
  await connection();
  const requestHeaders = await headers();
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl('/contact-templates'));
  }

  return <DemoContactTemplatesPage variant="host" />;
}
