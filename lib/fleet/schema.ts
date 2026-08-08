import { z } from 'zod';

export const FLEET_DASHBOARD_SCHEMA_VERSION = 1 as const;

const isoTimestamp = z.string().max(64).regex(/^\d{4}-\d{2}-\d{2}T/);
const nullableTimestamp = isoTimestamp.nullable();
const printableText = (max: number) => z.string().min(1).max(max).regex(/^[ -~]+$/);
const identifier = z.string().min(1).max(256).regex(/^[A-Za-z0-9][A-Za-z0-9._:@/|,-]*$/);
const repositoryId = z.string().min(2).max(64).regex(/^[a-z][a-z0-9-]+$/);
const findingCode = z.string().min(1).max(128).regex(/^[A-Z0-9][A-Z0-9._:-]*$/);

export const freshnessSchema = z.enum(['fresh', 'stale', 'unknown']);
export const provenanceSchema = z.enum(['verified', 'inferred', 'unknown']);
export const badgeClassSchema = z.enum([
  'fresh',
  'stale',
  'unknown',
  'verified',
  'inferred',
  'remediated',
  'exception-open',
  'blocked'
]);
export const fieldCategorySchema = z.enum([
  'identity',
  'adapter',
  'dependency',
  'template',
  'lifecycle',
  'attestation',
  'gate',
  'remediation',
  'audit'
]);

const dependencyNameSchema = z.enum([
  'react',
  'react-dom',
  'next',
  'better-auth',
  '@measured/puck',
  '@puckeditor/core'
]);

const dependencyLayerSchema = z.enum([
  'desired',
  'source-declared',
  'source-installed',
  'deployed-installed',
  'selected-running'
]);

const factTimesSchema = z.strictObject({
  sourceAt: nullableTimestamp,
  runtimeAt: nullableTimestamp,
  evidenceAt: nullableTimestamp
});

const factFreshnessSchema = z.strictObject({
  source: freshnessSchema,
  runtime: freshnessSchema,
  evidence: freshnessSchema,
  overall: freshnessSchema
});

const statusFactShape = {
  value: z.string().max(4096).nullable(),
  provenance: provenanceSchema,
  times: factTimesSchema,
  freshness: factFreshnessSchema,
  evidenceRefs: z.array(printableText(1024)).max(1000),
  explanation: printableText(2048)
};

export const statusFieldSchema = z.strictObject({
  key: z.string().min(1).max(256).regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/),
  category: fieldCategorySchema,
  packageName: dependencyNameSchema.nullable(),
  layer: dependencyLayerSchema.nullable(),
  ...statusFactShape
});

const findingsSchema = z.array(findingCode).max(10_000);

const repositoryStatusSchema = z.strictObject({
  repoId: repositoryId,
  fields: z.array(statusFieldSchema).max(10_000),
  findings: findingsSchema,
  blockers: findingsSchema
});

const deploymentStatusSchema = z.strictObject({
  siteId: repositoryId,
  repoId: repositoryId,
  workloadIds: z.array(identifier).max(10_000),
  fields: z.array(statusFieldSchema).max(10_000),
  findings: findingsSchema,
  blockers: findingsSchema
});

const unmatchedWorkloadSchema = z.strictObject({
  workloadId: identifier,
  unit: z.string().min(1).max(256).regex(/^[A-Za-z0-9][A-Za-z0-9@_.:-]*$/).nullable(),
  classification: z.enum([
    'unmanaged',
    'source-less',
    'excluded',
    'disabled',
    'exclusion-policy'
  ]),
  fields: z.array(statusFieldSchema).max(10_000),
  findings: findingsSchema,
  blockers: findingsSchema
});

const registryDiscrepancySchema = z.strictObject({
  action: z.string().min(2).max(64).regex(/^[a-z][a-z0-9-]+$/),
  target: printableText(1024),
  evidenceRef: printableText(1024),
  explanation: printableText(2048)
});

const openExceptionSchema = z.strictObject({
  findingId: z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/),
  exceptionId: z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/),
  expiresAt: isoTimestamp,
  subjectKind: z.enum(['repository', 'deployment', 'workload']),
  subjectId: z.string().min(1).max(256).regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/),
  evidenceRef: printableText(1024)
});

const blockerSchema = z.strictObject({
  code: z.enum([
    'CATALOG_INVALID',
    'DESIRED_STATE_UNKNOWN',
    'DOCTOR_BLOCKING',
    'EVIDENCE_INVALID',
    'EVIDENCE_STALE',
    'EXCEPTION_EXPIRED',
    'INVENTORY_INCOMPLETE',
    'RUNTIME_STALE',
    'SOURCE_UNKNOWN',
    'SOURCE_LESS',
    'UNATTESTED',
    'UNMANAGED',
    'VERSION_UNKNOWN',
    'DISABLED',
    'EXCLUDED',
    'REMEDIATION_OPEN',
    'SLOT_CONFLICT'
  ]),
  scope: z.enum(['control', 'repository', 'deployment', 'workload']),
  subject: identifier,
  message: printableText(2048),
  observedAt: nullableTimestamp
});

const inputSummarySchema = z.strictObject({
  sourceAt: nullableTimestamp,
  runtimeAt: nullableTimestamp,
  evidenceAt: nullableTimestamp,
  cacheAt: nullableTimestamp,
  sourceFreshness: freshnessSchema,
  runtimeFreshness: freshnessSchema,
  evidenceFreshness: freshnessSchema,
  cacheFreshness: freshnessSchema
});

const summarySchema = z.strictObject({
  repositories: z.number().int().nonnegative(),
  deployments: z.number().int().nonnegative(),
  unmatchedWorkloads: z.number().int().nonnegative(),
  blockers: z.number().int().nonnegative(),
  staleFacts: z.number().int().nonnegative(),
  unknownFacts: z.number().int().nonnegative(),
  openExceptions: z.number().int().nonnegative()
});

const statusReportSchema = z.strictObject({
  schemaVersion: z.literal(FLEET_DASHBOARD_SCHEMA_VERSION),
  generatedAt: isoTimestamp,
  authorizesAction: z.literal(false),
  inputs: inputSummarySchema,
  audit: z.strictObject(statusFactShape),
  repositories: z.array(repositoryStatusSchema).max(1000),
  deployments: z.array(deploymentStatusSchema).max(1000),
  unmatchedWorkloads: z.array(unmatchedWorkloadSchema).max(10_000),
  registryDiscrepancies: z.array(registryDiscrepancySchema).max(10_000),
  openExceptions: z.array(openExceptionSchema).max(10_000),
  blockers: z.array(blockerSchema).max(100_000),
  summary: summarySchema
});

const dashboardDimensionSchema = z.strictObject({
  key: z.string().min(1).max(256).regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/),
  label: printableText(256),
  category: fieldCategorySchema,
  badgeClass: badgeClassSchema
});

export const dashboardViewSchema = z.strictObject({
  schemaVersion: z.literal(FLEET_DASHBOARD_SCHEMA_VERSION),
  generatedAt: isoTimestamp,
  authorizesAction: z.literal(false),
  report: statusReportSchema,
  presentation: z.strictObject({
    dimensions: z.array(dashboardDimensionSchema).max(1000)
  })
}).superRefine((view, context) => {
  const fields = [
    ...view.report.repositories.flatMap((row) => row.fields),
    ...view.report.deployments.flatMap((row) => row.fields),
    ...view.report.unmatchedWorkloads.flatMap((row) => row.fields)
  ];

  if (fields.length !== view.presentation.dimensions.length) {
    context.addIssue({
      code: 'custom',
      path: ['presentation', 'dimensions'],
      message: 'presentation dimensions must cover every status field'
    });
    return;
  }

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const dimension = view.presentation.dimensions[index];
    if (field.key !== dimension.key || field.category !== dimension.category) {
      context.addIssue({
        code: 'custom',
        path: ['presentation', 'dimensions', index],
        message: 'presentation dimension order must match report field order'
      });
      return;
    }
  }
});

export type Freshness = z.infer<typeof freshnessSchema>;
export type BadgeClass = z.infer<typeof badgeClassSchema>;
export type StatusField = z.infer<typeof statusFieldSchema>;
export type DashboardView = z.infer<typeof dashboardViewSchema>;
export type RepositoryStatus = DashboardView['report']['repositories'][number];
export type DeploymentStatus = DashboardView['report']['deployments'][number];
export type UnmatchedWorkloadStatus = DashboardView['report']['unmatchedWorkloads'][number];
