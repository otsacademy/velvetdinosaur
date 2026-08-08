import type { DashboardView } from '@/lib/fleet/schema';

const generatedAt = '2026-08-02T08:30:00.000Z';

function field(
  key: string,
  value: string,
  explanation: string,
  evidenceRef: string
): DashboardView['report']['repositories'][number]['fields'][number] {
  return {
    key,
    category: 'identity',
    packageName: null,
    layer: null,
    value,
    provenance: 'verified',
    times: {
      sourceAt: generatedAt,
      runtimeAt: generatedAt,
      evidenceAt: generatedAt
    },
    freshness: {
      source: 'fresh',
      runtime: 'fresh',
      evidence: 'fresh',
      overall: 'fresh'
    },
    evidenceRefs: [evidenceRef],
    explanation
  };
}

export const fleetStatusFixture = {
  schemaVersion: 1,
  generatedAt,
  authorizesAction: false,
  report: {
    schemaVersion: 1,
    generatedAt,
    authorizesAction: false,
    inputs: {
      sourceAt: generatedAt,
      runtimeAt: generatedAt,
      evidenceAt: generatedAt,
      cacheAt: generatedAt,
      sourceFreshness: 'fresh',
      runtimeFreshness: 'fresh',
      evidenceFreshness: 'fresh',
      cacheFreshness: 'fresh'
    },
    audit: {
      value: 'verified',
      provenance: 'verified',
      times: {
        sourceAt: generatedAt,
        runtimeAt: generatedAt,
        evidenceAt: generatedAt
      },
      freshness: {
        source: 'fresh',
        runtime: 'fresh',
        evidence: 'fresh',
        overall: 'fresh'
      },
      evidenceRefs: ['evidence://fleet/audit'],
      explanation: 'The fixture report is internally consistent and read-only.'
    },
    repositories: [
      {
        repoId: 'velvetdinosaur',
        fields: [
          field(
            'repository.identity',
            'velvetdinosaur',
            'The enrolled repository identity matches the catalog.',
            'catalog://repositories/velvetdinosaur'
          )
        ],
        findings: [],
        blockers: []
      }
    ],
    deployments: [
      {
        siteId: 'velvetdinosaur',
        repoId: 'velvetdinosaur',
        workloadIds: ['vd-velvetdinosaur-blue.service'],
        fields: [
          field(
            'deployment.identity',
            'vd-velvetdinosaur-blue.service',
            'The selected workload maps to the expected deployment.',
            'systemd://vd-velvetdinosaur-blue.service'
          )
        ],
        findings: ['DEPLOYMENT_OBSERVED'],
        blockers: []
      }
    ],
    unmatchedWorkloads: [
      {
        workloadId: 'vd-orphan-worker.service',
        unit: 'vd-orphan-worker.service',
        classification: 'unmanaged',
        fields: [
          field(
            'workload.identity',
            'vd-orphan-worker.service',
            'The workload is running without an enrolled deployment.',
            'systemd://vd-orphan-worker.service'
          )
        ],
        findings: ['UNMANAGED'],
        blockers: ['UNMANAGED']
      }
    ],
    registryDiscrepancies: [
      {
        action: 'enrol-workload',
        target: 'vd-orphan-worker.service',
        evidenceRef: 'systemd://vd-orphan-worker.service',
        explanation: 'Review and enrol the observed workload or document its exclusion.'
      }
    ],
    openExceptions: [
      {
        findingId: 'RUNTIME_STALE',
        exceptionId: 'EX-2026-08',
        expiresAt: '2026-08-09T08:30:00.000Z',
        subjectKind: 'deployment',
        subjectId: 'velvetdinosaur',
        evidenceRef: 'exception://EX-2026-08'
      }
    ],
    blockers: [
      {
        code: 'UNMANAGED',
        scope: 'workload',
        subject: 'vd-orphan-worker.service',
        message: 'An observed workload is not represented in the fleet registry.',
        observedAt: generatedAt
      }
    ],
    summary: {
      repositories: 1,
      deployments: 1,
      unmatchedWorkloads: 1,
      blockers: 1,
      staleFacts: 0,
      unknownFacts: 0,
      openExceptions: 1
    }
  },
  presentation: {
    dimensions: [
      { key: 'repository.identity', label: 'Repository identity', category: 'identity', badgeClass: 'verified' },
      { key: 'deployment.identity', label: 'Deployment identity', category: 'identity', badgeClass: 'fresh' },
      { key: 'workload.identity', label: 'Workload identity', category: 'identity', badgeClass: 'blocked' }
    ]
  }
} satisfies DashboardView;
