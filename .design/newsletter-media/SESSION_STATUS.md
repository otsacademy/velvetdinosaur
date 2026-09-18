# Active rollout handoff

User authorized revising the plan and implementing it across the hub, ASAP, The Brave and 48 managed demos. **Do not use Figma or Snapshot MCP.** Use local Playwright. No real email sends as verification.

## Current release

- Hub source and clean release clone HEAD: `3ac883e` (feature focus fix `ffc397d`, previous media fix `62f15fc`).
- Clean hub clone: `/srv/apps/.ops/newsletter-media/velvetdinosaur`.
- Hub release completed successfully: log `/tmp/newsletter-hub-release-reviewed.log`, session `32835` closed with exit zero.
- Lint, typecheck, 142 unit tests, 13 isolated Mongo tests, 17 release-runner tests, build, portfolio, 52 browser tests (four existing skips, no baseline updates), nine mobile and nine desktop Lighthouse runs, and theme smoke all passed.
- Exact commit `3ac883e` is LIVE on blue3061 and pushed to canonical GitHub. Original controller `.state.json` deploy fields are synchronized from verified clone state, with private backup and unrelated fields preserved.
- Hub post-deploy nginx/media/cron verification and installation are COMPLETE. Exact live source hashes, cross-site 404/no-backfill, unknown immutable image404 and unchanged legacy profile200 verified. Empty queue confirmed before/after installing five-minute future dispatch and daily cleanup; zero sent deliveries. Evidence `hub-release/post-deploy.json`. No current crontab writer; keep later installs serial. No real emails sent for verification.
- Popty Cara pilot is complete: session `17785` exited zero, `/tmp/newsletter-popty-release.log`, detailed log `pilot-release-final/popty-cara.log`; commit `9fd8e3702c5758e6c735495476ff2ec0c552e120` passed every manifest gate and is healthy on green. Controller develop/main fast-forwarded; no canonical remote exists.
- Popty post-deploy nginx, own/foreign media checks, read-only demo cron and daily cleanup passed. Actual R2 image/encrypted-attachment round trips, public image200/private route404 and deployed demo-send rejection passed. Exactly two temporary media records remain for normal cleanup; no email/campaign/recipient/source-asset writes. Reports: `pilot-release-final/popty-cara-post-deploy.json` and `popty-cara-live-storage.json`.
- Lighthouse evidence: hub all18 raw runs100; Popty all three-run category medians100, with home performance mobile96/100/100 and desktop100/75/100. New rollout guard enforces fresh three-run medians100 before deployment; 25 runner tests/88 assertions, lint and full typecheck pass.
- Previous live hub snapshot: `hub-release/previous-live.json`; green slot, build `idTx1OyJ7ep_aHEl1UW-u`, recorded commit `2ebcaa5766cd2605e68a4c431fe48ce9d4914e86`.

## Source distribution

- Shared feature source commit: `ffc397d03d0cc3759ca7375515953a576bd096a4`.
- Template commit: `87c7e45f580325abdee3cb5abb5eb51899df1692` (bare repo `/opt/vdplatform/template-history.git`).
- All 98 shared files match the reviewed catalog committed in the hub.
- All 47 remaining demos are staged in isolated clones, with no release commits/gates/deployment yet. Reports: `fleet-staging-final/summary.json` and `verification.json`.
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
2. Popty Cara pilot is complete, including real storage verification without emails. Begin ASAP, then The Brave, using the median-guarded runner.
3. Keep cron installations serial to preserve unrelated entries; no current writer. UI agent prepared `/tmp/newsletter-site-post-deploy.ts` with explicit site/commit/report GO, a process-held lock and live/source/environment checks. Enable dispatch only for freshly verified empty primary queues; all demo schedules remain read-only.
4. Release ASAP and The Brave serially with all gates. Apply nginx helpers (`academicsstand.org`, `thebrave.online`). Restore ASAP stable-origin dispatch only after empty-queue dry-run; remove old port-3003 cron via the scheduler's private backup/install path. Use Brave release controller for scheduler files.
5. Release the remaining 47 demos serially; follow each site's manifest, stop/fix failures, preserve baselines. Then nginx routes and read-only demo schedulers plus daily cleanup. No canonical remotes exist for the demos; report mirror skips.
6. Update task checkboxes/evidence only on actual completion. Publish already-tested/deployed history. Preserve unrelated root changes.

Root unrelated tracked dirty files remain `package.json` (two demo scripts), `scripts/prospect-harvest-batches.json`, and `tsconfig.json` (`workspace` exclusion). Do not stage them wholesale. Root `.agtx`, unrelated `.design`, workspace/output/docs assets also preexist.

Free disk last measured about 30 GiB. Do not delete unrelated `/tmp` project data. If needed, only remove generated build caches in this task's completed isolated clones after preserving release evidence.

Old-slot rollback is unsafe after media-aware campaigns/images are used: old code lacks frozen-manifest handling and the immutable image endpoint. Pause scheduled and manual newsletter mutations/dispatch first, inspect active/uncertain campaigns, and preserve a media-capable image service or deploy a corrected media-capable commit. Recorded predecessor slots are recovery evidence, not approval for a blind rollback.
