import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { DemoContactTemplatesPage } from '@/components/demo/demo-pages';

export const metadata: Metadata = {
  title: 'Contact Templates Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed contact template workbench with token previews, demo-only saves, and fictional email copy.'
};

export default function DemoContactTemplatesRoute() {
  return (
    <Suspense fallback={null}>
      <DemoContactTemplatesRouteContent />
    </Suspense>
  );
}

async function DemoContactTemplatesRouteContent() {
  await connection();
  return <DemoContactTemplatesPage variant="path" />;
}
