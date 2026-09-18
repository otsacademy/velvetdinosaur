# Newsletter media implementation evidence

Updated: 2026-09-18. Work remains in progress until final gates and staged rollout finish.

## Implemented

- Shared Plate image element, image serializer, upload/library picker, occurrence-level alt/decorative/caption/link/alignment/width controls and attachment list.
- Persistent visual/HTML/text authority; switching views preserves saved visual content, with explicit conversion/resume confirmation.
- Public walkthrough shares media UI/serialization, uses session-only file/blob storage and PNG/PDF fixtures; no real upload or email calls.
- Site-owned immutable image records and JPEG/PNG renditions. Unknown public file keys no longer fall through to the shared bucket or create Asset records.
- Authenticated upload receipts and ownership provenance. Legacy ownership migration requires reviewed evidence and byte checksums, including originals when present.
- Private attachment snapshots encrypted with AES-256-GCM and a dedicated per-site key. Durable pending records precede storage writes; retries resume interrupted writes; only ready records are loadable.
- Frozen queued content/media, once-per-batch preparation, atomic delivery claims and campaign leases. Ambiguous sends require review and are not automatically retried. Interrupted queue preparation remains locked for operator review.
- Read-only authenticated cron dry-runs, stable-origin runner, guarded scheduler installation, bounded snapshot cleanup, per-site social URLs, installed-demo no-send default.
- Existing selected newsletter image files and attachments are frozen. Third-party custom HTML/news-highlight image URLs and standard branding retain their existing behavior; no arbitrary remote asset fetching was added.
- Media Library and upload modules split below 600 lines. Existing Puck string picker API preserved.

## Verification so far

- First complete quality attempt passed lint, typecheck, 130 unit tests, production build and portfolio image check. Visual checks: 45 passed, four existing conditional skips, one newsletter test failed because it did not dismiss the demo tour. That test was fixed and passed individually on desktop; mobile also passed in the first run after the fix.
- Isolated MongoDB integration runner starts its own loopback mongod and disposable data directory; eleven tests passed covering concurrency, immutable queue content, cancellation, uncertain responses, crash recovery, dry-run behavior and provider-configuration failure. No fleet campaign data or real provider sends are used.
- Second full quality run passed lint, typecheck, 133 unit tests, isolated Mongo integration, production build, portfolio images, and 48 desktop/mobile browser tests (four existing conditional skips; no baseline updates). Mobile Lighthouse passed its nine runs. Desktop Lighthouse and theme smoke are still running. A further exact-commit release run will include final UI focus/token/attachment-link fixes and operational guards.
- The live database inventory was read-only: 51 managed controllers (hub, ASAP, The Brave, 48 installed demos). All database reads succeeded. ASAP has one draft, one completed campaign and three sent delivery records; no queued/sending campaigns. The separate ots-sauro-poc slot-only exception is not a normal managed demo controller.
- Hub controller/blue/green env files received one shared dedicated per-site media key and matching cron secret, with mode-0600 backups under logs/newsletter-config-backups. This does not restart services or send emails. Other sites are pending rollout provisioning.
- Cleanup dry-run on the hub: removed=0, failed=0, eligible=0. Scheduler installation and nginx changes have only been prepared/dry-run; no automatic dispatch has been enabled yet.
- Reviewed ownership manifests pin current object checksums and source evidence; the apply command rechecks bytes and uses a compare-and-set against the reviewed Asset record. Popty Cara's ten verified assets were migrated successfully. ASAP's 528 active assets and The Brave's 31 have reviewed manifests; remaining shared-bucket review is in progress. Unverifiable legacy files require reupload and are listed explicitly, including the hub's cropped profile image.
- The Brave's controller checkout is behind its active development/release history. Rollout uses develop/main c04ccd5, preserving the eight subsequent owner-workflow/editor fixes. It does not deploy the detached aa8cac5 checkout.
- Independent review reproduced and fixed a dispatch race: a campaign rescheduled after candidate selection is now rejected by an atomic due-date, queued-version and review-status check. Thirteen isolated Mongo tests pass, including future rescheduling and legacy null schedules.
- The complete second workspace quality run passed both Lighthouse viewports (nine runs each) and theme smoke. The first isolated release attempt was stopped before deployment to incorporate the scheduling fix; production remains unchanged until the final exact-commit run passes.
- All 51 sites' source and active-slot database identities match. Ownership review finished: 1,918 of 1,926 records verified; four trashed ASAP records and four shared-bucket files lacking source proof are excluded. Current manifests and reasons are retained locally under ownership-review/.

## Operations

- Configure a site: `bun scripts/newsletter-configure.ts --site-root=/srv/apps/<site> --apply`. Preserves existing keys and creates private env backups. Run before deploying attachment support. Never rotate/remove the media key while retained snapshots need it.
- Review ownership: `bun scripts/newsletter-asset-ownership.ts --env-file=/srv/apps/<site>/.env.production --manifest=<reviewed.json>`; append `--apply` only after evidence review. Schema: site, evidence, assets[{key,sha256,originalSha256?}]. Existing records alone are not proof for shared storage.
- Scheduler verification: `bun scripts/newsletter-dispatch-cron.ts --env-file=/srv/apps/<site>/.env.production`. Defaults to dry-run.
- Scheduler installation: `bun scripts/newsletter-scheduler.ts --site-root=/srv/apps/<site> --install`; installs read-only checks plus daily cleanup. `--enable-dispatch` additionally requires an empty verified queue and explicit demo sending opt-in where applicable. It backs up the prior crontab privately and routes via the stable HTTPS origin with a timeout and flock.
- Snapshot cleanup: `bun scripts/newsletter-media-cleanup.ts --env-file=<path>` is read-only; `--apply` removes only eligible unreferenced snapshots. Retained sent images remain durable.
- Proxy configuration: `bun ops/scripts/nginx-newsletter-media.ts --site=<nginx-vhost-name>` previews a dedicated image location copied from that vhost's existing media settings. `--apply` backs up, checks nginx syntax and reloads with rollback on failure.
- `bun scripts/newsletter-mongo-test.ts` runs isolated integration tests. Included as an explicit hub quality gate.
- Hub release wrapper now runs all gates, checks a clean main and stable commit, deploys that commit to the inactive slot, verifies health and then pushes. Per-site overrides are reconciled with live blue/green operation.

## Remaining before completion

- Final passing exact-source lint/typecheck/unit/integration/build/visual/Lighthouse/theme gates; all Lighthouse categories 100 on mobile and desktop for three runs.
- Finish reviewed legacy ownership migration, source/template distribution and explicit sync allowlist expansion.
- Commit only task files, preserving existing package/prospect/tsconfig/workspace changes. Stage and validate an isolated clean release tree before production deployment.
- Pilot hub and an installed demo, then ASAP and The Brave, repair ASAP scheduler after read-only verification, and complete fleet batches with per-site commits/gates/health/rollback evidence.
- No Figma or Snapshot MCP use; local Playwright verification follows the user's explicit instruction.
