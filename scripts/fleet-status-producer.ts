/**
 * Fleet status producer — Phase 1 read-only backend for /admin/fleet.
 *
 * Serves a schema-valid DashboardView on the loopback endpoint the dashboard
 * already reads by default (http://127.0.0.1:4173/admin/fleet/api/status).
 * Collects source facts (git, package.json) and runtime facts (systemd,
 * /proc attestation) for a hardcoded Phase-1 catalog; never mutates anything.
 *
 * Run: bun scripts/fleet-status-producer.ts            (serve, refresh 60s)
 *      bun scripts/fleet-status-producer.ts --check    (build+validate, exit)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readlinkSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { dashboardViewSchema, type DashboardView } from '@/lib/fleet/schema';
import {
  compareSite,
  hasSauroScopes,
  loadParityManifest,
  scanTree,
  summarizeCounts,
  type ParityManifest
} from '@/lib/sauro-parity';

type CatalogEntry = {
  repoId: string;
  path: string;
  units: string[];
};

const CATALOG: CatalogEntry[] = [
  { repoId: 'asap', path: '/srv/apps/asap', units: ['vd-asap-blue.service', 'vd-asap-green.service'] },
  { repoId: 'velvetdinosaur', path: '/srv/apps/velvetdinosaur', units: ['vd-velvetdinosaur-blue.service'] },
  { repoId: 'ra', path: '/srv/apps/ra', units: ['vd-ra-blue.service', 'vd-ra-green.service'] },
  { repoId: 'thebrave', path: '/srv/apps/thebrave-release', units: ['vd-thebrave-blue.service', 'vd-thebrave-green.service'] },
  { repoId: 'vd-email-studio', path: '/srv/apps/vd-email-studio', units: ['vd-email-studio.service'] },
  { repoId: 'vd-social-api', path: '/srv/apps/vd-social-api', units: ['vd-social-api.service', 'vd-social-api-worker.service'] },
  { repoId: 'booking-api', path: '/srv/apps/booking-api', units: ['vd-booking-api.service'] },
  { repoId: 'theme-editor', path: '/opt/vdplatform/theme-editor', units: ['vd-theme-editor.service'] }
];

/** Units that run on this host by design but are not fleet deployments. */
const EXCLUDED_UNIT_CLASSIFICATION: Record<string, 'excluded' | 'source-less' | 'unmanaged'> = {
  'vd-installer-worker.service': 'excluded',
  'vd-fleet-producer.service': 'excluded',
  'vd-scholmock.service': 'unmanaged',
  'vd-space-scholardemia.service': 'source-less',
  'vd-social-api-mongo.service': 'excluded',
  'vd-ots-production.service': 'excluded'
};

const OPEN_EXCEPTIONS: DashboardView['report']['openExceptions'] = [
  {
    findingId: 'VERSION_UNKNOWN',
    exceptionId: 'EX-SCHOLMOCK-ADAPTER',
    expiresAt: '2026-09-07T00:00:00.000Z',
    subjectKind: 'workload',
    subjectId: 'vd-scholmock.service',
    evidenceRef: 'register://phase-0a-register.md#open-exceptions'
  },
  {
    findingId: 'SOURCE_LESS',
    exceptionId: 'EX-SPACE-DELETED-CWD',
    expiresAt: '2026-09-07T00:00:00.000Z',
    subjectKind: 'workload',
    subjectId: 'vd-space-scholardemia.service',
    evidenceRef: 'register://phase-0a-register.md#open-exceptions'
  },
  {
    findingId: 'REMEDIATION_OPEN',
    exceptionId: 'EX-JWT-ROTATION',
    expiresAt: '2026-09-07T00:00:00.000Z',
    subjectKind: 'deployment',
    subjectId: 'theme-editor',
    evidenceRef: 'register://phase-0a-register.md#w4'
  }
];

function sh(cmd: string, args: string[], cwd?: string): string | null {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', timeout: 15_000 }).trim();
  } catch {
    return null;
  }
}

function readJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function declaredDep(root: string, name: string): string | null {
  const pkg = readJson(join(root, 'package.json'));
  if (!pkg) return null;
  const deps = { ...(pkg.dependencies as object | undefined), ...(pkg.devDependencies as object | undefined) } as Record<
    string,
    string
  >;
  return deps[name] ?? null;
}

function installedDep(root: string, name: string): string | null {
  const pkg = readJson(join(root, 'node_modules', name, 'package.json'));
  return (pkg?.version as string | undefined) ?? null;
}

function unitProp(unit: string, prop: string): string | null {
  return sh('systemctl', ['show', unit, '-p', prop, '--value']);
}

/** Walk a unit's process tree looking for a `next-server (vX.Y.Z)` cmdline. */
function attestNextVersion(unit: string): string | null {
  const main = unitProp(unit, 'MainPID');
  if (!main || main === '0') return null;
  const queue = [main];
  for (let depth = 0; depth < 4 && queue.length; depth += 1) {
    const pids = queue.splice(0, queue.length);
    for (const pid of pids) {
      const cmd = sh('ps', ['-p', pid, '-o', 'cmd=']);
      const match = cmd?.match(/next-server \(v([0-9.]+)\)/);
      if (match) return match[1];
      const children = sh('pgrep', ['-P', pid]);
      if (children) queue.push(...children.split('\n').filter(Boolean));
    }
  }
  return null;
}

function unitCwdDeleted(unit: string): boolean {
  const main = unitProp(unit, 'MainPID');
  if (!main || main === '0') return false;
  try {
    readlinkSync(`/proc/${main}/cwd`);
    return false;
  } catch {
    return true;
  }
}

type Field = DashboardView['report']['repositories'][number]['fields'][number];
type Dimension = DashboardView['presentation']['dimensions'][number];

function buildView(): DashboardView {
  const now = new Date().toISOString();
  const dimensions: Dimension[] = [];

  const fact = (
    input: Pick<Field, 'key' | 'category'> &
      Partial<Pick<Field, 'packageName' | 'layer'>> & {
        value: string | null;
        explanation: string;
        evidenceRef: string;
        provenance?: Field['provenance'];
        label: string;
        badgeClass?: Dimension['badgeClass'];
      }
  ): Field => {
    const provenance = input.provenance ?? (input.value === null ? 'unknown' : 'verified');
    const freshnessValue = input.value === null ? 'unknown' : 'fresh';
    dimensions.push({
      key: input.key,
      label: input.label,
      category: input.category,
      badgeClass: input.badgeClass ?? (input.value === null ? 'unknown' : 'verified')
    });
    return {
      key: input.key,
      category: input.category,
      packageName: input.packageName ?? null,
      layer: input.layer ?? null,
      value: input.value,
      provenance,
      times: { sourceAt: now, runtimeAt: now, evidenceAt: now },
      freshness: {
        source: freshnessValue,
        runtime: freshnessValue,
        evidence: freshnessValue,
        overall: freshnessValue
      },
      evidenceRefs: [input.evidenceRef],
      explanation: input.explanation
    };
  };

  const repositories: DashboardView['report']['repositories'] = [];
  const deployments: DashboardView['report']['deployments'] = [];
  const blockers: DashboardView['report']['blockers'] = [];

  // Sauro UI parity telemetry (docs/platform/sauro-cms-ui-parity-plan.md, Wave 0):
  // hash-compare each Sauro site's admin/editor scopes against the reference
  // implementation so /admin/fleet shows UI drift alongside dependency drift.
  let parityManifest: ParityManifest | null = null;
  let parityReference: Map<string, string> | null = null;
  try {
    parityManifest = loadParityManifest(join(process.cwd(), 'docs/platform/sauro-core-manifest.json'));
    parityReference = scanTree(parityManifest.reference.path, parityManifest.scopes);
  } catch {
    parityManifest = null;
    parityReference = null;
  }

  for (const entry of CATALOG) {
    const isGit = existsSync(join(entry.path, '.git'));
    const branch = isGit ? sh('git', ['branch', '--show-current'], entry.path) : null;
    const commit = isGit ? sh('git', ['rev-parse', '--short', 'HEAD'], entry.path) : null;
    const dirtyOut = isGit ? sh('git', ['status', '--porcelain'], entry.path) : null;
    const worktree = isGit ? (dirtyOut === '' ? 'clean' : dirtyOut === null ? null : 'dirty') : 'not-a-git-repo';

    const fields: Field[] = [
      fact({
        key: `repository.${entry.repoId}.identity`,
        category: 'identity',
        value: entry.repoId,
        label: 'Repository identity',
        explanation: 'Phase-1 static catalog entry for this repository.',
        evidenceRef: `catalog://repositories/${entry.repoId}`
      }),
      fact({
        key: `repository.${entry.repoId}.branch`,
        category: 'identity',
        value: branch,
        label: 'Checked-out branch',
        explanation: branch ? 'Branch read from the working checkout.' : 'Branch could not be read.',
        evidenceRef: `git://${entry.path}#branch`
      }),
      fact({
        key: `repository.${entry.repoId}.commit`,
        category: 'identity',
        value: commit,
        label: 'HEAD commit',
        explanation: commit ? 'Short commit hash of the checkout HEAD.' : 'Commit could not be read.',
        evidenceRef: `git://${entry.path}#head`
      }),
      fact({
        key: `repository.${entry.repoId}.worktree`,
        category: 'lifecycle',
        value: worktree,
        label: 'Worktree state',
        badgeClass: worktree === 'clean' ? 'verified' : worktree === 'dirty' ? 'stale' : 'unknown',
        explanation:
          worktree === 'not-a-git-repo'
            ? 'Tree is not under version control.'
            : 'Whether the operator checkout carries uncommitted changes.',
        evidenceRef: `git://${entry.path}#status`
      }),
      fact({
        key: `repository.${entry.repoId}.next.declared`,
        category: 'dependency',
        packageName: 'next',
        layer: 'source-declared',
        value: declaredDep(entry.path, 'next'),
        label: 'next (declared)',
        explanation: 'Version pinned in package.json.',
        evidenceRef: `file://${entry.path}/package.json`
      }),
      fact({
        key: `repository.${entry.repoId}.next.installed`,
        category: 'dependency',
        packageName: 'next',
        layer: 'source-installed',
        value: installedDep(entry.path, 'next'),
        label: 'next (installed)',
        explanation: 'Version present in node_modules.',
        evidenceRef: `file://${entry.path}/node_modules/next/package.json`
      }),
      fact({
        key: `repository.${entry.repoId}.better-auth.declared`,
        category: 'dependency',
        packageName: 'better-auth',
        layer: 'source-declared',
        value: declaredDep(entry.path, 'better-auth') ?? 'absent',
        label: 'better-auth (declared)',
        explanation: 'Version pinned in package.json, or absent when the app does not use it.',
        evidenceRef: `file://${entry.path}/package.json`
      })
    ];

    // Puck migration telemetry: report the deprecated package and its successor
    // side by side so /admin/fleet shows the 0.20.2 -> @puckeditor/core drift
    // per site as the migration rolls out.
    const legacyPuck = declaredDep(entry.path, '@measured/puck');
    const successorPuck = declaredDep(entry.path, '@puckeditor/core');
    if (legacyPuck || successorPuck) {
      fields.push(
        fact({
          key: `repository.${entry.repoId}.measured-puck.declared`,
          category: 'dependency',
          packageName: '@measured/puck',
          layer: 'source-declared',
          value: legacyPuck ?? 'absent',
          label: '@measured/puck (declared)',
          badgeClass: legacyPuck ? 'stale' : 'remediated',
          explanation: legacyPuck
            ? 'Deprecated Puck package still declared; migration target is @puckeditor/core.'
            : 'Deprecated Puck package no longer declared.',
          evidenceRef: `file://${entry.path}/package.json`
        }),
        fact({
          key: `repository.${entry.repoId}.puckeditor-core.declared`,
          category: 'dependency',
          packageName: '@puckeditor/core',
          layer: 'source-declared',
          value: successorPuck ?? 'absent',
          label: '@puckeditor/core (declared)',
          badgeClass: successorPuck ? 'verified' : 'unknown',
          explanation: successorPuck
            ? 'Successor Puck package declared - migration applied on this repository.'
            : 'Successor Puck package not yet declared on this repository.',
          evidenceRef: `file://${entry.path}/package.json`
        })
      );
    }

    const isParitySite = parityManifest?.sites.some((site) => site.name === entry.repoId) ?? false;
    if (parityManifest && parityReference && isParitySite && hasSauroScopes(entry.path, parityManifest)) {
      const parity = compareSite(parityManifest, entry.repoId, entry.path, parityReference);
      const { value, inParity } = summarizeCounts(parity.counts);
      const isReference = entry.path === parityManifest.reference.path;
      fields.push(
        fact({
          key: `repository.${entry.repoId}.sauro-ui-parity`,
          category: 'template',
          value: isReference ? `reference (${parity.counts.identical} core files)` : value,
          label: 'Sauro UI parity',
          badgeClass: isReference || inParity ? 'verified' : 'stale',
          explanation: isReference
            ? 'This checkout is the parity reference implementation.'
            : inParity
              ? 'Sauro core UI matches the reference implementation byte-for-byte.'
              : 'Sauro core UI drifts from the reference implementation; see bun run sauro:parity for detail.',
          evidenceRef: `file://${process.cwd()}/docs/platform/sauro-core-manifest.json`
        })
      );
    }

    const findings: string[] = [];
    if (worktree === 'dirty') findings.push('WORKTREE_DIRTY');
    repositories.push({ repoId: entry.repoId, fields, findings, blockers: [] });
  }

  // Second pass: deployment rows. Kept separate from the repository pass because
  // the schema requires presentation dimensions in report-section order
  // (all repository fields, then all deployment fields, then workloads).
  for (const entry of CATALOG) {
    for (const unit of entry.units) {
      const active = unitProp(unit, 'ActiveState');
      if (active === null) continue;
      const running = active === 'active';
      const attested = running ? attestNextVersion(unit) : null;
      const deploymentFields: Field[] = [
        fact({
          key: `deployment.${unit}.identity`,
          category: 'identity',
          value: unit,
          label: 'Deployment unit',
          explanation: 'systemd unit backing this deployment.',
          evidenceRef: `systemd://${unit}`
        }),
        fact({
          key: `deployment.${unit}.state`,
          category: 'lifecycle',
          value: active,
          label: 'Service state',
          badgeClass: running ? 'verified' : 'stale',
          explanation: 'ActiveState reported by systemd.',
          evidenceRef: `systemd://${unit}#ActiveState`
        }),
        fact({
          key: `deployment.${unit}.next.running`,
          category: 'attestation',
          packageName: 'next',
          layer: 'selected-running',
          value: attested,
          label: 'next (running)',
          badgeClass: attested ? 'verified' : running ? 'blocked' : 'unknown',
          provenance: attested ? 'verified' : 'unknown',
          explanation: attested
            ? 'Version attested from the live next-server process.'
            : running
              ? 'Running, but no next-server process version could be attested.'
              : 'Unit is not running; nothing to attest.',
          evidenceRef: `proc://${unit}#next-server`
        })
      ];
      const deploymentFindings: string[] = [];
      const deploymentBlockers: string[] = [];
      if (running && !attested) {
        deploymentFindings.push('UNATTESTED');
      }
      deployments.push({
        siteId: entry.repoId,
        repoId: entry.repoId,
        workloadIds: [unit],
        fields: deploymentFields,
        findings: deploymentFindings,
        blockers: deploymentBlockers
      });
    }
  }

  const catalogedUnits = new Set(CATALOG.flatMap((entry) => entry.units));
  const unmatchedWorkloads: DashboardView['report']['unmatchedWorkloads'] = [];
  const registryDiscrepancies: DashboardView['report']['registryDiscrepancies'] = [];
  const unitList = sh('systemctl', ['list-units', 'vd-*.service', '--no-legend', '--plain', '--no-pager']) ?? '';
  for (const line of unitList.split('\n').filter(Boolean)) {
    const unit = line.split(/\s+/)[0];
    if (!unit || catalogedUnits.has(unit)) continue;
    const classification = EXCLUDED_UNIT_CLASSIFICATION[unit] ?? 'unmanaged';
    const attested = attestNextVersion(unit);
    const deletedCwd = unitCwdDeleted(unit);
    const workloadFindings: string[] = [];
    const workloadBlockers: string[] = [];
    if (classification === 'unmanaged') {
      workloadFindings.push('UNMANAGED');
      workloadBlockers.push('UNMANAGED');
      blockers.push({
        code: 'UNMANAGED',
        scope: 'workload',
        subject: unit,
        message: 'Workload runs on this host without an enrolled fleet deployment.',
        observedAt: now
      });
      registryDiscrepancies.push({
        action: 'enrol-workload',
        target: unit,
        evidenceRef: `systemd://${unit}`,
        explanation: 'Review and enrol this workload or document its exclusion.'
      });
    }
    if (classification === 'source-less' || deletedCwd) {
      workloadFindings.push('SOURCE_LESS');
      workloadBlockers.push('SOURCE_LESS');
      blockers.push({
        code: 'SOURCE_LESS',
        scope: 'workload',
        subject: unit,
        message: deletedCwd
          ? 'Process runs from a deleted directory; a restart will fail until its tree is re-established.'
          : 'No authoritative source tree is mapped for this workload.',
        observedAt: now
      });
    }
    unmatchedWorkloads.push({
      workloadId: unit,
      unit,
      classification,
      fields: [
        fact({
          key: `workload.${unit}.identity`,
          category: 'identity',
          value: unit,
          label: 'Workload unit',
          badgeClass: workloadBlockers.length ? 'blocked' : 'inferred',
          provenance: 'inferred',
          explanation: `Observed vd-* unit outside the deployment catalog (${classification}).`,
          evidenceRef: `systemd://${unit}`
        }),
        fact({
          key: `workload.${unit}.next.running`,
          category: 'attestation',
          packageName: 'next',
          layer: 'selected-running',
          value: attested,
          label: 'next (running)',
          badgeClass: attested ? 'inferred' : 'unknown',
          provenance: attested ? 'inferred' : 'unknown',
          explanation: attested ? 'Version attested from the live process.' : 'No next-server process attested.',
          evidenceRef: `proc://${unit}#next-server`
        })
      ],
      findings: workloadFindings,
      blockers: workloadBlockers
    });
  }

  const allFields = [
    ...repositories.flatMap((row) => row.fields),
    ...deployments.flatMap((row) => row.fields),
    ...unmatchedWorkloads.flatMap((row) => row.fields)
  ];
  const unknownFacts = allFields.filter((field) => field.provenance === 'unknown').length;

  const report: DashboardView['report'] = {
    schemaVersion: 1,
    generatedAt: now,
    authorizesAction: false,
    inputs: {
      sourceAt: now,
      runtimeAt: now,
      evidenceAt: now,
      cacheAt: now,
      sourceFreshness: 'fresh',
      runtimeFreshness: 'fresh',
      evidenceFreshness: 'fresh',
      cacheFreshness: 'fresh'
    },
    audit: {
      value: 'read-only',
      provenance: 'verified',
      times: { sourceAt: now, runtimeAt: now, evidenceAt: now },
      freshness: { source: 'fresh', runtime: 'fresh', evidence: 'fresh', overall: 'fresh' },
      evidenceRefs: ['producer://fleet-status-producer'],
      explanation: 'Report generated read-only from git, package.json, systemd, and /proc on this host.'
    },
    repositories,
    deployments,
    unmatchedWorkloads,
    registryDiscrepancies,
    openExceptions: OPEN_EXCEPTIONS,
    blockers,
    summary: {
      repositories: repositories.length,
      deployments: deployments.length,
      unmatchedWorkloads: unmatchedWorkloads.length,
      blockers: blockers.length,
      staleFacts: 0,
      unknownFacts,
      openExceptions: OPEN_EXCEPTIONS.length
    }
  };

  return dashboardViewSchema.parse({
    schemaVersion: 1,
    generatedAt: now,
    authorizesAction: false,
    report,
    presentation: { dimensions }
  });
}

const REFRESH_MS = 60_000;
let cached: { at: number; body: string } | null = null;

function statusBody(): string {
  if (cached && Date.now() - cached.at < REFRESH_MS) return cached.body;
  const body = JSON.stringify(buildView());
  cached = { at: Date.now(), body };
  return body;
}

if (process.argv.includes('--check')) {
  const view = buildView();
  console.log(
    `fleet-status: valid; ${view.report.summary.repositories} repos, ${view.report.summary.deployments} deployments, ` +
      `${view.report.summary.unmatchedWorkloads} unmatched, ${view.report.summary.blockers} blockers, ` +
      `${view.report.summary.unknownFacts} unknown facts`
  );
  process.exit(0);
}

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/admin/fleet/api/status') {
    try {
      const body = statusBody();
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(body);
    } catch (error) {
      console.error('fleet-status: build failed', error);
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'status generation failed' }));
    }
    return;
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(4173, '127.0.0.1', () => {
  console.log('fleet-status: serving on http://127.0.0.1:4173/admin/fleet/api/status');
});
