import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { DemoNewsletterPage } from '@/components/demo/demo-pages';

export const metadata: Metadata = {
  title: 'Newsletter Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed newsletter workspace with fictional subscribers, campaigns, delivery logs, and demo-only mail actions.'
};

export default function DemoNewsletterRoute() {
  return (
    <Suspense fallback={null}>
      <DemoNewsletterRouteContent />
    </Suspense>
  );
}

async function DemoNewsletterRouteContent() {
  await connection();
  return <DemoNewsletterPage variant="path" />;
}
