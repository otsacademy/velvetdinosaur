# Build tasks: newsletter images and attachments

Date: 2026-09-18
Status: Shared implementation and hub release verified; installed-site pilot and fleet operations remain in progress.
Source: [DESIGN_BRIEF.md](./DESIGN_BRIEF.md). Findings and qualifications: [AUDIT.md](./AUDIT.md).

## Decisions

- Reuse the Media Library, Puck picker/upload services, MongoDB, R2, BetterAuth, Plate and shadcn primitives. No second upload store.
- Use the news editor's image node shape with assetKey and immutable renditionId; use a small Plate image element without the news editor's drag-and-drop dependencies. Share image rendering and media controls with the public walkthrough.
- The email column is 560px; render uncropped JPEG (opaque) or PNG (alpha) at at most 1120px, without upscaling. Preserve occurrence-level alt/decorative status, caption, link, alignment and width.
- Persist authoritative bodySource (visual/html/text). Tabs are views, not destructive conversions. Converting custom HTML/text to visual is explicit and warned; arbitrary HTML-to-Plate fidelity is outside scope. Authority persists through save/reload.
- Use the existing {{appUrl}} substitution for immutable image URLs. Require a valid public HTTPS origin for actual delivery.
- Newsletter source assets need trusted current-site upload/migration provenance. A record created by public GET backfill is not ownership evidence. Stop unknown-key backfill and storage-only fallback. Migrate genuine legacy references from reviewed evidence; otherwise require reupload with an actionable error.
- Public email renditions have independent, durable site-owned records outside the uploads namespace. They survive source Asset deletion. Private attachment snapshots are never addressable through the public asset/image routes.
- Attachments: five files, 5 MiB combined decoded bytes, exact PDF/JPEG/PNG signature/type validation, safe filenames, plus a conservative encoded final-message limit below Postmark's 10 MB ceiling. Optimized WebP sources need original raster bytes or an explicit safe conversion.
- Freeze subject/preheader/body and media manifest before a campaign becomes dispatchable. Prepare attachment bytes and inline icons once per dispatch batch. Manual dispatch needs these guarantees as much as scheduled delivery.
- Installed demos allow editing/previews/media, but default to no real newsletter sending, including test/queue/cron/dispatch; sending requires explicit server configuration. Existing admin authorization remains. Public walkthrough sending is always simulated.
- Claim deliveries atomically before contacting Postmark. Interrupted/ambiguous sends require review and are never automatically retried. Do not promise exactly-once delivery across an external provider and MongoDB.
- Social footer links are site configuration; omit unset links and preserve ASAP's links explicitly at rollout.
- Private snapshots remain pinned while queued/sending. After completion/cancellation they become eligible for cleanup after at least 30 days. Add a bounded cleanup runner and schedule; eligibility is not a deletion-at-exactly-30-days guarantee. Sent image renditions remain durable.

## Corrected operational facts

- ASAP's cron targets unused port 3003; its active nginx upstream serves a blue/green slot on 3103/3104. The log confirms a long outage; it has no timestamps, so 15 March is an estimate unless corroborated separately. Recorded successful summaries report zero sends; this is not proof of all historical provider activity.
- Manual Dispatch uses up to 25 passes of 500 deliveries per campaign, not one batch of 80. The ASAP cron endpoint currently requests 200 per campaign and has no dry-run mode.
- Velvet Dinosaur now runs reviewed commit `3ac883e` from blue port 3061, after all gates and post-deploy checks passed. Its previous green slot is recorded as recovery evidence. Use an already-created commit with deploy:blue-green after the complete quality suite; that script alone only builds and checks health.
- Inventory has 49 blue demo directories: 48 share Velvet Dinosaur's bucket/sender configuration; ots-sauro-poc is a separate-storage, empty-token exception. Inventory actual source and active slots before rollout. Scratch workspace copies are not targets.
- The managed rollout has 51 sites: hub, ASAP, The Brave and 48 installed demos. Fleet quality releases are serial: measured examples are about 15–20 minutes per site. The 50 sites after the hub therefore need roughly 12.5–17 hours before retries; report actual progress per site.
- Source comparison found the missing 13 September Asset bookkeeping/purge prerequisites on most demos as well as ASAP and The Brave. Distribute the complete reviewed prerequisites with the newsletter feature; do not treat those omissions as intentional site customizations.

## Ordered work

Checked implementation tasks mean the shared code and stated local/hub checks have passed. They do not mean all installed sites are running it. The hub is live; Popty Cara's release completed healthy and its post-release acceptance is separate. All 51 sites' configuration and reviewed ownership migration are complete, and the complete shared source is staged. Tasks 0, 7, 8 and 9 retain the outstanding installed-site acceptance and operations.

- [ ] **0. Restore the scheduler safely.** Add an authenticated, read-only dry-run that reports due campaign/delivery counts without writes or provider calls. Inspect the live queue before changing cron. Use the stable public origin/nginx routing, bounded HTTP timeouts, overlap protection, timestamped logs and failure exit status; never bind cron to a slot port. Install only after the endpoint/claim behavior is deployed and dry-run succeeds. If backlog exists, leave sends disabled until the campaigns are reviewed. Retain rollback evidence. Decide scheduler coverage per site; installed demos stay disabled by default. Media development can run in parallel with this operational repair.

  Status: Code and hub scheduler/cleanup installation are verified. ASAP still needs the new release, a fresh proven read-only queue check and replacement of its dead port-3003 cron. Do not POST a dry-run to the old implementation.

- [x] **1. Define shared contracts and inventory.** Record source/active slot/revision/storage capabilities for hub, ASAP, The Brave and discovered demos. Add shared metadata selection without breaking Puck's string value/onChange contract. Use the existing component system and local Playwright browser checks. Per the user’s explicit instruction, do not use Figma or Snapshot MCP. Share attachments, source mode, image node and frozen manifest contracts across editor and server.

- [x] **2. Images and explicit editing modes.** Implement image upload/library insertion at saved selection, alt/decorative state, caption/link, capped width/alignment, replace/remove and undo/redo. Use shared UI and image serializer in production and public demo. Preserve draft save/reopen and explicit HTML/text authority. Keep each changed code module under 600 lines by extracting focused helpers.

- [x] **3. Trusted immutable image delivery.** Add audited upload provenance, current-site resolution, versioned uncropped renditions, durable Mongo records and a public image-only delivery endpoint. Include original/optimized WebP handling, dimensions, useful plain text, origin token substitution and missing/invalid image errors. Remove public unknown-key backfill. Record legacy migration effects before release.

- [x] **4. Attachments through the complete composer.** Reuse upload/library UI with exact MIME choices, progress/cancel/retry, duplicate prevention, size totals, download/preview/removal. Persist reference metadata; ignore client size/MIME/bucket claims during server preparation. Carry selections through save, reopen, preview and test payloads; missing fields on old campaigns default to empty.

- [x] **5. Shared preparation, freeze and transport.** Route preview, test, queue and dispatch through one preparation path. Validate signature, size, ownership, availability, public origin and final encoded payload. Freeze queued content and private attachment snapshots idempotently; prepare bytes/icons once per batch. Omit unconfigured social links. Reject incomplete payloads before sending. Test with mocked Postmark/storage; no real recipient sends as part of implementation or release.

- [x] **6. Delivery claims and lifecycle.** Add atomic claims, interrupted-delivery review states, cancellation/unschedule safeguards, frozen version checks and legacy campaign handling. Extend asset usage to newsletter references; source replacement/purge must not invalidate pinned/sent renditions. Add idempotent bounded cleanup and dry-run command with a scheduled vehicle. Test concurrent workers, provider ambiguity, crash windows, cleanup boundaries and missing snapshots.

  Evidence for tasks 2–6: shared unit tests, 13 isolated Mongo integration tests, desktop/mobile walkthrough flows, Puck regression checks and the hub's full gates/live media checks. Cleanup is scheduled on the hub; installation on the other sites remains part of task 9.

- [ ] **7. Demo parity and explicit send policy.** Public demo uploads remain session-local and appear in its Media Library, using raster/PDF fixtures and object URLs only inside simulation. Installed demos use real site-owned storage and the new explicit no-send-by-default policy. Share code to prevent production/demo serializers drifting.

  Status: Shared code, simulated UI and policy tests pass. The installed-demo pilot still needs actual storage and live policy verification. The configured policy is not enforced by old live slots; verify the new code on each demo as it is released.

- [ ] **8. Validate locally.** Add Bun unit tests for serialization, authoritative mode transitions, ownership, signatures/limits, immutable manifests, attachment preparation, retries/claims and demo policy. Add desktop/mobile browser flows for upload/select/edit/preview/remove, save/reopen, mode conversion and keyboard/focus behavior. Verify Puck picker regression. Run quality:validate and every manifest gate: lint, typecheck, unit, build, portfolio-images, visual, Lighthouse and theme-smoke. Do not relax thresholds or update unrelated baselines. Record pre-existing failures accurately.

  Status: Every hub manifest gate passed on exact release commit `3ac883e`, including 142 unit tests, 13 Mongo tests, 17 runner tests, 52 browser tests and required Lighthouse gates. Hub category medians and all individual scores are 100. Popty's required gates passed on `9fd8e37`; all category medians are 100, with home performance outliers of 96 mobile and 75 desktop. See the raw-score summaries in IMPLEMENTATION.md. The other sites' required gates remain outstanding.

- [ ] **9. Complete source distribution and staged release.** Update the platform template and explicit sync allowlist for the full editor/API/model/service/serializer/tests/cleanup set; carry the complete Asset model bookkeeping fields to ASAP/The Brave. Apply reviewed scoped diffs preserving site-specific changes. Commit only this task's changes, preserve the user's unrelated dirty files, validate the exact committed release tree, then deploy through inactive slots. Pilot hub + one installed demo, then ASAP/The Brave, then serial batches of remaining verified targets. Record commits, gates, smoke checks and rollback revisions. Publish the already-tested histories to canonical remotes. Never silently fall back to old code for queued media manifests.

  Status: Template `87c7e45`, all 98 shared files, explicit allowlist/installer changes, all 51 configurations and all 1,918 reviewed ownership records are complete. Eight excluded records remain untrusted. Hub release/operations and mirror push are complete; Popty's application release is healthy, with post-release operations tracked separately. ASAP, The Brave and 47 further demos still need release and per-site nginx/scheduler/cleanup evidence. Missing demo canonical remotes must be reported as mirror skips.

## Release and rollback

The user authorized revising and implementing this plan. Production emails are not a verification mechanism. Use mocked transport and read-only operational dry-runs. Before restoring automatic sends, verify no unreviewed overdue queue exists. If a gate fails, fix the cause before deployment; do not bypass it.

Old slots lack frozen-manifest handling and the immutable-media endpoint. After feature usage, do not perform a generic old-slot rollback. First block newsletter admin mutation/dispatch endpoints and disable scheduled dispatch; inspect queued, sending and uncertain campaigns. Preserve the new image route/service and durable storage, or deploy a corrected media-capable commit. Record the concrete dispatch block before attempting rollback. A captured previous slot is recovery evidence, not authorization for blind rollback.

Production release uses the exact reviewed commit; no fresh commit is created by deploy. Velvet Dinosaur uses main and blue/green slots, with all manifest gates run explicitly before deploy:blue-green. The fleet uses each site's verified local release entrypoint. Remote pushes are backup/shared history, never deployment triggers.

## Evidence

Track implementation, tests, operational changes and fleet progress in IMPLEMENTATION.md. Check boxes only when their acceptance conditions have been met; do not mark fleet rollout complete after only the hub build.
