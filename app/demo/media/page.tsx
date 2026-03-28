import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { DemoMediaPage } from '@/components/demo/demo-pages';

export const metadata: Metadata = {
  title: 'Media Library Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed Sauro CMS media library with fictional folders, disposable uploads, and demo-only actions.'
};

export default function DemoMediaRoute() {
  return (
    <Suspense fallback={null}>
      <DemoMediaRouteContent />
    </Suspense>
  );
}

async function DemoMediaRouteContent() {
  await connection();
  return <DemoMediaPage variant="path" />;
}
