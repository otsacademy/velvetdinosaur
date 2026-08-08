import type { Metadata } from 'next';
import { FleetDashboard } from '@/components/admin/fleet/fleet-dashboard';
import { FleetUnavailable } from '@/components/admin/fleet/fleet-unavailable';
import { requireOperationsAdmin } from '@/lib/admin-route';
import { fetchFleetDashboardView, FleetStatusError } from '@/lib/fleet/client';
import { normalizeFleetQuery } from '@/lib/fleet/presentation';
import type { DashboardView } from '@/lib/fleet/schema';

export const metadata: Metadata = {
  title: 'Fleet status | Velvet Dinosaur',
  description: 'Protected read-only fleet status for Velvet Dinosaur administrators.',
  robots: { index: false, follow: false }
};

type FleetPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function FleetPage({ searchParams }: FleetPageProps) {
  await requireOperationsAdmin('/admin/fleet');
  const query = normalizeFleetQuery((await searchParams).q);

  let view: DashboardView | null = null;
  let errorCode: FleetStatusError['code'] = 'unavailable';
  try {
    view = await fetchFleetDashboardView();
  } catch (error) {
    errorCode = error instanceof FleetStatusError ? error.code : 'unavailable';
  }

  return view
    ? <FleetDashboard view={view} query={query} />
    : <FleetUnavailable code={errorCode} />;
}
