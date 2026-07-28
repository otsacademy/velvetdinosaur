import { DashboardIndex } from '@/components/admin/observability/dashboard-index.client';
import { listDashboards, TAG_GROUPS } from '@/lib/observability/dashboards';

export default function ObservabilityIndexPage() {
  const dashboards = listDashboards();

  return <DashboardIndex dashboards={dashboards} tagGroups={TAG_GROUPS} />;
}
