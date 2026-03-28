import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { DemoSupportPage } from '@/components/demo/demo-pages';
import { isDemoRequest, resolveDemoSiteUrl } from '@/lib/demo-site';

const canonical = resolveDemoSiteUrl('/support');

export const metadata: Metadata = {
  title: 'Support Portal Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed Sauro CMS support portal with fictional tickets, local replies, and a seeded toolkit.',
  alternates: {
    canonical
  },
  openGraph: {
    title: 'Support Portal Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed Sauro CMS support portal with fictional tickets, local replies, and a seeded toolkit.',
    url: canonical
  },
  twitter: {
    title: 'Support Portal Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed Sauro CMS support portal with fictional tickets, local replies, and a seeded toolkit.'
  }
};

export default function SupportDemoPage() {
  return (
    <Suspense fallback={null}>
      <SupportDemoPageContent />
    </Suspense>
  );
}

async function SupportDemoPageContent() {
  await connection();
  const requestHeaders = await headers();
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl('/support'));
  }

  return <DemoSupportPage variant="host" />;
}
