import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { PublishedDoc } from '@/lib/puck-render';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';

export default function AboutPage() {
  return (
    <Suspense fallback={null}>
      <AboutPageContent />
    </Suspense>
  );
}

async function AboutPageContent() {
  // CMS pages are backed by Mongo. When build-time DB access is unavailable (or undesirable),
  // we must opt out of prerendering so published content is always resolved at request time.
  await connection();
  if (isAdminOnly()) redirect(adminHomePath);
  return (
    <main>
      <PublishedDoc slug="about" />
    </main>
  );
}
