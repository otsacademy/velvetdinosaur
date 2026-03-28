import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { DemoSupportPage } from '@/components/demo/demo-pages';

export const metadata: Metadata = {
  title: 'Support Portal Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed Sauro CMS support portal with fictional tickets, local replies, and a seeded toolkit.'
};

export default function DemoSupportRoute() {
  return (
    <Suspense fallback={null}>
      <DemoSupportRouteContent />
    </Suspense>
  );
}

async function DemoSupportRouteContent() {
  await connection();
  return <DemoSupportPage variant="path" />;
}
