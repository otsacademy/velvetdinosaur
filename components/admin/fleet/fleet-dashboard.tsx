import Link from 'next/link';
import {
  ChevronDown,
  CircleAlert,
  ExternalLink,
  RefreshCw,
  Search,
  Server,
  Unplug
} from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { FleetFieldsTable } from '@/components/admin/fleet/fleet-fields-table';
import {
  BlockersTable,
  OpenExceptionsTable,
  RegistryDiscrepanciesTable
} from '@/components/admin/fleet/fleet-secondary-tables';
import { FleetSummary } from '@/components/admin/fleet/fleet-summary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildFleetPresentation } from '@/lib/fleet/presentation';
import { formatFleetTimestamp } from '@/lib/fleet/format';
import type { DashboardView } from '@/lib/fleet/schema';

type FleetDashboardProps = {
  view: DashboardView;
  query: string;
};

const sectionLinks = [
  ['summary', 'Summary'],
  ['repositories', 'Repositories'],
  ['deployments', 'Deployments'],
  ['unmatched', 'Unmatched'],
  ['discrepancies', 'Discrepancies'],
  ['exceptions', 'Exceptions'],
  ['blockers', 'Blockers']
] as const;

function SectionHeading({
  id,
  title,
  description,
  count
}: {
  id: string;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={`${id}-heading`} className="text-xl font-semibold text-[var(--vd-fg)]">
          {title}
        </h2>
        <p className="mt-1 max-w-[75ch] text-sm leading-6 text-[var(--vd-muted-fg)]">
          {description}
        </p>
      </div>
      <Badge variant="secondary" className="tabular-nums">
        {count}
      </Badge>
    </div>
  );
}

function FindingList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline" className="font-mono text-[0.6875rem]">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SubjectDetails({
  label,
  title,
  description,
  findings,
  blockers,
  fields,
  open
}: {
  label: string;
  title: string;
  description: string;
  findings: string[];
  blockers: string[];
  fields: Parameters<typeof FleetFieldsTable>[0]['fields'];
  open: boolean;
}) {
  return (
    <details
      className="group overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]"
      open={open}
    >
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vd-ring)] [&::-webkit-details-marker]:hidden sm:px-5">
        <span className="min-w-0 flex-1">
          <span className="block break-all font-mono text-sm font-semibold text-[var(--vd-fg)]">
            {title}
          </span>
          <span className="mt-1 block text-xs text-[var(--vd-muted-fg)]">{description}</span>
        </span>
        {blockers.length > 0 ? (
          <Badge className="gap-1 border-[var(--vd-status-danger-border)] bg-[var(--vd-status-danger-bg)] text-[var(--vd-status-danger-fg)]">
            <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            {blockers.length} blocked
          </Badge>
        ) : null}
        <Badge variant="outline" className="tabular-nums">
          {fields.length} fields
        </Badge>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[var(--vd-muted-fg)] transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-5 border-t border-[var(--vd-border)] px-4 py-5 sm:px-5">
        {findings.length || blockers.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FindingList label="Findings" items={findings} />
            <FindingList label="Blockers" items={blockers} />
          </div>
        ) : null}
        <FleetFieldsTable fields={fields} label={label} />
      </div>
    </details>
  );
}

function NoMatches({ children }: { children: string }) {
  return (
    <div className="rounded-[var(--vd-radius)] border border-dashed border-[var(--vd-border)] bg-[var(--vd-card)] px-5 py-8 text-center text-sm text-[var(--vd-muted-fg)]">
      {children}
    </div>
  );
}

export function FleetDashboard({ view, query }: FleetDashboardProps) {
  const fleet = buildFleetPresentation(view, query);
  const isFiltered = query.length > 0;

  return (
    <AdminPageShell
      header={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Fleet status</h1>
                <Badge variant="outline">Read-only</Badge>
              </div>
              <p className="mt-1 max-w-[70ch] text-sm leading-6 text-[var(--vd-muted-fg)]">
                Reconcile source intent, deployed workloads, evidence, exceptions, and blockers.
              </p>
              <p className="mt-1 text-xs tabular-nums text-[var(--vd-muted-fg)]">
                Generated {formatFleetTimestamp(view.generatedAt)}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="min-h-11 self-start">
              <Link href={query ? `/admin/fleet?q=${encodeURIComponent(query)}` : '/admin/fleet'}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh status
              </Link>
            </Button>
          </div>
        </div>
      }
    >
      <section aria-labelledby="fleet-filter-heading" className="space-y-4">
        <div>
          <h2 id="fleet-filter-heading" className="text-lg font-semibold text-[var(--vd-fg)]">
            Find fleet state
          </h2>
          <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">
            Search identifiers, values, findings, blockers, evidence, and explanations.
          </p>
        </div>
        <form method="get" action="/admin/fleet" className="flex max-w-2xl flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="fleet-query">Search fleet status</label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vd-muted-fg)]"
              aria-hidden="true"
            />
            <Input
              id="fleet-query"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search repositories, sites, workloads, or findings"
              maxLength={100}
              className="pl-9"
            />
          </div>
          <Button type="submit" className="min-h-11">Search</Button>
          {isFiltered ? (
            <Button asChild type="button" variant="ghost" className="min-h-11">
              <Link href="/admin/fleet">Clear</Link>
            </Button>
          ) : null}
        </form>
        {isFiltered ? (
          <p role="status" className="text-sm text-[var(--vd-muted-fg)]">
            Filtered by <span className="font-semibold text-[var(--vd-fg)]">“{query}”</span>.
          </p>
        ) : null}
      </section>

      <nav aria-label="Fleet sections" className="flex flex-wrap gap-x-5 gap-y-2 border-y border-[var(--vd-border)] py-3 text-sm">
        {sectionLinks.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="font-medium text-[var(--vd-primary)] underline-offset-4 hover:underline">
            {label}
          </a>
        ))}
      </nav>

      <FleetSummary view={view} />

      <section id="repositories" aria-labelledby="repositories-heading" className="space-y-4 scroll-mt-48">
        <SectionHeading
          id="repositories"
          title="Repositories"
          description="Declared source repositories and the status facts used to evaluate them."
          count={fleet.repositories.length}
        />
        {fleet.repositories.length ? fleet.repositories.map((repo) => (
          <SubjectDetails
            key={repo.repoId}
            label={`Repository ${repo.repoId}`}
            title={repo.repoId}
            description={`${repo.findings.length} findings · ${repo.blockers.length} blockers`}
            findings={repo.findings}
            blockers={repo.blockers}
            fields={repo.fields}
            open={isFiltered}
          />
        )) : <NoMatches>No repositories match this view.</NoMatches>}
      </section>

      <section id="deployments" aria-labelledby="deployments-heading" className="space-y-4 scroll-mt-48">
        <SectionHeading
          id="deployments"
          title="Deployments"
          description="Sites mapped to their source repository and selected running workloads."
          count={fleet.deployments.length}
        />
        {fleet.deployments.length ? fleet.deployments.map((deployment) => (
          <SubjectDetails
            key={deployment.siteId}
            label={`Deployment ${deployment.siteId}`}
            title={deployment.siteId}
            description={`${deployment.repoId} · ${deployment.workloadIds.length} workload${deployment.workloadIds.length === 1 ? '' : 's'}`}
            findings={deployment.findings}
            blockers={deployment.blockers}
            fields={deployment.fields}
            open={isFiltered}
          />
        )) : <NoMatches>No deployments match this view.</NoMatches>}
      </section>

      <section id="unmatched" aria-labelledby="unmatched-heading" className="space-y-4 scroll-mt-48">
        <SectionHeading
          id="unmatched"
          title="Unmatched workloads"
          description="Observed workloads that do not currently resolve to an enrolled deployment."
          count={fleet.unmatchedWorkloads.length}
        />
        {fleet.unmatchedWorkloads.length ? fleet.unmatchedWorkloads.map((workload) => (
          <SubjectDetails
            key={workload.workloadId}
            label={`Unmatched workload ${workload.workloadId}`}
            title={workload.workloadId}
            description={`${workload.classification}${workload.unit ? ` · ${workload.unit}` : ''}`}
            findings={workload.findings}
            blockers={workload.blockers}
            fields={workload.fields}
            open={isFiltered}
          />
        )) : (
          <div className="flex items-center gap-3 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] px-5 py-5 text-sm text-[var(--vd-muted-fg)]">
            <Unplug className="h-4 w-4 shrink-0 text-[var(--vd-status-success-fg)]" aria-hidden="true" />
            No unmatched workloads appear in this view.
          </div>
        )}
      </section>

      <section id="discrepancies" aria-labelledby="discrepancies-heading" className="space-y-4 scroll-mt-48">
        <SectionHeading
          id="discrepancies"
          title="Registry discrepancies"
          description="Differences between the enrolled registry and the observed fleet model."
          count={fleet.registryDiscrepancies.length}
        />
        <RegistryDiscrepanciesTable items={fleet.registryDiscrepancies} />
      </section>

      <section id="exceptions" aria-labelledby="exceptions-heading" className="space-y-4 scroll-mt-48">
        <SectionHeading
          id="exceptions"
          title="Open exceptions"
          description="Time-bound finding exceptions that remain active in the status report."
          count={fleet.openExceptions.length}
        />
        <OpenExceptionsTable items={fleet.openExceptions} />
      </section>

      <section id="blockers" aria-labelledby="blockers-heading" className="space-y-4 scroll-mt-48">
        <SectionHeading
          id="blockers"
          title="Blockers"
          description="Conditions that prevent the fleet from being considered safe or complete."
          count={fleet.blockers.length}
        />
        <BlockersTable items={fleet.blockers} />
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vd-border)] pt-5 text-xs text-[var(--vd-muted-fg)]">
        <span className="inline-flex items-center gap-2">
          <Server className="h-3.5 w-3.5" aria-hidden="true" />
          Status is fetched server-side from the local control service.
        </span>
        <a href="#admin-main-content" className="inline-flex items-center gap-1 font-medium text-[var(--vd-primary)] hover:underline">
          Back to top <ExternalLink className="h-3 w-3 -rotate-45" aria-hidden="true" />
        </a>
      </footer>
    </AdminPageShell>
  );
}
