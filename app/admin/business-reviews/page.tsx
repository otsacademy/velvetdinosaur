import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccessNotice } from '@/components/admin/access-notice';
import { BusinessReviewsWorkspace } from '@/components/admin/business-reviews/business-reviews-workspace.client';
import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';

export const metadata: Metadata = {
  title: 'Business Reviews',
  description: 'Manage Google Places reviews and Tripadvisor widgets.',
  robots: { index: false, follow: false }
};

export default async function BusinessReviewsAdminPage() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;

  if (!session) redirect('/sign-in?next=/admin/business-reviews');
  if (!(await requireAdmin(user?.id || null, user?.email || null))) {
    return <AccessNotice workspace="Business Reviews" />;
  }

  return (
    <main className="container space-y-6 py-8">
      <BusinessReviewsWorkspace />
    </main>
  );
}
