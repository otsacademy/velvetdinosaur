import { notFound } from 'next/navigation';
import { DashboardView } from '@/components/admin/observability/dashboard-view.client';
import { getDashboard } from '@/lib/observability/dashboards';

type Params = {
  params: Promise<{ slug: string }>;
};

export default async function ObservabilityDashboardPage({ params }: Params) {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  if (!dashboard) {
    notFound();
  }

  return (
    <main className="space-y-8 p-6">
      <DashboardView
        dashboard={{
          slug: dashboard.slug,
          title: dashboard.title,
          description: dashboard.description,
          tags: dashboard.tags
        }}
      />
    </main>
  );
}
