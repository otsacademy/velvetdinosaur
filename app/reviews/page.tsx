import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { DemoReviewsPage } from '@/components/demo/demo-pages';
import { isDemoRequest, resolveDemoSiteUrl } from '@/lib/demo-site';

const canonical = resolveDemoSiteUrl('/reviews');

export const metadata: Metadata = {
  title: 'Reviews Demo | Velvet Dinosaur',
  description: 'Explore a sandboxed review-link and comment workflow with fictional reviewers, progress tracking, and demo-only feedback.',
  alternates: {
    canonical
  },
  openGraph: {
    title: 'Reviews Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed review-link and comment workflow with fictional reviewers, progress tracking, and demo-only feedback.',
    url: canonical
  },
  twitter: {
    title: 'Reviews Demo | Velvet Dinosaur',
    description: 'Explore a sandboxed review-link and comment workflow with fictional reviewers, progress tracking, and demo-only feedback.'
  }
};

export default function ReviewsHostPage() {
  return (
    <Suspense fallback={null}>
      <ReviewsHostPageContent />
    </Suspense>
  );
}

async function ReviewsHostPageContent() {
  await connection();
  const requestHeaders = await headers();
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl('/reviews'));
  }

  return <DemoReviewsPage variant="host" />;
}
