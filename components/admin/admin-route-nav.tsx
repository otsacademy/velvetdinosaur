import Link from 'next/link';
import { BellRing, Gauge, LayoutDashboard, PencilLine, Radar } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AdminRoute = 'admin' | 'fleet' | 'observability';

const destinations = [
  { id: 'admin', href: '/admin', label: 'Admin', icon: LayoutDashboard },
  { id: 'fleet', href: '/admin/fleet', label: 'Fleet', icon: Radar },
  { id: 'observability', href: '/admin/observability', label: 'Observability', icon: Gauge },
  { id: 'alerts', href: '/admin/alertmanager/', label: 'Alerts', icon: BellRing },
  { id: 'editor', href: '/edit', label: 'Editor', icon: PencilLine }
] as const;

export function AdminRouteNav({ current }: { current?: AdminRoute }) {
  return (
    <nav aria-label="Administration" className="flex flex-wrap gap-1.5">
      {destinations.map((destination) => {
        const Icon = destination.icon;
        const isCurrent = destination.id === current;
        return (
          <Button
            key={destination.id}
            asChild
            variant={isCurrent ? 'secondary' : 'ghost'}
            size="sm"
            className="min-h-11 px-3"
          >
            <Link href={destination.href} aria-current={isCurrent ? 'page' : undefined}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {destination.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
