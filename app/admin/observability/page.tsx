import { DashboardIndex } from '@/components/admin/observability/dashboard-index.client';
import { listDashboards, TAG_GROUPS } from '@/lib/observability/dashboards';

export default function ObservabilityIndexPage() {
  const dashboards = listDashboards();

  return (
    <main className="space-y-8 p-6">
      <DashboardIndex dashboards={dashboards} tagGroups={TAG_GROUPS} />
    </main>
  );
}
