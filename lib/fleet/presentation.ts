import type {
  BadgeClass,
  DashboardView,
  DeploymentStatus,
  RepositoryStatus,
  StatusField,
  UnmatchedWorkloadStatus
} from '@/lib/fleet/schema';

export type PresentedStatusField = StatusField & { badgeClass: BadgeClass };
export type PresentedRepository = Omit<RepositoryStatus, 'fields'> & {
  fields: PresentedStatusField[];
};
export type PresentedDeployment = Omit<DeploymentStatus, 'fields'> & {
  fields: PresentedStatusField[];
};
export type PresentedUnmatchedWorkload = Omit<UnmatchedWorkloadStatus, 'fields'> & {
  fields: PresentedStatusField[];
};

export type FleetPresentation = {
  repositories: PresentedRepository[];
  deployments: PresentedDeployment[];
  unmatchedWorkloads: PresentedUnmatchedWorkload[];
  registryDiscrepancies: DashboardView['report']['registryDiscrepancies'];
  openExceptions: DashboardView['report']['openExceptions'];
  blockers: DashboardView['report']['blockers'];
  query: string;
};

function normalize(value: unknown) {
  return String(value ?? '').toLocaleLowerCase('en-GB');
}

function fieldMatches(field: PresentedStatusField, query: string) {
  return [
    field.key,
    field.category,
    field.packageName,
    field.layer,
    field.value,
    field.provenance,
    field.freshness.overall,
    field.explanation,
    ...field.evidenceRefs
  ].some((value) => normalize(value).includes(query));
}

function filterSubject<T extends { fields: PresentedStatusField[]; findings: string[]; blockers: string[] }>(
  subject: T,
  identityValues: unknown[],
  query: string
): T | null {
  if (!query) return subject;
  const identityMatches = [...identityValues, ...subject.findings, ...subject.blockers]
    .some((value) => normalize(value).includes(query));
  if (identityMatches) return subject;
  const fields = subject.fields.filter((field) => fieldMatches(field, query));
  return fields.length > 0 ? { ...subject, fields } : null;
}

export function normalizeFleetQuery(value: string | string[] | undefined): string {
  const selected = Array.isArray(value) ? value[0] : value;
  return selected?.trim().slice(0, 100) ?? '';
}

export function buildFleetPresentation(view: DashboardView, rawQuery = ''): FleetPresentation {
  const query = rawQuery.trim().toLocaleLowerCase('en-GB');
  let dimensionIndex = 0;
  const presentFields = (fields: StatusField[]): PresentedStatusField[] => fields.map((field) => ({
    ...field,
    badgeClass: view.presentation.dimensions[dimensionIndex++]!.badgeClass
  }));

  const repositories = view.report.repositories
    .map((row) => ({ ...row, fields: presentFields(row.fields) }))
    .map((row) => filterSubject(row, [row.repoId], query))
    .filter((row): row is PresentedRepository => row !== null);

  const deployments = view.report.deployments
    .map((row) => ({ ...row, fields: presentFields(row.fields) }))
    .map((row) => filterSubject(row, [row.siteId, row.repoId, ...row.workloadIds], query))
    .filter((row): row is PresentedDeployment => row !== null);

  const unmatchedWorkloads = view.report.unmatchedWorkloads
    .map((row) => ({ ...row, fields: presentFields(row.fields) }))
    .map((row) => filterSubject(row, [row.workloadId, row.unit, row.classification], query))
    .filter((row): row is PresentedUnmatchedWorkload => row !== null);

  const containsQuery = (...values: unknown[]) => !query || values.some((value) =>
    normalize(value).includes(query)
  );

  return {
    repositories,
    deployments,
    unmatchedWorkloads,
    registryDiscrepancies: view.report.registryDiscrepancies.filter((item) =>
      containsQuery(item.action, item.target, item.evidenceRef, item.explanation)
    ),
    openExceptions: view.report.openExceptions.filter((item) =>
      containsQuery(
        item.findingId,
        item.exceptionId,
        item.subjectKind,
        item.subjectId,
        item.evidenceRef
      )
    ),
    blockers: view.report.blockers.filter((item) =>
      containsQuery(item.code, item.scope, item.subject, item.message)
    ),
    query: rawQuery.trim()
  };
}
