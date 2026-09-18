# Local newsletter fleet release queue

`newsletter-release-queue.ts` stages the reviewed newsletter feature in isolated `develop` clones and releases sites serially. It defaults to a read-only dry run. It never dispatches newsletters, sends test emails, changes visual baselines, migrates ownership, installs schedulers or changes nginx media-route policy.

Run from `/srv/apps/velvetdinosaur`. Substitute the reviewed full commit hashes:

```sh
# Read-only source/configuration review; remaining demos excludes Popty, ASAP,
# The Brave and the hub. Add --report-dir=PATH to save the review explicitly.
bun ops/scripts/newsletter-release-queue.ts --remaining-demos --source-commit=HUB_SHA --template-commit=TEMPLATE_SHA

# Create/reuse isolated clones and stage exact reviewed files; no commits/gates/deploy.
bun ops/scripts/newsletter-release-queue.ts --sites=academy-partnership --stage --source-commit=HUB_SHA --template-commit=TEMPLATE_SHA

# Explicit production release after operational provisioning and successful pilot verification.
bun ops/scripts/newsletter-release-queue.ts --remaining-demos --release --update-controller --mirror --source-commit=HUB_SHA --template-commit=TEMPLATE_SHA
```

`--sites=slug,slug` selects a bounded list. `--workspace=PATH` changes the isolated clone root (default `/srv/apps/.ops/newsletter-media`). `--catalog=PATH` changes the reviewed inventory directory (default `.design/newsletter-media`). `--report-dir=PATH` chooses a private log/report directory; executed runs otherwise use `logs/newsletter-release-<timestamp>`. After a failure, inspect that site's JSON/log and explicitly select it and the unprocessed sites. Retries run fresh gates. When the exact candidate already has matching deployment state, live files and public health, the switch is skipped so its previous live slot remains available. Ambiguous routing changes without exact-commit completion evidence stop for review.

The primary pilot topology is explicitly supported: ASAP and The Brave use their reviewed `/srv/apps/.ops/sites/<slug>/slots/{blue,green}` paths, ports, services and active links. The Brave's inventory provenance remains `/srv/apps/thebrave`, but its actual Git/controller target is `/srv/apps/thebrave-release`, on `develop`; the old detached controller is untouched. Its gate/build environment comes from the original reviewed `/srv/apps/thebrave/.env.production`, preserving production settings rather than mixing release-controller-only settings. An existing isolated Brave clone can retarget its local controller remote only after branch/history/content checks. Popty uses the standard demo topology. `--sites=asap,thebrave,popty-cara --stage` supplies the same scoped receipt preparation for all pilots without running gates or deploying.

The shared manifest and compatibility matrix are required. Source and template bytes are read from the specified commits, never from dirty working files. Template Git history lives at `/opt/vdplatform/template-history.git`; its worktree is `/opt/vdplatform/template`. Existing target files must match the hub/template baseline, current reviewed source, or the four exact reviewed legacy asset bookkeeping hashes. Unknown content stops the queue. ASAP's reviewed cron batch limit of 200 is preserved. Package scripts and string/object quality gates are merged without replacing site settings.

Stage/release execution takes the atomic `/opt/vdplatform/workspaces/.stamp-claim`. An existing claim stops the runner; it never steals or deletes another holder's claim. Clones retain a local `controller` remote and any existing canonical `origin`. Missing demo remotes are normal and recorded as a skipped mirror. Original controller dirty files are preserved; an existing clone with unexpected edits is left intact for review.

A release commits only the reviewed feature, the package/gate additions, and an explicit scoped preflight receipt/helper. It installs with a frozen lockfile, runs `quality:validate`, then every gate in `quality --all`. Any failure stops before promotion. No threshold or baseline is relaxed. The exact unchanged commit is fast-forward promoted to local `main`, then passed to the site's existing `deploy:blue-green` entrypoint with a configuration pointing at the isolated clone. Controller/slot encryption keys, cron secrets, database and bucket configuration must agree before release. Child processes receive the site's environment, without inherited hub application settings. Available disk bytes are recorded before staging, gates and deployment; fewer than 8 GiB stops the run. Nothing is automatically deleted. Operators may separately review generated `.next` caches in completed isolated clones while preserving Git, logs, receipts and environments.

Before promotion, the runner also checks the saved Lighthouse reports. Each configured mobile/desktop URL must have three fresh, distinct reports with valid performance, accessibility, best-practices and SEO scores, and every category median must be 100. A sanitized score summary is saved alongside the release report. This prevents LHCI's default optimistic aggregation from accepting one good run when the median fails; existing site configurations and thresholds are unchanged. Manifests without a Lighthouse gate are explicitly recorded as skipped.

The installed quality and deploy scripts normally enforce a broad Sauro template comparison, including unrelated template changes. This release records that comparison in the log and uses a narrowly scoped alternative for its quality, build and deployment subprocesses: `NEWSLETTER_RELEASE_RECEIPT=.newsletter-release-receipt.json`. The receipt is committed and tied to exact hub/template/site-base commits. Its complete feature manifest, package/gates and two preflight files must match both committed Git bytes and working bytes. Missing files, extra/missing receipt entries, uncommitted receipts, symlinks escaping the checkout and changed content fail verification. The variable is never written to service environments; normal releases continue using the full baseline check.

Additional dotenv files in the clone and both slots are accepted only when every setting is an exact subset of that location's reviewed production environment. Unrecognized dotenv syntax, extra settings or conflicting values stop execution with the file intact. This closes Bun/Next automatic dotenv loading after inherited application variables have been stripped.

Before deployment, the previous live slot, port/service, active link, exact upstream text, build ID and available recorded commit are saved in the per-site report and private `.git/newsletter-release-attempt.json`. An unknown previous commit is recorded as null rather than inferred. The existing blue/green entrypoint retains responsibility for its own health rollback and old-service shutdown window. Runner verification failures record current routing and stop; the runner does not perform an additional automatic slot switch. After controller promotion, an unchanged reviewed receipt is reused so a retry does not create a metadata-only commit and redeploy unnecessarily.

When a site tracks `.state.json`, the deploy script's generated update is checked against the exact commit, slot configuration, routing and unchanged non-deployment fields. It is captured privately in `.git/newsletter-deployment-state.json`, then only the isolated clone's file is restored to its committed bytes. Retry verification reads that private operational record. Original controllers' pre-existing dirty state is preserved. Unexpected state edits stop for review. Immediately before deployment, the current controller `main` is checked again; stale clone remote references cannot authorize deployment over an independently advanced `main`.

Some legacy deploy scripts instead create an untracked `.state.json`. The runner archives and removes that generated file only when it is a regular file containing exactly the verified deployment metadata and belongs to this runner's started deployment attempt. The reviewed ASAP writer's omitted rollback-window metadata is recognized by its committed source checksum. Unrelated state or other untracked work remains untouched. The private record supports already-live recovery only while the original state file stays absent.

After switching, the runner checks the exact commit in deployment state, all scoped live-slot file bytes and public HTTP health. `--update-controller` then fetches the local clone and fast-forwards original `develop`/`main` only when both histories permit it and dirty paths do not overlap. It verifies original dirty-file fingerprints and the controller's scheduler/cleanup script bytes afterward. Detached controllers or overlapping work are reported as skipped. `--mirror` pushes only already-deployed commits after health passes, when a canonical remote exists. No forced Git operations occur.

Ownership migration, newsletter media nginx routing and scheduler activation remain separately reviewed operations. Cron activation needs the new operational scripts in the chosen controller and a verified empty-queue dry run; a slot deployment alone does not supply controller scripts. Private configuration provisioning must precede a release. A source-only stage or a successful dry run is not a production release.

After newsletter media has been used, an old slot is not a safe generic rollback target: it lacks frozen-manifest handling and the immutable image endpoint. First disable scheduled dispatch and block newsletter admin mutation/dispatch endpoints, then review queued, sending and uncertain campaigns. Preserve the media-capable image service and durable storage, or deploy a corrected media-capable commit. Recorded predecessor slots are recovery evidence, not authorization for a blind rollback.

Regression checks:

```sh
bun test ops/scripts/newsletter-release-queue.test.ts ops/scripts/newsletter-release-state.test.ts
bunx eslint ops/scripts/newsletter-release-*.ts --max-warnings 0
bun run typecheck
```
