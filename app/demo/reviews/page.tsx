import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { DemoReviewsPage } from '@/components/demo/demo-pages';

export const metadata: Metadata = {
  title: 'Reviews Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed review-link and comment workflow with fictional reviewers, progress tracking, and demo-only feedback.'
};

export default function DemoReviewsRoute() {
  return (
    <Suspense fallback={null}>
      <DemoReviewsRouteContent />
    </Suspense>
  );
}

async function DemoReviewsRouteContent() {
  await connection();
  return <DemoReviewsPage variant="path" />;
}
