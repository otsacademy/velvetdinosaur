import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { isInstallerAdmin } from '@/lib/admin';
import { getSiteSummary } from '@/lib/installer-io';
import { listInstallerJobs } from '@/lib/installer-jobs';
import { SiteDetail } from '@/components/admin/sites/site-detail';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SiteDetailPage({ params }: Props) {
  const { slug } = await params;
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/sign-in?next=/admin/sites/${encodeURIComponent(slug)}`);
  }
  const email = (session as { user?: { email?: string } })?.user?.email || '';
  if (!isInstallerAdmin(email)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-semibold">Installer access denied</h1>
        <p className="text-sm text-[var(--vd-muted-fg)]">
          Your account is not allowed to manage installs. Ask an admin to add you to
          VD_INSTALLER_ADMINS.
        </p>
      </main>
    );
  }

  const site = await getSiteSummary(slug);
  const jobs = await listInstallerJobs();

  return (
    <main className="min-h-screen bg-[var(--vd-bg)]">
      <div className="container py-10">
        <SiteDetail slug={slug} site={site} jobs={jobs} />
      </div>
    </main>
  );
}
