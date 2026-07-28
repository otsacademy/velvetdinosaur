# VD Fleet Upgrade System — Revised Plan

**Status:** Revised draft; implementation is blocked on Phase 0 readiness and security stabilization

**Date:** 2026-07-28

**Last revised:** 2026-07-28 (rev 2 — verification audit: every §2 conclusion re-tested against the live machine, the npm registry, and GitHub advisory data; all reproduced. Revision adds non-enrolled-repository security scope, secret hygiene, per-site advisory scoping, and a parallel remediation track.)

**Scope:** Repositories under `/srv/apps` that are explicitly enrolled in the Velvet Dinosaur fleet

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

## 3. Verified current state

### 3.1 Control and state locations

| Concern | Current location | Revised role |
|---|---|---|
| Apparent template and installer runtime | `/opt/vdplatform` | Deployed runtime only; must be reproducible from a Git commit |
| Deployed Velvet Dinosaur site | `/srv/apps/velvetdinosaur` | A fleet member with a `main`-only/manual release adapter |
| Installer runtime registry | `/var/lib/vd-platform/registry.json` | Installer projection and discovery input; not fleet source of truth |
| Installer jobs | `/opt/vdplatform/installer/jobs` | Installer-only; never used for fleet work |
| Proposed fleet runtime state | `/var/lib/vd-platform/fleet` | Dedicated jobs, locks, evidence, status cache, and logs |
| Proposed fleet source | Git-backed platform-control repository | Versioned catalog, policies, recipes, codemods, and sync sources |

The Phase 0 recommendation is a dedicated Git-backed platform-control checkout, provisionally `/srv/apps/vdplatform-control`, or restoration of the repository that produces `/opt/vdplatform`. The exact repository and path are an explicit decision; the runtime tree must not become an unversioned source of truth.

### 3.2 Repository readiness

| Repository identity | Observed model | Enrollment disposition |
|---|---|---|
| `velvetdinosaur` | `main`-only; manual/in-place release override | Enroll with its own adapter; never assume blue/green |
| `asap` | `develop` source; Plate editorial divergence; checkout dirty at audit | Enroll after cataloging divergence; prepare in an isolated worktree |
| `ra` | Feature checkout with `develop`/`main`; checkout dirty at audit | Enroll after release adapter verification |
| `pyanal` / `designer` | Registry lists **both** as separate sites with distinct ports and domains; nginx serves only `designer.velvetdinosaur.com`; systemd runs only `vd-pyanal-green.service`; one repository exists | Disabled until registry entries are reconciled with running deployments — this may be a phantom registry entry to delete, not a naming choice |
| `thebrave` | Feature checkout; `develop` is checked out in `/srv/apps/thebrave-release` | Enroll by Git repository identity, not directory suffix |
| `ots-sauro-poc` | `main`-only; dirty; copied ASAP metadata and quality target paths | Disabled until metadata, gates, and release adapter are corrected |
| `scholardemia` | Separate monorepo and worktree flow; PostgreSQL is authoritative; no root fleet-compatible scripts | Separate cohort; disabled until a dedicated adapter exists |

At the time of audit, no surveyed checkout satisfied the original "clean and on `develop`" preflight. This is not solved by skipping every site. Preparation must use temporary Git worktrees created from exact source refs and must leave operator checkouts untouched.

Fleet identity is keyed by Git common directory plus a catalog ID. Directory names such as `-release`, `-blue`, or `-green` are hints only and are never sufficient to decide whether a checkout is a source or artifact.

`velvetdinosaur` itself demonstrates copied-metadata drift: the repository carries template `deploy:blue-green` scripts and `deploy/local-first.json` although its documented contract is manual/in-place (`deploy:manual` / `deploy:safe`). Release adapters must therefore be verified against each repository's documented override, never inferred from which scripts happen to exist in `package.json`.

#### Surveyed and not enrolled

Absence from the fleet is a recorded decision, not an oversight. Every repository under `/srv/apps` falls into exactly one table; new arrivals must be surveyed into one of them.

| Repository | Observation (2026-07-28) | Disposition |
|---|---|---|
| `vd-email-studio` | `main`, clean; shares the vulnerable baseline (`better-auth 1.4.10`, `next 16.1.1`) | Outside fleet orchestration; **inside** Phase 0a security-remediation scope |
| `vd-social-api` | `main`, clean; shares the vulnerable baseline | Outside fleet orchestration; **inside** Phase 0a security-remediation scope |
| `claude-squad` | `main`; unrelated tooling; no template dependency baseline | Excluded |
| Non-Git directories (`asap-staging`, `booking-api`, `scholmock`, `scholardemia-*`, `ots-sauro-poc-{blue,green,current}`, `sites`, `worktrees`, `logs`) | Deployment artifacts, staging copies, backups, or non-repo data | Never fleet members (per non-goals) |

### 3.3 Security baseline

A 2026-07-28 `bun audit --json` snapshot against `/opt/vdplatform/template` reported 155 advisories across 32 packages: 3 critical, 74 high, 64 moderate, and 14 low. An independent re-run during the verification audit reproduced these counts exactly. Counts are a point-in-time diagnostic, not a permanent acceptance threshold.

All six enrolled-candidate sites and the template are uniformly on `next 16.1.1`, `better-auth 1.4.10`, and `@measured/puck 0.20.2`. The non-enrolled `vd-email-studio` and `vd-social-api` share the `next`/`better-auth` baseline (§3.2) and are in remediation scope.

Direct-dependency priorities include:

- Next.js `16.1.1`: update to at least the patched `16.2.11` line after reviewing the current stable release (`16.2.12` at audit time).
- Better Auth `1.4.10`: update to at least `1.6.22`; select and record an exact reviewed release (`1.6.25` was latest at audit time; the earlier `1.6.23` candidate is already superseded — resolve at job-creation time per §4.2). The maintained `release-1.4` npm line (`1.4.22`) does **not** contain the fixes for either referenced advisory; there is no stay-on-1.4 remediation path.
- Review direct and transitive findings for Mongoose, Sharp, UUID, and other affected packages.

Advisory exposure is plugin- and flow-conditional; Phase 0a triage records, per site, which Better Auth plugins and sign-in flows are actually enabled:

- GHSA-pw9m-5jxm-xr6h (critical, OAuth refresh-token replay) affects only the `oidc-provider` and `mcp` plugins; patched in `1.6.11`.
- GHSA-qq9h-g4jm-xgf3 (high, pre-account hijacking) affects magic-link and email-OTP sign-in flows; patched in `1.6.22`.

Scoping controls urgency and ordering, not whether a site upgrades — every site still moves to a patched release.

The Better Auth `1.4` → `1.6` jump can involve auth schema changes (Better Auth ships a migration CLI). Because blue and green slots may overlap during cutover, the recipe must include a named acceptance check that old-slot code tolerates the migrated auth collections — this is upgrade-specific, beyond the generic backward-compatibility guardrail in §9.

Security urgency does not lower technical risk. A Next.js minor or authentication-library minor remains a Tier 2 rollout with canaries, auth regression tests, and explicit approval.

Reference advisories:

- [Next.js July 2026 security update](https://nextjs.org/blog/july-2026-security-release)
- [Better Auth account hijacking advisory](https://github.com/advisories/GHSA-qq9h-g4jm-xgf3)
- [Better Auth OAuth refresh-token replay advisory](https://github.com/advisories/GHSA-pw9m-5jxm-xr6h)

### 3.4 Secret and state hygiene

- `/var/lib/vd-platform/registry.json` currently contains a plaintext `themeEditor.jwtSecret`, is group-readable (`root:developers`, mode 664), and the secret is duplicated across ~90 `registry.json.bak.*` files in the same directory.
- Phase 0a remediation: rotate the theme-editor JWT secret, move it out of the registry into environment/secret storage, and prune the backup sprawl.
- Phase 0 policy: define a retention policy for installer registry backups so the sprawl does not recur.
- Fleet tooling (`fleet:status`, dashboard, evidence store, logs) must redact secret material when reading the registry or site `.env` files. Secrets never enter the catalog, status cache, evidence, or job records.

## 4. Sources of truth

### 4.1 Versioned fleet catalog

Keep the fleet catalog in the Git-backed platform-control repository:

```text
fleet/
  sites.json
  fleet-manifest.json
  schemas/
  recipes/
  codemods/
  sync-sources/
```

`sites.json` contains only reviewed enrollment data. The installer registry may be compared with it to discover missing or retired sites, but must not overwrite it.

Example entry:

```jsonc
{
  "id": "asap",
  "enabled": true,
  "repoPath": "/srv/apps/asap",
  "sourceBranch": "develop",
  "releaseAdapter": "local-blue-green",
  "qualityCommand": ["bun", "run", "quality", "--all"],
  "cohorts": ["template-site", "plate-editor"],
  "primaryDomain": "academicsstand.org"
}
```

Catalog validation must reject:

- duplicate IDs, domains, repository identities, or active source paths;
- missing repositories, branches, manifests, or adapter definitions;
- source paths that resolve to deployment artifacts;
- overrides that do not intersect a declared template-owned path;
- unsupported commands or free-form shell fragments.

### 4.2 Desired-state manifest

`fleet-manifest.json` defines:

- exact desired package versions or reviewed version policies;
- risk classification rules;
- typed recipe IDs and recipe versions;
- cohorts and required canaries;
- template-owned paths and ownership boundaries;
- upgrade-specific acceptance checks;
- approved release adapter types;
- audit exception records with owner, rationale, reachability, and expiry.

If an operator omits a package version, the planner resolves it before job creation. The job stores the exact version, package integrity, recipe version, and lockfile digest. A worker never resolves `latest` during execution.

### 4.3 Local repository manifests

Each repository remains authoritative for its own gates and release process:

- Validate the quality manifest with `bun run quality:validate`.
- Run `bun run quality --all` when supported.
- Use an explicit catalog adapter for exceptional repositories.
- Do not encode quality target names in the installer registry.
- Do not relax a repository's gates from the fleet layer.

## 5. Execution architecture

### 5.1 Dedicated queue and least-privilege worker

Create a dedicated state tree:

```text
/var/lib/vd-platform/fleet/
  jobs/queued/
  jobs/running/
  jobs/done/
  jobs/cancelled/
  locks/
  evidence/
  status/
```

Run a dedicated fleet worker as an unprivileged deploy user. Grant narrowly scoped privilege only for an adapter step that demonstrably requires it. The existing root installer worker and its queue remain unchanged and isolated.

The admin server may atomically enqueue a schema-validated typed request. It cannot submit a shell command, filesystem path, package name, version, codemod, or release command outside an allowlisted recipe. The worker independently validates the request and current catalog before acting.

Required controls:

- UUID job IDs and atomic write-then-rename enqueue;
- JSON Schema validation and immutable job intent;
- per-Git-common-directory locking;
- idempotent preparation and safe retry;
- cancellation and abandoned-job recovery;
- log and evidence size limits;
- RBAC via the existing installer-admin authorization;
- HTTPS, CSRF/origin validation, and step-up confirmation for production release;
- actor, approval timestamp, and audit trail retention.

### 5.2 Read-only discovery

`fleet:doctor` validates control-plane readiness, catalog integrity, repository identity, adapters, disk space, Git refs, and local commands.

Adapter validation reads each repository's documented release override (its `CLAUDE.md`/`AGENTS.md` site-overrides section) and the cataloged adapter, and flags disagreement between them. It never infers the release model from which scripts exist in `package.json` — template-copied scripts are common and unreliable (`velvetdinosaur` carries unused blue/green scripts; see §3.2).

`fleet:status` reads:

- desired and installed dependency versions;
- lockfile digests;
- repository source refs and release adapter;
- template-sync state and unexplained drift;
- last prepared, approved, released, and deployed commit;
- last gate result and evidence location;
- audit findings and unexpired exceptions;
- enrollment blockers.

Status may be cached for the dashboard, but cached state never authorizes an action.

### 5.3 Prepare without mutating operator checkouts

For each selected site:

1. Resolve the cataloged repository by Git common directory.
2. Fetch or verify the exact local source ref according to policy.
3. Record the original base SHA.
4. Create an isolated temporary worktree from that SHA.
5. Apply the typed recipe and versioned codemod.
6. Run `bun install`, audit checks, recipe checks, and the repository's complete local quality contract.
7. Verify postconditions and codemod idempotency.
8. Commit the prepared result and record its result SHA.
9. Preserve evidence and remove the temporary worktree only after its commit is safely referenced.

A preparation failure leaves the source branch and operator checkout unchanged.

### 5.4 Integrate and release exact commits

Preparation, integration, and release are separate states.

Integration may fast-forward the cataloged source branch only when:

- the source branch still equals the recorded base SHA;
- the designated integration worktree is safe and clean;
- the result contains the exact reviewed commit and lockfile;
- required approval is present.

Otherwise the job becomes `ready-for-integration` or `stale`; it does not overwrite or merge an operator's work.

Release uses the repository's cataloged adapter and the exact approved result SHA. Immediately before release, the worker revalidates the SHA, evidence, approval, source ref, and adapter contract. It never releases "whatever is currently flagged" or creates an unreviewed commit during deployment.

### 5.5 Job state and evidence

Recommended states:

```text
queued → planning → preparing → prepared → awaiting-approval
       → integrating → ready-to-release → releasing → succeeded
```

Terminal or exceptional states are `failed`, `cancelled`, and `stale`.

Every completed attempt records:

- actor and approver;
- site/catalog ID and Git common-directory identity;
- original base SHA, prepared result SHA, and released SHA;
- resolved package versions and integrity;
- lockfile digest;
- recipe and codemod versions;
- audit output and exception decisions;
- commands selected by the adapter;
- gate results, logs, and visual artifacts;
- timestamps and retry lineage.

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

## 7. Delivery phases

Dates are estimated only after the corresponding readiness checks are green.

### Phase 0a — Urgent security remediation (parallel track)

Runs in parallel with Phase 0 and must not wait on identity resolution, catalog creation, or the control-repository decision. Internet-facing sites carry a critical authentication advisory today.

- Triage the dependency audit; record per-site Better Auth plugin and sign-in-flow exposure (§3.3).
- Remediate the Next.js and Better Auth findings on every affected repository — including the non-enrolled `vd-email-studio` and `vd-social-api` — using each repository's existing documented release workflow.
- Run the Better Auth schema-migration compatibility check (§3.3) before each release where slots may overlap.
- Record a time-bounded exception, with owner and expiry, for anything not remediated immediately.
- Rotate the theme-editor JWT secret and remove secret material from installer state (§3.4).

**Exit criteria:** no internet-facing site runs Better Auth older than `1.6.22` or an unpatched Next.js `16.1.x` — or an owned, short-expiry exception exists; installer state stores no plaintext secrets.

### Phase 0 — Establish authority, identity, and security stability

- Select or create the Git-backed platform-control repository that produces `/opt/vdplatform`.
- Record the deployed runtime's source commit and define a reproducible build/install path.
- Create and schema-validate the fleet catalog.
- Resolve `pyanal` versus `designer`.
- Correct `ots-sauro-poc` site metadata, quality paths, and branch/release contract.
- Decide whether Scholardemia is excluded or receives a dedicated monorepo adapter.
- Inventory all repository Git identities, source branches, quality manifests, and release adapters.
- Implement `fleet:doctor`; require every enabled site to pass it.
- Track Phase 0a (parallel security remediation); Phase 0 governance work must never block it.
- Define a retention policy for installer registry backups and prune the existing `registry.json.bak.*` sprawl (§3.4).
- Reconcile registry entries with running deployments (nginx, systemd) as part of resolving `pyanal` versus `designer` — delete phantom entries rather than cataloging them.
- Preserve the specialized `sync:agents` workflow until the replacement proves it can retain baseline content and site overrides.

**Exit criteria:** the control source is Git-backed and reproducible; identities are unique; enabled adapters and manifests validate; no enabled site depends on copied metadata; critical/high direct-dependency findings are fixed or explicitly owned with short expiries.

### Phase 1 — Read-only status and dashboard

- Implement `fleet:status` and machine-readable output.
- Add `/admin/fleet` as a read-only view of enrollment, dependency drift, code drift, audit state, release model, and blockers.
- Show runtime-registry discrepancies without automatically importing or deleting entries.
- Add stale-cache labeling and link each status to its evidence timestamp.

**Exit criteria:** the dashboard accurately explains current React/Puck drift, identifies disabled repositories and why, and cannot mutate fleet state.

### Phase 2 — Isolated preparation engine

- Add the dedicated queue, worker, locks, schemas, recipes, and evidence store.
- Implement worktree-based preparation, safe integration, exact-SHA release, retry, cancellation, and recovery.
- Add approval and step-up authorization for release.
- Prove that failures and stale refs never change an operator checkout or release an unintended commit.

**Exit criteria:** a no-op recipe and a test mechanical change complete across enabled test sites with complete evidence and no source-checkout mutation.

### Phase 3 — Dependency pilots

Pilot order:

1. Complete urgent Next.js and Better Auth rollout if it was not already completed in Phase 0a.
2. Run a low-risk React/React DOM alignment recipe as the mechanical engine pilot.
3. Run the Puck migration as a Tier 2, cohort-aware pilot described in §8.

Do not preserve a known-vulnerable dependency merely to make all sites uniform.

**Exit criteria:** exact desired versions and lockfile digests are recorded; all local and recipe-specific gates pass; required canaries are approved; released sites run the reviewed SHA; rollback has been exercised.

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
- new execution triggers for `resolveData` and `resolvePermissions`;
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

A 2026-07-28 re-count found **691** `@measured/puck` occurrences in Git-tracked files across the six stamped checkouts (velvetdinosaur 128, asap 138, ra 51, pyanal 84, thebrave 135, ots-sauro-poc 155) plus 13 lines referencing `no-external.css`, so this is not a 20–50-use-per-app rename. (An earlier estimate of ~629 used an unstated method; counts without a stated contract drift and are unfalsifiable.)

Counting contract: postconditions are measured with `git grep -o '@measured/puck'` over tracked files at the prepared SHA. Lockfile entries are validated separately through the lockfile digest, and generated templates are checked in build output.

Postconditions:

- zero remaining `@measured/puck` references in tracked source and relevant generated templates, per the counting contract above;
- expected `@puckeditor/core` entry points only;
- a second codemod run produces no diff;
- build output contains required editor styles;
- package and lockfile agree on the exact version.

### Product decisions

The recipe declares, rather than silently choosing:

- plugin rail enabled or legacy sidebar;
- explicit viewports and breakpoints;
- any required styling compatibility layer.

These decisions are reviewed once per cohort and stored in recipe configuration.

### Acceptance and canaries

In addition to each repository's full quality manifest:

- authenticate and open `/edit`;
- load representative existing Puck data;
- select, edit, add, move, and delete blocks;
- save and reload;
- render the same data through public/preview routes;
- exercise `resolveData` and `resolvePermissions` paths where used;
- capture approved mobile and desktop editor snapshots;
- verify specialized flows such as The Brave's video editor.

Do not automatically run `visual:update`. Capture diffs as evidence and update a baseline only after an explicit decision that the change is intended.

Use at least one canary per materially different cohort:

- the reference/template implementation;
- the low-stakes `pyanal`/`designer` site after identity resolution;
- ASAP for Plate/editor divergence;
- The Brave for its specialized editor.

A failure blocks that cohort's rollout.

## 9. Guardrails

- Operate only on enabled catalog entries and resolved Git repository identities.
- Never target live slots, release copies, or paths selected only by name pattern.
- Never rebuild a live slot in place unless a repository's explicit, reviewed adapter requires an in-place model.
- Never assume `develop`, `main`, blue/green, or `release:local`; use the cataloged adapter.
- Never modify an operator checkout to prepare a fleet change.
- Never promote, push, or deploy by default.
- Never release a mutable branch name without binding it to the approved commit SHA.
- Never accept raw commands from the dashboard.
- Never reuse the installer queue or run fleet mutations in a Next.js request.
- Never persist, display, or copy secret material (registry secrets, site `.env` contents) into the catalog, status cache, evidence, or logs.
- Never blind-overwrite template files or automatically bless visual diffs.
- Keep schema and serialized-content changes backward-compatible across any overlapping production versions.
- Treat rollback as a tested adapter capability, not a narrative step.

## 10. Definition of done

The system is ready when:

1. A Git commit is the authoritative source for catalog, policy, recipes, codemods, and template bases.
2. Every enabled site has a unique identity, valid adapter, validated quality manifest, and documented cohort.
3. The dashboard provides fresh, explainable read-only status before any action is enabled.
4. Typed jobs run in a dedicated least-privilege worker with locks, recovery, audit trail, and immutable intent.
5. Preparation happens in isolated worktrees and cannot damage operator checkouts.
6. Every result is traceable from original SHA through reviewed SHA to released SHA.
7. Local repository gates and recipe-specific tests are green with retained evidence.
8. Canary and release-wave failures pause the relevant rollout.
9. Template sync has retrievable bases and records intentional ownership decisions.
10. Security findings are fixed or represented by owned, expiring exceptions.
11. Rollback is rehearsed for each release adapter and shared-infrastructure runbook.
12. Installer and fleet state contain no plaintext secrets, and every fleet output surface (status, evidence, logs, dashboard) is redaction-safe.

## 11. Decisions required before implementation

1. Which Git repository is authoritative for `/opt/vdplatform`, and will it live at `/srv/apps/vdplatform-control`?
2. Which of the `pyanal`/`designer` registry entries corresponds to a running deployment? The registry lists both with distinct ports and domains, while only `vd-pyanal-green.service` runs and only `designer.velvetdinosaur.com` is served — resolution may mean deleting a phantom entry rather than choosing between names. What is the canonical fleet identity, domain, and database mapping?
3. Will `ots-sauro-poc` adopt a `develop` flow or receive a `main`-only adapter after its copied metadata is corrected?
4. Is Scholardemia outside the fleet, or should a dedicated monorepo/worktree/PostgreSQL adapter be funded?
5. Which shared-package distribution channel will be available during local, offline-capable releases?
6. What step-up authentication mechanism and approver role are required for production release?
7. Who owns vulnerability exceptions, and what maximum expiry applies by severity?
8. Who owns security debt in non-enrolled repositories (`vd-email-studio`, `vd-social-api`, and future additions to `/srv/apps`), and through which release workflow is it remediated?
