# Active rollout handoff

User authorized revising the plan and implementing it across the hub, ASAP, The Brave and 48 managed demos. **Do not use Figma or Snapshot MCP.** Use local Playwright. No real email sends as verification.

## Current release

- Hub deployed/clean release clone HEAD: `3ac883e` (feature focus fix `ffc397d`, previous media fix `62f15fc`). Root source HEAD is now `b76e882`, following `413d59e`: tested rollout median guard, generated-state recovery and progress/runbook documentation. Those operations-only follow-ups have not been deployed to the hub or pushed yet.
- Clean hub clone: `/srv/apps/.ops/newsletter-media/velvetdinosaur`.
- Hub release completed successfully: log `/tmp/newsletter-hub-release-reviewed.log`, session `32835` closed with exit zero.
- Lint, typecheck, 142 unit tests, 13 isolated Mongo tests, 17 release-runner tests, build, portfolio, 52 browser tests (four existing skips, no baseline updates), nine mobile and nine desktop Lighthouse runs, and theme smoke all passed.
- Exact commit `3ac883e` is LIVE on blue3061 and pushed to canonical GitHub. Original controller `.state.json` deploy fields are synchronized from verified clone state, with private backup and unrelated fields preserved.
- Hub post-deploy nginx/media/cron verification and installation are COMPLETE. Exact live source hashes, cross-site 404/no-backfill, unknown immutable image404 and unchanged legacy profile200 verified. Empty queue confirmed before/after installing five-minute future dispatch and daily cleanup; zero sent deliveries. Evidence `hub-release/post-deploy.json`. No current crontab writer; keep later installs serial. No real emails sent for verification.
- Popty Cara pilot is complete: session `17785` exited zero, `/tmp/newsletter-popty-release.log`, detailed log `pilot-release-final/popty-cara.log`; commit `9fd8e3702c5758e6c735495476ff2ec0c552e120` passed every manifest gate and is healthy on green. Controller develop/main fast-forwarded; no canonical remote exists.
- Popty post-deploy nginx, own/foreign media checks, read-only demo cron and daily cleanup passed. Actual R2 image/encrypted-attachment round trips, public image200/private route404 and deployed demo-send rejection passed. Exactly two temporary media records remain for normal cleanup; no email/campaign/recipient/source-asset writes. Reports: `pilot-release-final/popty-cara-post-deploy.json` and `popty-cara-live-storage.json`.
- Lighthouse evidence: hub all18 raw runs100; Popty all three-run category medians100, with home performance mobile96/100/100 and desktop100/75/100. The current rollout runner enforces fresh three-run medians100 and reviewed state recovery; 28 runner tests/122 assertions, lint and full typecheck pass. The deployed hub's earlier exact suite contained 17 runner tests; do not substitute the current count into that historical release evidence.
- ASAP release is COMPLETE, healthy blue3103 at `de6daf044b5335a4fa74c529a82637a2c5c47708`, controller develop/main promoted and mirrored. All site/admin gates and median100 checks passed. Original session6508 exited1 only after successful deployment because old deploy script generated untracked state. Fix b76e882 was independently reviewed; 28 tests/122 assertions, lint/typecheck pass. Reviewed `/tmp/newsletter-asap-complete-verified-release.ts` reverified completed gates/unchanged env+candidate/livebytes, archived only generated state, finished controllerFF+mirror without rebuilding or switching. Original failure: `pilot-release-final/asap-before-state-recovery.json`; final report `asap.json`; private clone state supports readDeploymentState. Previous green slot remains preserved.
- ASAP postops and actual separate-bucket R2 smoke COMPLETE: nginx, immutable image200, encrypted private snapshot round trip, public private-route404, exact unchanged original Asset/object, five footer socials match; all six queue counts0, historical sent3 unchanged. Old newsletter3003 cron replaced with stable-origin dispatch +daily cleanup; two unrelated3003 jobs preserved. Exactly two temporary media records remain for normal cleanup. Evidence `asap-post-deploy.json`, `asap-live-storage.json`. No verification emails/campaigns/recipients written.
- The Brave release is COMPLETE: session96003 exited0, exact `3762efcaeb4ff673faeebe20b2b9171a307306c2` healthy green3017, all gates/median100 passed, controllerFF and GitHub mirror complete. Tracked clone state captured/restored safely. Postops nginx/media isolation/dispatch+daily cleanup passed with empty queues and no emails. Reports `pilot-release-final/thebrave.json` and `thebrave-post-deploy.json`.
- ASAP's first natural scheduled tick succeeded at19:55:01.652Z: dispatch mode, no campaigns, zero sends/failures/review. Saved in `asap-post-deploy.json`; no manual dispatch was invoked.
- Remaining47 serial fleet release STOPPED before its first deployment. Academy Partnership candidate `02ac1730cf876a289d97761f23213891f9c1092b` passed code/database/build checks, then failed three public visual comparisons: desktop home1,351 pixels, mobile home414 and mobile about148. Browser result11 passed/3 failed/2 skipped. Its previous green3108 slot and build remain unchanged. Reports `fleet-release-final/academy-partnership.json`, `.log`, and `summary.json`; session72370 is no longer a running rollout. Host font drift is confirmed; the reviewed quality-only profile restores all four original screenshots. No baseline or threshold changed.
- The UI agent's serial post-deploy watcher stopped on that failed release with0/47 completed and no operations executed. Evidence `fleet-release-final/post-deploy-status.json`; no current cron writer. After a verified healthy release, restart its guarded `/tmp/newsletter-site-post-deploy.ts` flow without --enable-dispatch for demos, keeping cron writes serial. Root must monitor release AND postops reports; application deployment alone is not completion.
- Independent state-writer review: remaining47+Brave all compatible; eleven track state,37 ignore it, zero unignored generated-state cases. Evidence `fleet-release-readiness/state-writers.json`.
- All47 remaining demo release preflights passed again; evidence `fleet-release-readiness/dry-run.json`. No additional sites deployed.
- Previous live hub snapshot: `hub-release/previous-live.json`; green slot, build `idTx1OyJ7ep_aHEl1UW-u`, recorded commit `2ebcaa5766cd2605e68a4c431fe48ce9d4914e86`.

## Source distribution

Academy's font cause is confirmed: candidate and current live have identical 1351/414/148-pixel failures; excluding only the September 11 Microsoft/OpenSymbol additions restores all four existing screenshots. Runner quality-only environment support is reviewed and tested (31 tests/132 assertions, lint/typecheck pass). `visual-environments.json` binds 44 older trees to the legacy profile and three later trees to system fonts; all47 current trees match. Strict complete site gates still determine acceptance. Source/profile evidence is under `visual-environment-review/`; original failed report/log are preserved privately there. No baselines, system fonts or service environments changed. The queue has not yet restarted.

- Shared feature source commit: `ffc397d03d0cc3759ca7375515953a576bd096a4`.
- Template commit: `87c7e45f580325abdee3cb5abb5eb51899df1692` (bare repo `/opt/vdplatform/template-history.git`).
- All 98 shared files match the reviewed catalog committed in the hub.
- All 47 remaining demos are staged in isolated clones. Academy Partnership now has candidate commit `02ac1730cf876a289d97761f23213891f9c1092b` and an incomplete gate run; the other46 remain staged and unattempted. None of the47 has deployed. Original staging reports: `fleet-staging-final/summary.json` and `verification.json`; current attempt: `fleet-release-final/`.
- Popty Cara, ASAP and The Brave were also staged through the final runner; reports: `pilot-staging-final/`.
- Runner: `ops/scripts/newsletter-release-queue.ts`; instructions in `ops/scripts/NEWSLETTER_RELEASE.md`. It defaults to read-only review, requires every quality gate, never updates snapshots, uses inactive slots, records retries/rollback and has an 8 GiB disk floor.
- Brave clone controller remote was changed to `/srv/apps/thebrave-release` after proving it shares the same Git repository as `/srv/apps/thebrave`. Its develop/main base is `c04ccd5`; do not deploy detached `aa8cac5`.
- Runner maps Brave code/controller to its release worktree and runtime env to the original controller. Its original dirty `.state.json` and AGENTS files must be preserved.

## Operations already completed

- All 51 managed sites' controller/slot newsletter keys and cron secrets are provisioned consistently, with private backups; The Brave release controller also received only its two missing newsletter keys.
- All 1,918 reviewed Asset records were migrated and independently verified: 1,359 demo records, 528 ASAP and 31 Brave. Eight exclusions remain unchanged/untrusted. Evidence under `ownership-review/` and `demo-operations/`.
- Four excluded active files need reupload before newsletter use (hub cropped profile, two Cotswold Dental, one Glamour and Glow); the other four exclusions are trashed ASAP records.
- All demos are configured for no real sending. Enforcement reaches production only when each new slot is deployed; old slots lack this guard. Do not describe the entire live fleet as protected before rollout finishes.
- Platform installer key provisioning, nginx template and explicit sync allowlist are updated; platform patch/evidence retained locally. Template unrelated changes were preserved.

## Remaining sequence

1. Hub application, state bookkeeping and post-release operations are complete; evidence is `hub-release/post-deploy.json`.
2. All four pilots are complete. Rerun Academy's complete gates with the confirmed quality-only font profile, then resume the remaining47 queue and separate serial postops. No baseline changes or threshold relaxation.
3. Keep cron installations serial to preserve unrelated entries; no current writer and no remaining-fleet postops have run. The prepared `/tmp/newsletter-site-post-deploy.ts` requires exact site/commit/report evidence, a process-held lock and live/source/environment checks. Resume only after healthy release evidence; all demo schedules remain read-only.
4. Primary releases and operational checks are complete. ASAP natural successful scheduler tick is recorded. Two unrelated ASAP legacy jobs still use3003; preserved outside newsletter scope.
5. Release the remaining 47 demos serially; follow each site's manifest, stop/fix failures, preserve baselines. Then nginx routes and read-only demo schedulers plus daily cleanup. No canonical remotes exist for the demos; report mirror skips.
6. Tasks8/9 stay open until all remaining fleet gates, releases and postops pass. Update checkboxes/evidence only on actual completion. Publish already-tested/deployed history. Preserve unrelated root changes. Owner guide is `docs/newsletter-media.md`.

Root unrelated tracked dirty files remain `package.json` (two demo scripts), `scripts/prospect-harvest-batches.json`, and `tsconfig.json` (`workspace` exclusion). Do not stage them wholesale. Root `.agtx`, unrelated `.design`, workspace/output/docs assets also preexist.

Free disk last measured about 30 GiB. Do not delete unrelated `/tmp` project data. If needed, only remove generated build caches in this task's completed isolated clones after preserving release evidence.

Old-slot rollback is unsafe after media-aware campaigns/images are used: old code lacks frozen-manifest handling and the immutable image endpoint. Pause scheduled and manual newsletter mutations/dispatch first, inspect active/uncertain campaigns, and preserve a media-capable image service or deploy a corrected media-capable commit. Recorded predecessor slots are recovery evidence, not approval for a blind rollback.
