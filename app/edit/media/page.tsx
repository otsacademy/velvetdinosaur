import { Suspense } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { LoadingCard } from '@/components/ui/loading-card';
import { MediaLibraryClient } from '@/components/edit/media-library.client';

export const metadata: Metadata = {
  title: 'Media Library'
};

export default function MediaLibraryPage() {
  return (
    <Suspense
      fallback={
        <main className="container py-10">
          <LoadingCard
            title="Loading media library"
            description="Fetching your uploads."
          />
        </main>
      }
    >
      <MediaLibraryContent />
    </Suspense>
  );
}

async function MediaLibraryContent() {
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }
  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN;
  const isSmoke = Boolean(smokeToken && requestHeaders.get('x-vd-editor-smoke') === smokeToken);
  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit/media');
  }
  return <MediaLibraryClient />;
}
