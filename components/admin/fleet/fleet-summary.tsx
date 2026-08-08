import { Info, LockKeyhole } from 'lucide-react';
import { StatusBadge } from '@/components/admin/fleet/status-badge';
import { Badge } from '@/components/ui/badge';
import { formatFleetTimestamp } from '@/lib/fleet/format';
import type { BadgeClass, DashboardView } from '@/lib/fleet/schema';

function auditBadge(view: DashboardView): BadgeClass {
  const audit = view.report.audit;
  if (audit.freshness.overall === 'stale') return 'stale';
  if (audit.provenance === 'unknown') return 'unknown';
  if (audit.provenance === 'inferred') return 'inferred';
  if (audit.freshness.overall === 'unknown') return 'unknown';
  return 'verified';
}

export function FleetSummary({ view }: { view: DashboardView }) {
  const summary = view.report.summary;
  const metrics = [
    ['Repositories', summary.repositories],
    ['Deployments', summary.deployments],
    ['Unmatched', summary.unmatchedWorkloads],
    ['Blockers', summary.blockers],
    ['Stale facts', summary.staleFacts],
    ['Unknown facts', summary.unknownFacts],
    ['Exceptions', summary.openExceptions]
  ] as const;
  const inputs = [
    ['Source', view.report.inputs.sourceAt, view.report.inputs.sourceFreshness],
    ['Runtime', view.report.inputs.runtimeAt, view.report.inputs.runtimeFreshness],
    ['Evidence', view.report.inputs.evidenceAt, view.report.inputs.evidenceFreshness],
    ['Cache', view.report.inputs.cacheAt, view.report.inputs.cacheFreshness]
  ] as const;

  return (
    <section id="summary" aria-labelledby="fleet-summary-heading" className="space-y-5 scroll-mt-48">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="fleet-summary-heading" className="text-xl font-semibold text-[var(--vd-fg)]">
            Fleet summary
          </h2>
          <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">
            A current count of enrolled, observed, and unresolved fleet state.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
          Read-only
        </Badge>
      </div>

      <dl className="grid overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {metrics.map(([label, value]) => (
          <div key={label} className="border-b border-r border-[var(--vd-border)] px-4 py-4 last:border-r-0">
            <dt className="text-xs font-medium text-[var(--vd-muted-fg)]">{label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--vd-fg)]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]">
        <div className="flex gap-3 border-b border-[var(--vd-border)] px-4 py-4 sm:px-5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vd-primary)]" aria-hidden="true" />
          <p className="max-w-[75ch] text-sm leading-6 text-[var(--vd-fg)]">
            Status can be cached. Source, runtime, and evidence times remain independent, and this
            page never authorises a fleet action.
          </p>
        </div>
        <dl className="grid sm:grid-cols-2 xl:grid-cols-4">
          {inputs.map(([label, timestamp, freshness]) => (
            <div key={label} className="border-b border-r border-[var(--vd-border)] px-4 py-4 sm:px-5">
              <dt className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--vd-muted-fg)]">
                {label}
                <StatusBadge status={freshness} />
              </dt>
              <dd className="mt-2 text-sm tabular-nums text-[var(--vd-fg)]">
                {formatFleetTimestamp(timestamp)}
              </dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-[auto_1fr] sm:px-5">
          <div><StatusBadge status={auditBadge(view)} /></div>
          <div>
            <p className="text-sm font-semibold text-[var(--vd-fg)]">
              Audit integrity: {view.report.audit.value ?? 'Unknown'}
            </p>
            <p className="mt-1 max-w-[75ch] text-sm leading-6 text-[var(--vd-muted-fg)]">
              {view.report.audit.explanation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
