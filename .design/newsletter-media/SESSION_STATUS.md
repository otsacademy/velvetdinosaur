# Active rollout handoff

Checkpoint: 2026-09-19 16:15 UTC. **27/51 sites complete; 24 remain.** Current site: il-botanico; watcher: running; stage: all-manifest-quality-gates. Read ROLLOUT.json and fleet-release-final/post-deploy-status.json for newer results.

The user authorized revising and implementing newsletter media across the hub, ASAP, The Brave and 48 managed demos. **No Figma MCP or Snapshot MCP.** Use local Playwright. Do not send real emails for verification. Preserve unrelated work. Current developer instructions prohibit new delegation unless explicitly requested.

## Active processes

- Release queue: session `94782`, log `/tmp/newsletter-fleet-release-resume24.log`, reports `fleet-release-final/`. Its explicit 24-site selection starts at Il Botanico and includes only uncompleted sites. The prior failure is preserved under `fleet-release-history/2026-09-19-il-botanico-performance/`. Run every manifest gate, then the independent Lighthouse median guard, exact-main blue/green deployment, health, controller fast-forward and mirror when a canonical remote exists.
- Post-deploy watcher: session `11511`, log `/tmp/newsletter-fleet-post-deploy-resume24.log`, status `fleet-release-final/post-deploy-status.json`. It covers the original 47 additional demos, has 23 completed additional-demo proofs, and waits for each healthy release. It resumed after the failed summary was archived and the new release report was confirmed running. Root is the sole cron writer through its locked serial helper. **Never pass `--enable-dispatch` for demos.**
- Stop and fix actual failures. Preserve the failed report/log/summary and raw Lighthouse evidence before restarting an explicitly bounded list of uncompleted sites. There is no automatic gate retry or baseline update.
- Shared feature source: `ffc397d03d0cc3759ca7375515953a576bd096a4`. Template: `87c7e45f580325abdee3cb5abb5eb51899df1692`. Active process started from root `1d08678`; fleet engine matches reviewed `89e01ba`. Root follow-up `df5668b` additionally protects the hub release entrypoint with the median guard.
- Root hub follow-up release/mirror remains outstanding: hub production is still `3ac883e`. Later commits contain reviewed rollout tooling and documentation. Finish fleet work, commit only task files, then use the clean hub clone and `release:local` for an exact-main release. Full hub gates share port3100 with fleet gates; do not run them concurrently.

## Completed deployments

Completion requires both a healthy exact-commit release and a passed matching post-deploy report. See [ROLLOUT.json](./ROLLOUT.json) for the full per-site snapshot and links.

| Site | Exact deployed commit | Evidence directory |
| --- | --- | --- |
| academy-partnership | `02ac1730cf876a289d97761f23213891f9c1092b` | `fleet-release-final/` |
| asap | `de6daf044b5335a4fa74c529a82637a2c5c47708` | `pilot-release-final/` |
| bakewell-pudding | `f9d90e4a5b255fe3e1dd875886acefe2be6130f5` | `fleet-release-final/` |
| bank-house | `6184659a1b476863b93b98cc8a6ece1cc06ccbd3` | `fleet-release-final/` |
| bath-street-dental | `84c702cc75d2fb3714a597dc1661b61881411f9f` | `fleet-release-final/` |
| blue-anchor | `b966cf2aea31633f3eac879be2e9f0d77f170a79` | `fleet-release-final/` |
| bodalwyn-aberystwyth | `58547a68b707486a3219ba054f06dbad1633e683` | `fleet-release-final/` |
| bubbleton-tenby | `48dae05875a01362f41282fb51055b9a917649d0` | `fleet-release-final/` |
| burford-road-dental | `8af2b7433367c34f774b3d96871d3988c5f69627` | `fleet-release-final/` |
| buscot-manor | `f05343d409d7fc8e1fdfe917794cd6a2add12a33` | `fleet-release-final/` |
| bush-farm | `709e4212ee5e68c3c45f103dfdeb0e527429c703` | `fleet-release-final/` |
| claire-lewis | `0710a0b813f2b31d987fb6e202dab17c410206fa` | `fleet-release-final/` |
| contour-leek | `674ce5e4e44ea290ab995e91cc22740d18ab3196` | `fleet-release-final/` |
| corn-street-dental | `572feb1eccad87a7dbc49b4fd3d5de9c4facd88d` | `fleet-release-final/` |
| cotswold-dental | `8cbeb43fc431e6b53e53ec91c42172df08b6b0ca` | `fleet-release-final/` |
| eynsham-dental | `df1d8bf9397100f35e1dc68791dd597a2e64959e` | `fleet-release-final/` |
| fringe-hair-beauty | `c135d788b1dcb3babf75c51623badb81d2779b73` | `fleet-release-final/` |
| glamour-and-glow | `a98770928144e7ff6917bc1a903c9e16e77a60b6` | `fleet-release-final/` |
| go-engineers | `43da18a4195ea3cddde1ffa7800724e2e1159e43` | `fleet-release-final/` |
| hair-lounge-chipping-norton | `369bb126fde33e87a0d50e906a42b9c525fb113a` | `fleet-release-final/` |
| halls-gardening | `72ec5867c94f7b689d9f94d918432879e249d80a` | `fleet-release-final/` |
| higher-farm-malpas | `16d0b18c5a32a9ae234538113760a1abaac88a3a` | `fleet-release-final/` |
| home-farm-salon | `33a779b9c1810fc7aa026fa820bd8fc93ff4703a` | `fleet-release-final/` |
| homedene-farm | `586797bd155254b06c940418ac9d9d9c48403a73` | `fleet-release-final/` |
| popty-cara | `9fd8e3702c5758e6c735495476ff2ec0c552e120` | `pilot-release-final/` |
| thebrave | `3762efcaeb4ff673faeebe20b2b9171a307306c2` | `pilot-release-final/` |
| velvetdinosaur | `3ac883e520438f9f1684b247c3b57342f4eeb3c4` | `hub-release/` |

Hub, ASAP and The Brave are mirrored. Demos have no canonical remote; mirror skips are recorded. All completed sites have nginx/media isolation and daily cleanup checks. Demo schedules remain read-only. Configuration alone does not enforce the no-send policy in older, uncompleted slots.

Hub gates included 142 unit tests, 13 isolated Mongo tests, 17 then-current runner tests, 52 browser tests (four existing conditional skips), all18 raw Lighthouse reports100, build/portfolio/theme checks. Popty's category medians are100, but home performance raw runs were mobile96/100/100 and desktop100/75/100; preserve that distinction. Root runner89e01ba separately passed37tests/171assertions, lint and typecheck. The hub local release now also uses the fresh three-run median guard before deployment/pushing; two additional command-isolated integration tests verify rejected medians cannot deploy or push, and valid evidence deploys the exact commit. Current combined suite: 39 tests, 178 assertions, plus lint and full typecheck passed.

ASAP's dead port3003 newsletter cron was replaced by stable-origin dispatch only after all six queue counts were zero. Its first natural tick at19:55:01.652UTC on18September succeeded with zero sends/failures/review. Historical sent count remains3. Two unrelated port3003 cron jobs were preserved. Actual site-bucket image and encrypted-attachment round trips passed on Popty and ASAP without email/campaign/recipient/source-asset writes; two temporary media records per site remain for normal cleanup. Evidence is in each pilot's post-deploy/live-storage reports. Popty's initial cache-header assertion and its fingerprint limitation are recorded rather than hidden.

The Brave's controller is `/srv/apps/thebrave-release` on develop/main; its old detached `/srv/apps/thebrave` checkout remains untouched. Runtime settings come from the original controller, preserving its site configuration. Hub's clean release clone is `/srv/apps/.ops/newsletter-media/velvetdinosaur`.

## Resolved gate and release failures

- **Academy host fonts:** candidate and unchanged live site reproduced identical screenshot differences. Microsoft/OpenSymbol fonts were installed September11 after44sites' baselines. Reviewed `ops/quality/fonts/pre-september-2026.conf` restores the previous process-only font environment;3later baselines use system fonts. Exact baseline-tree catalog, profile hash and font-file hashes are checked before/after quality. No system fonts, production settings, baselines or thresholds changed. Evidence: `visual-environment-review/`; catalog: `visual-environments.json`. All47original trees were independently checked.
- **Generated TypeScript caches:**46remaining demos track TypeScript5.9.3 build metadata. Runner requires original exact committed bytes, privately archives valid compiler-generated changes and restores only that originally clean cache in isolated clones on success/failure. Unexpected content, pre-existing edits, symlinks or changed commits stop. Real compiler and regression checks passed. Code: `newsletter-release-typescript-cache.ts`; evidence: `fleet-release-readiness/typescript-caches.json`.
- **ASAP generated deployment state:** deployment succeeded, then an older script's generated untracked state stopped controller promotion. Independently reviewed bounded recovery reverified gates/env/livebytes, archived only generated state and completed fast-forward/mirror without rebuilding or switching. Original report is retained. Runner now supports that exact reviewed writer and tracked state safely.
- **Blue Anchor port conflict:** initial admin visual gate found port43000 in use. At resume it was free; no process was killed. Full fresh gates and deployment passed. Cause of the transient bind conflict was not proven. Failed evidence: `fleet-release-history/2026-09-18-blue-anchor-port/`.
- **Bubbleton layout shift:** the additional median guard stopped candidate4e2f213 before deployment on desktop home100/99/99 and CLS0.066559 twice. Demo proxy forced no-store on Next font/CSS assets, causing repeated preload downloads. A metric-fallback experiment was insufficient; preserving static caching yielded zeroCLS in5diagnostic contexts. Site-only commit17b69dd preserves immutable caching under `/_next/static/`, retains page/API/upload no-store and all demo/noindex/action guards, and extends the existing safety test. Final candidate48dae058 passed every gate, unchanged screenshots and all12Lighthouse reports100. Desktop CLS is0.000126757; mobile0. Exact healthy blue deployment, postops and public cache smoke passed. The shared102scope hashes did not change; only the receipt's site base was refreshed after preserving the retry failure. Evidence: `fleet-release-history/2026-09-19-bubbleton-cls/` and `fleet-release-final/bubbleton-tenby*.json`.

Temporary diagnostic servers31920/31921 were stopped after Bubbleton verification. No live production service was stopped for that investigation. Prior queue sessions92169/38683 and their old watchers are historical, not active.

- **Bush Farm screenshot timing:** candidate5177a983 and current live produced byte-identical mobile About failures (1216photo pixels). Idle-only1000ms passed11/12, so was insufficient. A full-page paint followed by1000ms settling passed all four unchanged baselines three times (12/12), with no runtime CSS/source, baseline or threshold changes. Site-only test commit`ac401cca20b007ed85828fc671bc6854bdae4e49` is merged into candidate`709e4212ee5e68c3c45f103dfdeb0e527429c703`; only receipt base refreshed and all102scopehashes remain exact. Full fresh gates passed, all12Lighthouse reports score100, and exact deployment plus postops completed. Evidence: `fleet-release-history/2026-09-19-bush-farm-mobile/`; diagnostics: `output/playwright/newsletter-bush-*`.

## Distribution and operational prerequisites

- All98sharedfeaturefiles exactly match sourceffc and template87c. Complete Asset bookkeeping prerequisites, package/gates and scoped release helpers are staged in isolated clones. Site customizations and ASAP's200batch limit are preserved. Staging is not deployment.
- Template Git: bare `/opt/vdplatform/template-history.git`, worktree `/opt/vdplatform/template`. Preserve unrelated template edits. Do not print ignored environment files.
- All51controllers and both slots have consistent newsletter encryption keys and cron secrets, with private backups. The separate Brave release controller received only its missing keys.
- All1,918reviewedAsset records were migrated and independently verified:528ASAP,31Brave,1,359demos. Eight exclusions remain unchanged/untrusted. Four active exclusions need reupload before newsletter use: hub cropped profile, two Cotswold Dental files and one Glamour and Glow file; four other exclusions are trashed ASAP records.
- Explicit platform sync allowlist, future installer provisioning and nginx template are updated; `/opt/vdplatform` is not Git, so patch/evidence are retained locally. `ots-sauro-poc` is outside the51managedsites.
- Runner instructions: `ops/scripts/NEWSLETTER_RELEASE.md`. It defaults read-only, enforces scoped committed receipts and all gates, never updates baselines, uses inactive slots, records previous live state and rejects less than8GiBavailable disk.
- Postops helper `/tmp/newsletter-site-post-deploy.ts` requires exact release/controller/live/environment evidence, process-held lock and new read-only endpoint proof before a cron POST. It checks own/foreign/unknown media behavior and preserves unrelated cron entries. Watcher `/tmp/newsletter-fleet-post-deploy.ts` freezes helper/inventory hashes and stops on queue failure.

## Remaining work and safety

1. Finish the remaining demos serially, resolving actual gate failures before any deployment. Monitor both application release and postops evidence; neither alone is completion.
2. Keep tasks8/9open until every site has full gates, exact release, health, media isolation and scheduler/cleanup proof. Record mirror skips rather than inventing demo remotes.
3. Update task documentation and final rollout summary; owner instructions are `docs/newsletter-media.md`. Commit only reviewed task changes.
4. Complete clean exact-main hub follow-up release/mirror for later operations/docs commits after the fleet no longer uses shared quality ports.

Root unrelated tracked changes: `package.json` (two demo scripts), `scripts/prospect-harvest-batches.json`, `tsconfig.json` (`workspace` exclusion). Preserve those and unrelated `.agtx`, `.design`, workspace/output/docs assets. Never stage everything.

Disk measured147GiBavailable at13:36UTC on19September. The increase occurred outside this task; no additional reclamation was performed. Only generated `.next/cache` directories in completed isolated ASAP/Brave clones were previously reclaimed after proving they were not live and preserving evidence. Never delete live/rollback builds, source, logs, receipts, environments or unrelated temporary work. Reclamation evidence: `pilot-release-final/clone-cache-reclamation.json`.

Old-slot rollback is unsafe once media-aware campaigns/images are used. First block newsletter admin mutations/dispatch and disable scheduled dispatch, inspect queued/sending/uncertain campaigns, then preserve a media-capable image service/storage or deploy a corrected media-capable commit. Recorded predecessor slots are recovery evidence, not approval for a blind rollback.

Current Claire investigation: unchanged candidate0710a0b813f2b31d987fb6e202dab17c410206fa; only desktop home failed, hero LCP30.8s/27.8s/5.6s. Other configured pages and categories100. Original failure and all rawLH preserved under fleet-release-history/2026-09-19-claire-lewis-lcp/. An isolated diagnostic Lighthouse run reproduced8sLCP and7898ms response-header wait. Live probe passed100/292ms. After restarting only the diagnostic candidate server with HTTP timing instrumentation, candidate passed100/581ms and every image request completed108–183ms, R2headers89–165ms. Ordinary Playwright probes on Chromium145/152, localhost/127.0.0.1, live/candidate were under1200ms. Cause remains unproven; no source, baseline, threshold or gate changes. All diagnostic servers stopped (sessions16396/22868), port31920free, liveblue3056untouched. The full fresh suite and median guard passed; all12 raw reports score100, desktop Home LCP572/184/163ms. Exact green deployment and post-deploy operations passed at2026-09-19T12:31:12.039Z. Cause remains unproven; original evidence is preserved. Prior release90716/watcher97296 stopped; then-current sessions were54090/35375. Diagnosis is in the failure archive; raw traces in output/playwright/newsletter-claire-lighthouse-diagnostic/.

Sanitized aggregate verification: VERIFIED_RELEASES.json. Refresh only after `bun /tmp/newsletter-rollout-progress.ts --save`, then `bun /tmp/newsletter-build-verified-evidence.ts`. The generator requires matching commit, healthy release, successful operations, all three Lighthouse scores and required medians, public/media statuses and scheduler/cleanup proof. It includes no credentials, recipient records or campaign content.

Hair Lounge: first candidate `749f08e` stopped before deployment on 44 mobile Home image pixels. Original evidence is archived under `fleet-release-history/2026-09-19-hair-lounge-mobile/`. Fresh isolated captures matched even without settling; timing is inferred. The test now uses the existing Bush Farm full-page paint plus a 1000ms wait. All four unchanged baselines passed three repetitions (12 tests, no flaky results or skips); lint passed. Site fix `b06ce75e648701290e571946026adf2c363c2cdd`, merge `948a99dd`, final candidate `369bb126fde33e87a0d50e906a42b9c525fb113a`. Only the receipt base changed; all 102 scoped hashes remain exact. The controller’s dirty compiler cache remains unchanged. Diagnostic server31920/session65090 is stopped. Release47500/watcher46336 later stopped on Il Botanico; old release54090/watcher35375 stopped.

Il Botanico: candidate `02fe2e14be44c895f5e3dfcc07019a3a360ce82f` stopped before deployment on desktop Home performance99/99/95. Browser sampling and a red regression test confirmed hero text becomes transparent during hydration before fading back in. Remove hero-only reveal wrappers/attributes; original layout and below-fold motion remain. Site fix `d4d4872af7a67c75ace38985c788c4479363a737`, merge `35fa405fbfd1f1987d97d74c8f94ed282ea30137`, fresh receipt candidate `0f375ac0aa1308d253ce6b9de66b85be9bfb2114`. All102 scoped hashes unchanged. Regression now2/2, original visual baselines4/4, diagnostic Lighthouse required categories100, LCP252ms, speed index499ms, TBT0. Full fresh gates remain mandatory. Baseline tree `99099a776380fcf78aaefa9d5ea083fbd4c33f8a`. Original failure, raw Lighthouse reports and before/after proof are archived under `fleet-release-history/2026-09-19-il-botanico-performance/`. Diagnostic server31920/session6257 stopped. Active queue94782/watcher11511; previous47500/46336 stopped.
