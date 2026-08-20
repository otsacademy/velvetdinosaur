import Link from 'next/link';
import { ArrowUpRight, BellRing, Gauge, PencilLine, Radar } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Badge } from '@/components/ui/badge';

const destinations = [
  {
    href: '/admin/fleet',
    title: 'Fleet status',
    description: 'Review source and runtime mapping, drift, exceptions, and blockers.',
    label: 'Read-only',
    icon: Radar
  },
  {
    href: '/admin/observability',
    title: 'Observability',
    description: 'Open curated Prometheus dashboards for services and infrastructure.',
    label: 'Prometheus',
    icon: Gauge
  },
  {
    href: '/admin/alertmanager/',
    title: 'Active alerts',
    description: 'Inspect firing and silenced alerts in the protected Alertmanager surface.',
    label: 'Alertmanager',
    icon: BellRing
  },
  {
    href: '/edit',
    title: 'Content editor',
    description: 'Return to page, article, media, and site content workflows.',
    label: 'Editor',
    icon: PencilLine
  }
] as const;

export function OperationsHub() {
  return (
    <AdminPageShell
      header={
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Administration</h1>
            <p className="mt-1 max-w-[65ch] text-sm text-[var(--vd-muted-fg)]">
              Operational status, monitoring, alerts, and content tools in one protected workspace.
            </p>
          </div>
        </div>
      }
    >
      <section aria-labelledby="operations-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="operations-heading" className="text-xl font-semibold text-[var(--vd-fg)]">
              Operations
            </h2>
            <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">
              Choose the surface that matches the job you need to do.
            </p>
          </div>
          <Badge variant="outline">Installer administrators</Badge>
        </div>

        <nav
          aria-label="Operational tools"
          className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]"
        >
          <ul className="divide-y divide-[var(--vd-border)]">
            {destinations.map((destination) => {
              const Icon = destination.icon;
              return (
                <li key={destination.href}>
                  <Link
                    href={destination.href}
                    className="group flex min-h-24 items-center gap-4 px-4 py-4 transition-colors hover:bg-[var(--vd-muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vd-ring)] sm:px-5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-bg)] text-[var(--vd-primary)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--vd-fg)]">{destination.title}</span>
                        <Badge variant="secondary" className="text-[0.6875rem]">
                          {destination.label}
                        </Badge>
                      </span>
                      <span className="mt-1 block max-w-[70ch] text-sm leading-6 text-[var(--vd-muted-fg)]">
                        {destination.description}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-[var(--vd-muted-fg)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>
    </AdminPageShell>
  );
}
