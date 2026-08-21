# VD Fleet Upgrade System — Revised Plan

**Status:** Revised draft; fleet-engine implementation is blocked on Phase 0 readiness. The Phase 0a runtime-security track starts immediately and is not blocked on the fleet control plane.

**Date:** 2026-07-28

**Last revised:** 2026-07-28 (rev 3 — post-audit revision: expands urgent security scope from repositories to running workloads; corrects Better Auth advisory and MongoDB-migration assumptions; separates repository and deployment identity; adds sandbox and privileged-release trust boundaries, approval binding, rollout/child-job state, runtime attestation, reconciliation, and isolated acceptance-test requirements; makes Puck counting SHA-bound and non-self-referential.)

**Scope:** Fleet orchestration covers explicitly enrolled source repositories and their cataloged deployments. The Phase 0a security overlay covers every running workload on the host, including non-enrolled, non-Git, legacy, and generated deployment trees.

## 1. Goal

Provide one control plane for discovering drift, preparing dependency and template changes, collecting evidence, and releasing an approved commit across enrolled sites.

"Upgrade all" means an orchestrated, cohort-aware rollout. It does not mean changing every checkout in place or assuming every repository has the same branch, quality, or deployment model.

### Non-goals

- Do not treat deployment slots, release worktrees, or staging copies as fleet members.
- Do not run arbitrary package names, versions, shell commands, or codemods supplied by the admin UI.
- Do not replace each repository's quality manifest or release contract with generic fleet logic.
- Do not force all repositories into a `develop` → `main` blue/green model.
- Do not include shared database, nginx, certificate, or runtime upgrades in the per-site dependency loop.
- Do not enroll exceptional repositories until their adapter and ownership model are explicit.

## 2. Audit conclusions

The original direction—read visibility first, local gates, canaries, evidence, explicit release, and 3-way sync—is sound. The following assumptions must be corrected before implementation:

1. `/srv/apps/velvetdinosaur` is a deployed site repository with a `main`-only, manual-release override. It is not currently the source of `/opt/vdplatform/template`.
2. `/opt/vdplatform` contains the apparent canonical template and installer runtime, but it is not a Git worktree. A retrievable Git source commit is required for safe releases and true 3-way template sync.
3. `/var/lib/vd-platform/registry.json` is runtime installer state, not a durable fleet catalog. Installer code replaces site entries and would discard added branch/path metadata.
4. The active root installer worker consumes every JSON file in `/opt/vdplatform/installer/jobs/queued` as an install job. Fleet jobs must never share that queue.
5. Fleet repositories do not share one branch or release model. Several operator checkouts are dirty or on feature branches, one source branch is checked out in another worktree, and some repositories are intentionally `main`-only.
6. The current dependency baseline contains urgent security debt. Security stabilization precedes the React and Puck pilots.
7. `bun run quality --only <target>` is insufficient for repositories with multiple targets. Fleet validation must honor the whole local manifest.
8. The Puck migration touches substantially more code and CSS entry points than originally estimated and needs cohort-specific editor validation.
9. Copied template files have historical divergence. First-time sync requires an adoption decision per path, not an automatic overwrite.
10. Cross-repository Bun workspaces are not available without an umbrella workspace. Shared-package distribution must be selected before package extraction.
11. Repositories outside the enrolled set — `vd-email-studio` and `vd-social-api` — carry the same vulnerable dependency baseline (`better-auth 1.4.10`, `next 16.1.1`). Security remediation scope must cover them explicitly even though fleet orchestration does not.
12. `/var/lib/vd-platform/registry.json` stores a plaintext JWT secret, is group-readable, and that secret is replicated across ~90 historical `registry.json.bak.*` files. Any fleet tooling that reads or compares registry contents must be redaction-safe, and the secret must be rotated out of installer state.
13. Repository inventory is insufficient for security remediation. Running services sourced from non-Git or legacy deployment trees also carry affected Next.js versions, including `booking-api`, the platform theme editor, Scholardemia, Scholmock, Thenewbrave, the Scholardemia space service, and the legacy OTS deployment.
14. The surveyed Better Auth applications use MongoDB, for which Better Auth does not require schema generation or migration. The cited advisories are configuration-conditional; package versions are vulnerable, but the current code scan did not reproduce the critical advisory's plugin prerequisites or the high advisory's open-registration prerequisite.
15. A least-privilege worker alone is not a sufficient trust boundary. Dependency lifecycle scripts, repository quality commands, codemods, and repository release scripts are executable code and must never inherit production secrets or root privileges.
16. Fleet rollout is a parent/child workflow, not a single linear job. Cohort canaries, waves, observation windows, pause thresholds, partial success, crash reconciliation, and rollback require first-class rollout and per-deployment attempt records.
17. Git common-directory paths are valid local lock keys but are not durable fleet identities. Repository identity and deployment identity must be separate, and one reviewed repository may feed more than one deployment.
18. Approval must be cryptographically or digest-bound to the complete reviewed result and evidence. An actor name and timestamp do not prevent catalog, adapter, evidence, or prepared-result substitution.

## 3. Verified current state

### 3.1 Control and state locations

| Concern | Current location | Revised role |
|---|---|---|
| Apparent template and installer runtime | `/opt/vdplatform` | Deployed runtime only; must be reproducible from a Git commit |
| Deployed Velvet Dinosaur site | `/srv/apps/velvetdinosaur` | A fleet member with a `main`-only/manual release adapter |
| Installer runtime registry | `/var/lib/vd-platform/registry.json` | Installer projection and discovery input; not fleet source of truth |
| Installer jobs | `/opt/vdplatform/installer/jobs` | Installer-only; never used for fleet work |
| Proposed fleet runtime state | `/var/lib/vd-platform/fleet` | Dedicated rollouts, jobs, approvals, locks, evidence, status cache, audit records, and logs |
| Proposed fleet source | Git-backed platform-control repository | Versioned catalog, policies, recipes, codemods, and sync sources |

The Phase 0 recommendation is a dedicated Git-backed platform-control checkout, provisionally `/srv/apps/vdplatform-control`, or restoration of the repository that produces `/opt/vdplatform`. The exact repository and path are an explicit decision; the runtime tree must not become an unversioned source of truth.

### 3.2 Repository readiness

| Repository identity | Observed model | Enrollment disposition |
|---|---|---|
| `velvetdinosaur` | `main`-only; manual/in-place release override | Enroll with its own adapter; never assume blue/green |
| `asap` | `develop` source; Plate editorial divergence; checkout dirty at audit | Enroll after cataloging divergence; prepare in an isolated worktree |
| `ra` | Feature checkout with `develop`/`main`; checkout dirty at audit | Enroll after release adapter verification |
| `pyanal` / `designer` | **RESOLVED 2026-08-21: pyanal retired.** It was the old central support hub + analytics sink behind `designer.velvetdinosaur.com` (dead since the 2026-07-28 nginx consolidation; superseded by the VD fleet dashboard). DB + checkout archived in `/opt/vdplatform/backups/pyanal-retirement-20260821`; both subdomains now redirect to velvetdinosaur.com; stale env references scrubbed fleet-wide. The separate `vd_designer` name was thebrave's misnamed database, unrelated. |
| `thebrave` | Feature checkout; `develop` is checked out in `/srv/apps/thebrave-release` | Enroll by Git repository identity, not directory suffix |
| `ots-sauro-poc` | `main`-only; dirty; copied ASAP metadata and quality target paths | Disabled until metadata, gates, and release adapter are corrected |
| `scholardemia` | Separate monorepo and worktree flow; PostgreSQL is authoritative; no root fleet-compatible scripts | Separate cohort; disabled until a dedicated adapter exists |

At the time of audit, no surveyed checkout satisfied the original "clean and on `develop`" preflight. This is not solved by skipping every site. Preparation must use temporary Git worktrees created from exact source refs and must leave operator checkouts untouched.

Fleet identity has two levels: a durable cataloged repository ID and a durable deployment/site ID that references it. The resolved Git common directory is only a host-local lock/deduplication key. Directory names such as `-release`, `-blue`, or `-green` are hints only and are never sufficient to decide whether a checkout is a source or artifact.

`velvetdinosaur` itself demonstrates copied-metadata drift: the repository carries template `deploy:blue-green` scripts and `deploy/local-first.json` although its documented contract is manual/in-place (`deploy:manual` / `deploy:safe`). Release adapters must therefore be verified against each repository's documented override, never inferred from which scripts happen to exist in `package.json`.

#### Surveyed and not enrolled

Absence from the fleet is a recorded decision, not an oversight. Every repository under `/srv/apps` falls into exactly one table; new arrivals must be surveyed into one of them.

| Repository | Observation (2026-07-28) | Disposition |
|---|---|---|
| `vd-email-studio` | `main`, clean; shares the vulnerable baseline (`better-auth 1.4.10`, `next 16.1.1`) | Outside fleet orchestration; **inside** Phase 0a security-remediation scope |
| `vd-social-api` | `main`, clean; shares the vulnerable baseline | Outside fleet orchestration; **inside** Phase 0a security-remediation scope |
| `claude-squad` | `main`; unrelated tooling; no template dependency baseline | Excluded |
| Non-Git directories (`asap-staging`, `booking-api`, `scholmock`, `scholardemia-*`, `ots-sauro-poc-{blue,green,current}`, `sites`, `worktrees`, `logs`) | A mixture of deployment artifacts, staging copies, backups, non-repo data, and active unmanaged workloads | Not enrollable from those paths unless authoritative Git source is recovered; active workloads remain in Phase 0a |

The last row is a fleet-membership decision only. It is not a security exemption. A running process sourced from a non-Git tree remains in Phase 0a scope until it is mapped to an authoritative source and a reviewed release or retirement runbook.

#### Running-workload security overlay

Phase 0a is keyed by running workload, not by Git repository. A 2026-07-28 systemd and deployed-package survey found the following additional workloads outside the six template-site candidates:

| Running workload | Observed deployed baseline | Phase 0a disposition |
|---|---|---|
| `vd-booking-api.service` | `/srv/apps/booking-api`; Next.js `16.1.1`, Better Auth `1.4.10`; public nginx route; no Git source at that path | Urgent: identify authoritative source or create a recovery commit before upgrade; add rollback and release runbook |
| `vd-theme-editor.service` | `/opt/vdplatform/theme-editor`; Next.js `16.1.1`; public nginx route; runtime tree is not Git-backed | Urgent: recover authoritative source, patch independently of the fleet engine, and coordinate JWT-secret rotation |
| `vd-scholardemia-{blue,green}.service` | source manifest Next.js `16.2.10`, Better Auth `1.6.23`; public domains | Urgent Next.js remediation through Scholardemia's dedicated local release flow despite fleet exclusion |
| `vd-scholmock.service` | deployed Next.js `16.2.6`; public nginx route | Urgent: map `/srv/apps/scholmock/current` to source and patch or retire |
| `vd-thenewbrave-api.service` | deployed Next.js `16.1.1` from a legacy restore-named tree | Urgent: confirm public exposure, source authority, ownership, and patch/retirement path |
| `vd-space-scholardemia.service` | deployed Next.js `16.0.10` | Urgent: confirm source authority and patch/retirement path |
| `vd-ots-production.service` | installed Next.js `15.3.5` under `/var/www/ontourism.academy` | Urgent: move to a vendor-supported patched line or retire; do not infer safety from a ranged manifest |

Enrolled source repositories still own the remediation of their blue/green slot copies, but Phase 0a verifies the version actually running after release. Source `package.json` state alone does not satisfy the security exit criterion.

### 3.3 Security baseline

A 2026-07-28 `bun audit --json` snapshot against `/opt/vdplatform/template` reported 155 advisories across 32 packages: 3 critical, 74 high, 64 moderate, and 14 low. An independent re-run during the verification audit reproduced these counts exactly. Counts are a point-in-time diagnostic, not a permanent acceptance threshold.

All six enrolled-candidate sites and the template are uniformly on `next 16.1.1`, `better-auth 1.4.10`, and `@measured/puck 0.20.2`. The non-enrolled `vd-email-studio` and `vd-social-api` share the `next`/`better-auth` baseline (§3.2) and are in remediation scope.

Direct-dependency priorities include:

- Next.js `16.1.1`: update to at least the patched `16.2.11` line after reviewing the current stable release (`16.2.12` at audit time).
- Better Auth `1.4.10`: update to at least `1.6.22`; select and record an exact reviewed release (`1.6.25` was latest at audit time; the earlier `1.6.23` candidate is already superseded — resolve at job-creation time per §4.2). The maintained `release-1.4` npm line (`1.4.22`) does **not** contain the fixes for either referenced advisory; there is no stay-on-1.4 remediation path.
- Review direct and transitive findings for Mongoose, Sharp, UUID, and other affected packages.

Advisory exposure is configuration-conditional. Phase 0a records every prerequisite per deployment, not just the installed version:

- GHSA-pw9m-5jxm-xr6h (critical, OAuth refresh-token replay) requires the legacy `oidc-provider` or `mcp` plugin **and** at least one confidential OAuth client; patched in `1.6.11`. The audit found no matching plugin import in the surveyed applications.
- GHSA-qq9h-g4jm-xgf3 (high, pre-account hijacking) requires magic-link or email-OTP sign-in, enabled email/password sign-up with open registration, and the ability for an unverified account to pre-exist the victim's passwordless sign-in; patched in `1.6.22`. The surveyed Better Auth configurations disable sign-up, including the three sites that enable email OTP.

These observations reduce demonstrated exploitability; they do not make `1.4.10` an acceptable production baseline. Used dependencies move to a reviewed patched release. An unused dependency is removed rather than upgraded: `vd-social-api` declares Better Auth but had no tracked-source Better Auth import at audit time, so its recipe must first prove removal is safe.

The surveyed applications use Better Auth's MongoDB adapter. Better Auth's MongoDB documentation states that schema generation and migration are not required. Do not run the SQL/Kysely migration workflow against these sites. The `1.4` → `1.6` recipe still requires old/new-slot session compatibility, persisted-document compatibility, sign-in/sign-out/password-reset regression tests, and verification that data written by the new slot does not break the old slot during overlap.

Security urgency does not lower technical risk. A Next.js minor or authentication-library minor remains a Tier 2 rollout with canaries, auth regression tests, and explicit approval.

Reference advisories:

- [Next.js July 2026 security update](https://nextjs.org/blog/july-2026-security-release)
- [Better Auth account hijacking advisory](https://github.com/advisories/GHSA-qq9h-g4jm-xgf3)
- [Better Auth OAuth refresh-token replay advisory](https://github.com/advisories/GHSA-pw9m-5jxm-xr6h)
- [Better Auth MongoDB adapter — schema generation and migration](https://better-auth.com/docs/adapters/mongo)

### 3.4 Secret and state hygiene

- `/var/lib/vd-platform/registry.json` currently contains a plaintext `themeEditor.jwtSecret`, is group-readable (`root:developers`, mode 664), and the secret is duplicated across ~90 `registry.json.bak.*` files in the same directory.
- Phase 0a remediation is an ordered runbook, not a blind file edit:
  1. inventory every producer and consumer of the theme-editor JWT;
  2. select a root-owned secret location and least-privilege file mode;
  3. deploy consumer support for the new secret, with a bounded dual-key window only if uninterrupted validation requires it;
  4. rotate the secret and verify new tokens while confirming the intended invalidation behavior for existing tokens/sessions;
  5. remove the old secret from active registry state, local backups, logs, and any external backup set that contains it;
  6. verify rollback does not restore the compromised value.
- Phase 0 policy: define a retention policy for installer registry backups so the sprawl does not recur.
- Fleet tooling (`fleet:status`, dashboard, evidence store, logs) does not read complete site `.env` files. A narrow privileged probe may report the presence or an opaque version/HMAC identifier of specifically allowlisted configuration keys without returning their values or a brute-forceable raw digest.
- Commands run by preparation and quality workers receive a sanitized allowlisted environment and no production credentials. Redaction is defense in depth, not the primary secret boundary.
- Secrets never enter the catalog, status cache, evidence, approval envelope, or job records.

## 4. Sources of truth

### 4.1 Versioned fleet catalog

Keep the fleet catalog in the Git-backed platform-control repository:

```text
fleet/
  repositories.json
  sites.json
  fleet-manifest.json
  schemas/
  recipes/
  codemods/
  sync-sources/
```

`repositories.json` contains durable source identities and source-policy data. `sites.json` contains deployment identities and references a repository by ID. The installer registry may be compared with these files to discover missing or retired deployments, but must not overwrite them.

Example repository entry:

```jsonc
{
  "repoId": "asap-source",
  "enabled": true,
  "repoPath": "/srv/apps/asap",
  "expectedRemotes": ["git@github.com:otsacademy/asap.git"],
  "sourceBranch": "develop",
  "qualityAdapter": "manifest-all",
  "cohorts": ["template-site", "plate-editor"]
}
```

Example deployment entry:

```jsonc
{
  "siteId": "asap-production",
  "enabled": true,
  "repoId": "asap-source",
  "releaseAdapter": "local-blue-green-v1",
  "environment": "production",
  "primaryDomain": "academicsstand.org"
}
```

Catalog validation must reject:

- duplicate repository IDs, deployment IDs, normalized domains, or unexplained active source paths;
- missing repositories, branches, manifests, or adapter definitions;
- source paths that resolve to deployment artifacts;
- overrides that do not intersect a declared template-owned path;
- unsupported commands or free-form shell fragments;
- duplicate deployment-to-repository mappings unless the repository explicitly allows multiple deployments;
- expected-remote, repository-root, or Git-object-format mismatches.

The catalog ID and expected remote are durable identity inputs. The resolved Git common-directory realpath is recorded at discovery time and used only for host-local locking and worktree deduplication. Re-cloning or restoring a repository must not create a new logical fleet identity.

Enabled catalog entries use typed adapter IDs, not arbitrary command arrays. A legacy repository that cannot use `manifest-all` receives a reviewed, versioned adapter in the control repository; the catalog cannot name an executable or supply free-form arguments.

### 4.2 Desired-state manifest

`fleet-manifest.json` defines:

- exact desired package versions or reviewed version policies;
- risk classification rules;
- typed recipe IDs and recipe versions;
- cohorts and required canaries;
- rollout-wave definitions, observation windows, pause thresholds, and required health signals;
- template-owned paths and ownership boundaries;
- upgrade-specific acceptance checks;
- approved release adapter types;
- audit exception records with owner, rationale, reachability, and expiry.

If an operator omits a package version, the planner resolves it before job creation. The job stores the exact version, registry URL, package integrity, recipe version, control-plane commit, Bun/toolchain version, and input lockfile digest. A worker never resolves `latest` during execution.

Lockfile generation and verification are separate steps:

1. Generate the reviewed dependency change in a network-restricted sandbox against the approved registry.
2. Reject unrelated direct-dependency changes and record the full direct/transitive lockfile delta.
3. Review any lifecycle scripts introduced or changed by the delta.
4. Run subsequent installation and quality verification with the generated lockfile frozen.

### 4.3 Local repository manifests

Each repository remains authoritative for its own gates and release process:

- Validate the quality manifest with `bun run quality:validate`.
- Run `bun run quality --all` when supported.
- Use an explicit catalog adapter for exceptional repositories.
- Do not encode quality target names in the installer registry.
- Do not relax a repository's gates from the fleet layer.

## 5. Execution architecture

### 5.1 Dedicated queue and explicit trust boundaries

Create a dedicated state tree:

```text
/var/lib/vd-platform/fleet/
  incoming/
  private/
    rollouts/
    approvals/
    audit/
    jobs/queued/
    jobs/running/
    jobs/done/
    jobs/cancelled/
  locks/
  evidence/
  status/
```

Use three separate trust domains:

1. **Preparation worker:** unprivileged and sandboxed; owns temporary worktrees; has no production environment, database credentials, systemd/nginx privilege, or write access to source branches.
2. **Integration service:** may perform guarded Git-ref integration for reviewed repository IDs; has no deployment privilege and cannot alter operator worktrees except through the explicit integration contract in §5.4.
3. **Release broker:** root-owned fixed code and root-owned adapter configuration; accepts only a deployment ID plus an approved, digest-bound release envelope. It performs the minimum validated systemd/nginx/filesystem operations and never executes repository-controlled JavaScript as root.

The existing root installer worker and its queue remain unchanged and isolated. Fleet state directories have explicit owners and modes: the admin process can submit only to `incoming`; it cannot rewrite private queued/running jobs, approvals, evidence, or status. Prefer a Unix-domain submission socket; if files are used, the worker atomically claims them into its private tree before validation and execution.

The admin server may enqueue a schema-validated typed request. It cannot submit a shell command, filesystem path, package name, version, codemod, service name, or release command outside an allowlisted recipe and adapter. The preparation worker, integration service, and release broker independently validate the request, catalog snapshot, control-plane commit, and current state before acting.

Required controls:

- UUID job IDs and atomic write-then-rename enqueue;
- JSON Schema validation and immutable rollout/job intent;
- per-Git-common-directory locking;
- separate per-deployment and shared-resource locks for release;
- idempotent preparation, bounded retries, process-group termination, and timeouts;
- cancellation and abandoned-job recovery with an `unknown` state when an external side effect cannot be proven;
- log and evidence size limits;
- CPU, memory, process, filesystem, and concurrency limits;
- systemd sandboxing (`NoNewPrivileges`, private temporary storage, protected system paths, restricted address families/capabilities as compatible with the task);
- a sanitized allowlisted environment and no inherited site `.env` values;
- reviewed registry origins, frozen verification installs, and explicit lifecycle-script policy;
- neutralized repository/global Git hooks for worker-created commits;
- RBAC via the existing installer-admin authorization;
- HTTPS, CSRF/origin validation, and step-up confirmation for production release;
- separate permissions for prepare, integrate, release, rollback, and exception approval;
- actor, approval envelope, audit trail retention, backup, and tamper-evident evidence digests.

### 5.2 Read-only discovery

`fleet:doctor` validates control-plane readiness, catalog integrity, repository and deployment identity, adapter versions, disk/inode headroom, Git refs, sandbox capability, service/unit allowlists, required health probes, and local quality contracts.

`fleet:runtime-inventory` starts from running systemd services and enabled nginx routes, resolves their working directories, reads actually installed package versions where possible, and maps each workload to a cataloged deployment and authoritative source SHA. It reports unmanaged, source-less, stale-slot, and version-unknown workloads. This runtime view is authoritative for Phase 0a completion.

Adapter validation reads each repository's documented release override (its `CLAUDE.md`/`AGENTS.md` site-overrides section) and the cataloged adapter, and flags disagreement between them. It never infers the release model from which scripts exist in `package.json` — template-copied scripts are common and unreliable (`velvetdinosaur` carries unused blue/green scripts; see §3.2).

`fleet:status` reads:

- desired and installed dependency versions;
- deployed/running dependency versions and runtime-to-source mapping;
- lockfile digests;
- repository source refs, deployment IDs, and release adapters;
- template-sync state and unexplained drift;
- last prepared, approved, released, and deployed commit;
- last gate result and evidence location;
- audit findings and unexpired exceptions;
- enrollment blockers.

Status may be cached for the dashboard, but cached state never authorizes an action. Every display labels source time, runtime-probe time, and whether the deployed commit/version is attested or merely inferred.

### 5.3 Prepare without mutating operator checkouts

For each selected repository/deployment:

1. Resolve the cataloged repository ID, expected remote, repository root, and local Git common directory.
2. Fetch or verify the exact source ref according to that repository's declared local/remote authority policy.
3. Record the original base SHA, tree SHA, source ref, catalog commit, manifest commit, and toolchain.
4. Create a sandbox-owned temporary worktree from that SHA under a fleet-owned root; reject unexpected submodules, LFS requirements, symlink escapes, or repository-path mismatches unless the adapter explicitly supports them.
5. Apply the typed recipe and versioned codemod with repository/global Git hooks disabled.
6. Generate the dependency/lockfile delta against the approved registry, review introduced lifecycle scripts and unrelated transitive movement, then verify with a frozen lockfile.
7. Run audit checks, recipe checks, and the repository's complete local quality contract in a sanitized environment without production credentials.
8. Run any stateful acceptance test only against an isolated fixture database/tenant/page and a disposable preview deployment; never edit production content during preparation.
9. Verify postconditions, dependency-delta policy, and codemod idempotency.
10. Commit the prepared result and create a namespaced durable ref such as `refs/vd-fleet/jobs/<job-id>/result` before removing the worktree.
11. Record the result SHA/tree SHA and digest all retained evidence.

A preparation failure leaves the source branch and operator checkout unchanged.

### 5.4 Integrate and release exact commits

Preparation, integration, and release are separate states.

Integration may fast-forward the cataloged source branch only when:

- the source branch still equals the recorded base SHA;
- the result is a descendant of the base and its SHA/tree/lockfile/evidence match the approval envelope;
- the designated integration worktree is explicitly fleet-managed, or an operator checkout is clean, at the expected branch/SHA, and an integration approval explicitly permits updating it;
- no other worktree has an incompatible checkout of the source branch;
- the repository lock remains held across the final preflight and atomic fast-forward operation;
- required, unexpired integration approval is present.

Otherwise the job becomes `ready-for-integration` or `stale`; it does not overwrite, reset, stash, switch, or merge an operator's work. A fleet lock coordinates fleet processes but cannot prevent a human from editing concurrently, so the integration command must perform a final clean/index/HEAD check immediately before a fast-forward and fail closed on any change.

When the source branch is checked out in an approved integration worktree, integration uses a worktree-aware fast-forward so the branch, index, and working tree advance together. It must not use a raw ref update that moves the branch behind an unchanged checked-out index/worktree.

Release uses the deployment's cataloged, versioned adapter and the exact approved result SHA. Immediately before release, the release broker revalidates the result and tree SHAs, evidence digests, approval expiry, source ref, deployment ID, adapter version, control-plane commit, service/unit allowlist, and required environment-key presence. It never releases "whatever is currently flagged," accepts a mutable branch as authority, or creates an unreviewed commit during deployment.

Every release adapter implements a typed contract:

- `preflight`: prove the approved commit is deployable and identify the current running revision;
- `stage`: build/install without changing public traffic or rebuilding a live slot;
- `activate`: switch or restart only the allowlisted deployment;
- `probe`: verify local and public health plus a runtime revision/version attestation;
- `observe`: evaluate configured health signals for the required window;
- `rollback`: restore the previous known-good revision without relying on a mutable branch;
- `reconcile`: after a worker/broker crash, determine whether activation happened and choose resume, rollback, or manual intervention.

Repository scripts may be invoked by an unprivileged adapter when they are part of the reviewed repository contract, but privileged operations stay in root-owned broker code. The broker delegates staging/build work back to the deployment user and retains only fixed activation/probe/rollback operations that require privilege. Dangerous bypass flags such as `--skip-quality`, arbitrary `--config`, or caller-supplied service names are not exposed through fleet jobs.

`velvetdinosaur` is both a fleet target and the host of the proposed admin UI. Its worker, catalog snapshot, approvals, and release broker must run independently of that UI deployment. Upgrade the controller site last in its cohort and prove queued work and reconciliation survive an admin-UI restart.

### 5.5 Job state and evidence

One immutable **rollout** snapshots selected deployments, cohort membership, recipes, desired versions, catalog/control-plane commits, canary dependencies, waves, health policy, and exception policy. Each deployment has one or more child **attempts**.

Recommended rollout states:

```text
draft → planned → preparing → canary-awaiting-approval
      → canary-releasing → observing → wave-awaiting-approval
      → wave-releasing → observing → succeeded
```

Rollout control states include `paused`, `aborting`, and `rollback-in-progress`. Terminal or exceptional rollout states are `succeeded`, `partially-succeeded`, `failed`, and `cancelled`.

Recommended child-attempt states:

```text
queued → planning → preparing → prepared → awaiting-integration-approval
       → integrating → ready-to-release → awaiting-release-approval
       → staging → activating → probing → observing → succeeded
```

Exceptional attempt states include `ready-for-integration`, `stale`, `failed`, `cancelled`, `rollback-pending`, `rolled-back`, `unknown`, and `manual-reconciliation`. A crash during `activating`, `probing`, or `rollback-pending` enters reconciliation; the system does not blindly retry the external action.

Every completed attempt records:

- actor and approver;
- rollout ID, deployment ID, repository ID, and resolved local Git common-directory lock key;
- original base/tree SHA, prepared result/tree SHA, integrated SHA, released SHA, prior running SHA, and runtime-attested SHA;
- resolved package versions, registry origins, and integrity;
- input and result lockfile digests plus direct/transitive dependency delta;
- control-plane/catalog/manifest commits and recipe/codemod/adapter versions;
- audit output and exception decisions;
- typed adapter operations and broker decisions;
- gate results, logs, and visual artifacts;
- health-probe results, observation window, rollback/reconciliation results, and deployed version evidence;
- timestamps and retry lineage.

An approval envelope contains and digests every field that can change the reviewed outcome: rollout/attempt/deployment/repository IDs, base and result tree SHAs, dependency and lockfile data, control-plane/catalog/manifest commits, recipe/codemod/adapter versions, evidence manifest, risk tier, allowed operation, approver, and expiry. Any mismatch or stale source ref invalidates the approval.

## 6. Rollout policy

| Tier | Examples | Policy |
|---|---|---|
| **1 — Mechanical** | Reviewed patch with no sensitive surface or migration; deterministic source rewrite | Prepare in isolation, run all gates, then cohort rollout under configured pause thresholds |
| **2 — Framework or sensitive** | Next.js, React major, Better Auth, Puck pre-1.0 minor, codemod, storage/serialization behavior | Required cohort canaries, upgrade-specific tests, human review, then bounded waves |
| **3 — Shared infrastructure** | MongoDB server, PostgreSQL server, nginx, certbot, Bun/Node runtime | Separate maintenance job and runbook; never a per-site dependency recipe |

Tier is computed from policy, semver, package sensitivity, and recipe metadata. A caller cannot downgrade it with a `--tier1` flag. Security severity controls urgency and deadlines, not rollout safeguards.

Failures are handled at two levels:

- Discovery and preparation continue for independent sites so one local defect does not hide the rest of the fleet.
- A required canary failure blocks its cohort. A release wave pauses when its configured failure or health threshold is reached.

Before approval, every Tier 2 rollout defines:

- the canary deployment for each materially different cohort;
- maximum concurrent releases and wave membership;
- local/public probes and expected runtime SHA/version;
- the minimum observation window and health-signal source;
- absolute and percentage pause thresholds;
- automatic versus operator-approved rollback conditions;
- the maximum age of preparation evidence and approval;
- the rule for handling a site that is healthy but cannot be runtime-attested.

Thresholds cannot be changed for an active rollout without creating a new reviewed rollout revision and invalidating existing approvals.

## 7. Delivery phases

Fleet-engine dates are estimated only after the corresponding readiness checks are green. Phase 0a receives calendar deadlines and named owners immediately because it remediates current production workloads.

### Phase 0a — Urgent security remediation (parallel track)

Runs in parallel with Phase 0 and must not wait on catalog creation or the fleet control-repository decision. The installed Better Auth versions fall within critical/high advisory ranges, although the current configuration scan did not reproduce all exploit prerequisites. The Next.js security findings apply across additional running workloads.

1. Produce the runtime-first inventory from every running systemd service and enabled nginx route (§3.2), recording deployment path, installed version, public exposure, source repository/SHA, owner, release/rollback runbook, and retirement decision.
2. Assign a calendar deadline and owner to every critical/high remediation item. Define the organization's maximum exception duration by severity before accepting an exception.
3. Remediate Next.js on every affected running workload, including the template-site candidates, `vd-email-studio`, `vd-social-api`, `booking-api`, the theme editor, Scholardemia, Scholmock, Thenewbrave, the Scholardemia space service, and legacy OTS where they remain active.
4. Upgrade used Better Auth installations to one reviewed exact release at or above `1.6.22`. For `vd-social-api`, prove the dependency is unused and remove it instead of carrying unnecessary authentication code.
5. Record all advisory prerequisites and compensating controls per deployment. Treat reachability as ordering evidence, not permission to retain an unsupported baseline indefinitely.
6. Run MongoDB-appropriate old/new-version compatibility and authentication regression checks (§3.3); do not run an inapplicable schema migration.
7. Create reviewed emergency release and rollback runbooks for active workloads that lack them. A non-Git runtime must first be captured in an authoritative recovery commit or receive an explicit retirement/containment decision.
8. Rotate the theme-editor JWT secret using the ordered consumer/rotation/verification runbook and remove the old value from installer state and backup sets (§3.4).
9. After every release, re-probe the running service and record the actually deployed Next.js/Better Auth version and source SHA where available.
10. Record a time-bounded exception with owner, business approver, advisory prerequisites, compensating controls, deadline, and expiry for anything not remediated immediately. Critical exceptions are reported as an unresolved risk, not a green result.

**Exit criteria:** every running/public workload is inventoried and source-mapped or explicitly contained/retired; no internet-facing workload runs Next.js below the vendor's reviewed patched line (currently `16.2.11` for supported 16.x and `15.5.21` for supported 15.x), and no used Better Auth installation runs below `1.6.22`, unless an unexpired approved exception with compensating controls exists; the Phase 0a remediation register distinguishes `remediated` from `exception-open` and the later dashboard preserves that distinction; installer state and retained backups contain no old plaintext theme-editor secret.

### Phase 0 — Establish authority, identity, and security stability

- Select or create the Git-backed platform-control repository that produces `/opt/vdplatform`.
- Record the deployed runtime's source commit and define a reproducible build/install path.
- Create and schema-validate separate repository and deployment catalogs.
- ~~Resolve `pyanal` versus `designer`.~~ Resolved 2026-08-21: pyanal retired (see table above); `vd_designer` is thebrave's database name, slated for rename in Phase 0 identity work.
- Correct `ots-sauro-poc` site metadata, quality paths, and branch/release contract.
- Decide whether Scholardemia is excluded or receives a dedicated monorepo adapter.
- Inventory all repository Git identities, source branches, quality manifests, deployments, runtime mappings, and release adapters.
- Implement `fleet:doctor`; require every enabled site to pass it.
- Implement `fleet:runtime-inventory` and require every running/public workload to be mapped, contained, or explicitly retired.
- Specify filesystem ownership/modes, preparation sandboxing, integration permissions, root-owned release-broker configuration, approval-envelope format, and audit/evidence retention before creating a mutating queue.
- Track Phase 0a (parallel security remediation); Phase 0 governance work must never block it.
- Define a retention policy for installer registry backups and prune the existing `registry.json.bak.*` sprawl (§3.4).
- Reconcile registry entries with running deployments (nginx, systemd) as part of resolving `pyanal` versus `designer` — delete phantom entries rather than cataloging them.
- Preserve the specialized `sync:agents` workflow until the replacement proves it can retain baseline content and site overrides.

**Exit criteria:** the control source is Git-backed and reproducible; repository and deployment identities are unique and correctly related; enabled adapters and manifests validate; no enabled deployment relies on unverified copied metadata to determine identity or release behavior; trust boundaries and ownership are documented and tested; every running workload is accounted for; critical/high findings are fixed or explicitly owned with short expiries and compensating controls.

### Phase 1 — Read-only status and dashboard

- Implement `fleet:status` and machine-readable output.
- Add `/admin/fleet` as a read-only view of source enrollment, running workloads, source-to-runtime mapping, dependency drift, code drift, audit state, release model, exceptions, and blockers.
- Show runtime-registry discrepancies without automatically importing or deleting entries.
- Add stale-cache labeling and link each status to its evidence timestamp.

**Exit criteria:** the dashboard accurately explains current React/Puck drift, distinguishes source state from attested running state, identifies unmanaged/disabled workloads and why, distinguishes remediation from open exceptions, and cannot mutate fleet state.

### Phase 2 — Isolated preparation engine

- Add the dedicated submission boundary, private queue, preparation sandbox, integration service, root-owned release broker, locks, schemas, recipes, and evidence store.
- Implement parent rollouts, per-deployment attempts, canary/wave dependencies, worktree-based preparation, safe integration, exact-SHA release, bounded retry, cancellation, reconciliation, observation, and rollback.
- Add digest-bound integration/release approvals and step-up authorization.
- Prove that failures and stale refs never change an operator checkout or release an unintended commit.
- Prove that a crash during activation enters reconciliation instead of replaying the release and that admin-UI restart does not disrupt the worker or lose approval/evidence state.
- Prove that preparation cannot read production `.env` values or exercise privileged systemd/nginx operations.

**Exit criteria:** a no-op recipe and a test mechanical change complete as a canary-plus-wave rollout across enabled test deployments with complete digest-bound evidence, runtime attestation, rollback/reconciliation rehearsal, and no unintended source-checkout mutation.

### Phase 3 — Dependency pilots

Pilot order:

1. Complete urgent Next.js and Better Auth rollout if it was not already completed in Phase 0a.
2. Run a low-risk React/React DOM alignment recipe as the mechanical engine pilot.
3. Update the canonical AGENTS/CLAUDE Puck package policy and safely propagate that narrow baseline change while preserving site overrides.
4. Run the Puck migration as a Tier 2, cohort-aware pilot described in §8.

Do not preserve a known-vulnerable dependency merely to make all sites uniform.

**Exit criteria:** exact desired versions and lockfile digests are recorded; all local and recipe-specific gates pass; required canaries are approved; released deployments runtime-attest the reviewed SHA/version; rollback has been exercised.

### Phase 4 — Template ownership and 3-way sync

- Inventory copied files and classify each as template-owned, site-owned, or intentionally overridden.
- Validate every override against an owned path.
- Store immutable source commit and blob IDs in `.vd/sync-state.json`.
- Retain source blobs so the previous base is retrievable.
- On first adoption, require an explicit decision: adopt source, preserve override, or make site-owned.
- Implement real base/source/site 3-way merges; never reconstruct a base from hashes alone.
- Continue `sync:agents` in parallel until parity and override preservation are demonstrated.

`components/blocks/store/**` remains site-owned for template sync, but dependency codemods must still update imports within it.

**Exit criteria:** there is no unexplained owned-file drift; first-adoption decisions are recorded; a test source change merges cleanly where expected and produces explicit conflicts elsewhere without overwriting.

### Phase 5 — Shared-package extraction

Before extracting code, select a distribution model:

- private package registry, or
- immutable Git dependencies with a documented availability and rollback policy.

Do not describe unrelated `/srv/apps` repositories as a Bun workspace without an actual umbrella workspace. Extract one stable boundary at a time—theme utilities before editor shell—and treat operations scripts separately because they participate in bootstrapping and release.

Fleet orchestration still performs a reviewed version bump per site; package extraction reduces copied implementation, not the need for per-site evidence.

**Exit criteria:** packages are reproducible, immutable, accessible during local release, and independently rollbackable; consuming repositories retain green local gates.

### Phase 6 — Shared-infrastructure maintenance

Create separate maintenance recipes and runbooks for MongoDB, PostgreSQL where applicable, nginx, certbot, and JavaScript runtimes.

A database-server runbook includes compatibility review, backup and restore rehearsal, maintenance window, health checks for every dependent service, and rollback criteria. Scholardemia's PostgreSQL authority must not be represented as a MongoDB-only dependency.

## 8. Puck migration recipe

Target: `@measured/puck` `0.20.2` → reviewed exact `@puckeditor/core` release, currently `0.22.3`.

Official 0.21 and 0.22 migration guides report no breaking API changes, so a stored Puck `Data` migration is not currently expected. That conclusion must still be proven with representative stored content and editor behavior; "no breaking API changes" is not equivalent to "no product-level changes."

Relevant behavior changes include:

- the plugin rail and full-width editor viewport;
- changed editor styling and dynamic CSS loading;
- a new `move` trigger and parent/root inputs for relevant `resolveData` paths, plus parent input for `resolvePermissions`;
- expanded/default viewport behavior.

References:

- [Puck 0.21 migration guide](https://puckeditor.com/blog/upgrading-to-puck-021)
- [Puck 0.22 migration guide](https://puckeditor.com/blog/upgrading-to-puck-022)

### Codemod scope

The codemod must cover:

- dependency declarations and lockfiles;
- root imports from `@measured/puck`;
- `/rsc` imports;
- `/no-external.css` imports;
- test mocks and fixtures;
- generator/source strings such as component-store generators;
- every editor entry point, including specialized editors;
- imports inside site-owned blocks.

A 2026-07-28 raw `git grep` re-count over all tracked files demonstrated why documentation-inclusive counts are not an acceptance contract: at the following exact HEADs it found **697** `@measured/puck` occurrences and 15 `no-external.css` lines, including six package-name occurrences and two CSS-name occurrences introduced by this plan itself.

| Repository | Audited HEAD | Raw package-name occurrences |
|---|---|---:|
| `velvetdinosaur` | `0a8698de228f` | 134 |
| `asap` | `0086cbe13735` | 138 |
| `ra` | `91b0f5979f96` | 51 |
| `pyanal` | `4d35e1cc36ef` | 84 |
| `thebrave` | `c6f6a1b89446` | 135 |
| `ots-sauro-poc` | `37383f30e9f4` | 155 |

The planner generates a fresh baseline at job creation from the exact source SHA. Migration postconditions search only dependency-bearing and executable scopes: package manifests, `app/`, `components/`, `hooks/`, `lib/`, `models/`, `puck/`, `quality/`, `registry/`, `scripts/`, `tests/`, and relevant root source/config files. Documentation and historical evidence are excluded from the zero-reference code postcondition, while normative policy files are checked separately for the approved package-name policy. Lockfile entries are validated through the recorded dependency delta and lockfile digest, and generated templates are checked in build output.

Postconditions:

- zero remaining `@measured/puck` references in the declared code/config/generator scopes and relevant generated templates;
- expected `@puckeditor/core` entry points only;
- canonical AGENTS/CLAUDE policy names the approved package and site overrides remain intact;
- a second codemod run produces no diff;
- build output contains required editor styles;
- package and lockfile agree on the exact version.

### Product decisions

The recipe declares, rather than silently choosing:

- plugin rail enabled or legacy sidebar;
- explicit viewports and breakpoints;
- bundled explicit CSS versus runtime injection;
- any required styling compatibility layer and migration from unsupported internal palette overrides.

These decisions are reviewed once per cohort and stored in recipe configuration. Explicit CSS bundling is the default for the Next.js cohorts to avoid a flash of unstyled editor UI; runtime injection requires affirmative visual/performance acceptance.

### Acceptance and canaries

State-changing editor acceptance runs only against a disposable preview deployment with a synthetic or snapshotted fixture page/database and a dedicated test identity. It never edits production content. In addition to each repository's full quality manifest:

- authenticate and open `/edit`;
- load representative existing Puck data;
- select, edit, add, move, and delete blocks;
- save and reload;
- render the same data through public/preview routes;
- exercise `resolveData` and `resolvePermissions` paths where used;
- capture approved mobile and desktop editor snapshots;
- verify specialized flows such as The Brave's video editor.

Do not automatically run `visual:update`. Capture diffs as evidence and update a baseline only after an explicit decision that the change is intended.

After production activation, run non-mutating authentication, editor-load, public-render, health, and runtime-SHA/version probes. A state-changing production smoke test requires a separately approved disposable production fixture and cleanup proof.

Use at least one canary per materially different cohort:

- the reference/template implementation;
- the low-stakes `pyanal`/`designer` site after identity resolution;
- ASAP for Plate/editor divergence;
- The Brave for its specialized editor.

A failure blocks that cohort's rollout.

## 9. Guardrails

- Operate only on enabled catalog entries and resolved Git repository identities.
- Treat running-workload security inventory as broader than fleet enrollment; exclusion from the fleet never suppresses a vulnerability finding.
- Never target live slots, release copies, or paths selected only by name pattern.
- Never rebuild a live slot in place unless a repository's explicit, reviewed adapter requires an in-place model.
- Never assume `develop`, `main`, blue/green, or `release:local`; use the cataloged adapter.
- Never modify an operator checkout to prepare a fleet change.
- Never reset, stash, switch, or force-update an operator checkout during integration.
- Never promote, push, or deploy by default.
- Never release a mutable branch name without binding it to the approved commit SHA.
- Never accept raw commands from the dashboard.
- Never reuse the installer queue or run fleet mutations in a Next.js request.
- Never execute dependency, repository, codemod, quality, or build code with root privilege.
- Never allow a repository commit or job request to choose a privileged service name, nginx path, system path, or sudo argument.
- Never expose production secrets to preparation or quality jobs; do not depend on redaction to make a privileged environment safe.
- Never persist, display, or copy secret material (registry secrets, site `.env` contents) into the catalog, status cache, evidence, or logs.
- Never mutate production content during upgrade acceptance without an explicitly approved disposable fixture and cleanup proof.
- Never retry an ambiguous activation or rollback until adapter reconciliation establishes the external state.
- Never blind-overwrite template files or automatically bless visual diffs.
- Keep schema and serialized-content changes backward-compatible across any overlapping production versions.
- Treat rollback as a tested adapter capability, not a narrative step.
- Require runtime revision/version attestation or an explicit unresolved-attestation blocker after every release.

## 10. Definition of done

The system is ready when:

1. A Git commit is the authoritative source for catalog, policy, recipes, codemods, and template bases.
2. Every enabled repository and deployment has a distinct durable identity, valid relationship, valid adapter, validated quality manifest, documented cohort, and mapped running workload.
3. Every running/public workload is inventoried even when it is not a fleet member, and source-less workloads are contained, retired, or assigned an owned recovery/remediation plan.
4. The dashboard provides fresh, explainable read-only source and runtime status before any action is enabled.
5. Typed rollouts and child attempts run through a sandboxed preparation worker, guarded integration service, and root-owned release broker with locks, reconciliation, audit trail, and immutable intent.
6. Approvals are digest-bound to result/evidence/configuration and expire or invalidate on any material change.
7. Preparation happens in isolated worktrees without production secrets and cannot damage operator checkouts.
8. Every result is traceable from original SHA through reviewed SHA to integrated, released, and runtime-attested SHA.
9. Local repository gates and recipe-specific tests are green with retained, digest-verified evidence.
10. Canary and release-wave failures or health thresholds pause the relevant rollout.
11. Every adapter proves stage, activate, probe, observe, rollback, and crash reconciliation behavior.
12. Template sync has retrievable bases and records intentional ownership decisions.
13. Security findings are fixed or represented by owned, expiring exceptions with prerequisites and compensating controls; remediated and exception-open states are not conflated.
14. Rollback is rehearsed for each release adapter and shared-infrastructure runbook.
15. Installer and fleet state contain no plaintext secrets, and every fleet output surface (status, evidence, logs, dashboard) is redaction-safe.
16. The controller site's own upgrade cannot take down or alter the independent worker, approval store, evidence, or release broker.

## 11. Decisions required before implementation

1. Which Git repository is authoritative for `/opt/vdplatform`, and will it live at `/srv/apps/vdplatform-control`?
2. What authoritative source, owner, release runbook, and retirement decision applies to each source-less or legacy running workload: `booking-api`, the theme editor, Scholmock, Thenewbrave, the Scholardemia space service, and legacy OTS?
3. What calendar remediation deadline and maximum exception lifetime apply to critical and high findings, and who is the business approver for an exception?
4. Which exact reviewed Next.js and Better Auth releases will Phase 0a use, and where will their package artifacts/integrities be retained for reproducible emergency releases?
5. Which of the `pyanal`/`designer` registry entries corresponds to a running deployment? The registry lists both with distinct ports and domains, while only `vd-pyanal-green.service` runs and only `designer.velvetdinosaur.com` is served — resolution may mean deleting a phantom entry rather than choosing between names. What is the canonical repository ID, deployment ID, domain, and database mapping?
6. Will `ots-sauro-poc` adopt a `develop` flow or receive a `main`-only adapter after its copied metadata is corrected?
7. Is Scholardemia outside fleet orchestration, or should a dedicated monorepo/worktree/PostgreSQL adapter be funded? Its running web deployment remains in Phase 0a either way.
8. Which OS identities, filesystem modes, sandbox controls, and root-owned broker operations form the preparation/integration/release trust boundary? Which service/unit names are in the broker allowlist?
9. What step-up authentication, separation-of-duties rule, approval expiry, and approver role are required for integration, production release, rollback, and vulnerability exceptions?
10. Which health systems, runtime-attestation mechanism, observation windows, pause thresholds, and automatic rollback rules apply per adapter/cohort?
11. Where will the rotated theme-editor JWT secret live, which consumers require a dual-key window, and how will local/external backups containing the old value be identified and sanitized?
12. Which shared-package distribution channel will be available during local, offline-capable releases?
13. May one repository intentionally feed multiple deployments, and what independent release/resource locks are required when it does?
14. What backup, retention, and tamper-evidence policy applies to rollout state, approvals, logs, and visual evidence?
