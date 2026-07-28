import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireInstallerAdmin } from '@/lib/admin';

export const metadata: Metadata = {
  title: 'Observability | Velvet Dinosaur Admin',
  description: 'Private Prometheus dashboards for Velvet Dinosaur platform operations.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function ObservabilityLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const gate = await requireInstallerAdmin(await headers());

  if (!gate.session) {
    redirect('/sign-in?next=/admin/observability');
  }

  if (!gate.ok) {
    redirect('/edit');
  }

  return children;
}
