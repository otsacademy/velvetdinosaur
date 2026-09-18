# Build tasks: newsletter images and attachments

Date: 2026-09-18
Status: Revised after AUDIT.md and independent verification; implementation in progress.
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
- Velvet Dinosaur production runs from the green slot. Use an already-created commit with deploy:blue-green after the complete quality suite. That script alone only builds and checks health. Reconcile AGENTS.md/CLAUDE.md/release entrypoints with operational reality.
- Inventory has 49 blue demo directories: 48 share Velvet Dinosaur's bucket/sender configuration; ots-sauro-poc is a separate-storage, empty-token exception. Inventory actual source and active slots before rollout. Scratch workspace copies are not targets.
- Fleet quality releases are serial: measured examples are about 15–20 minutes per site. Budget at least 12–16 hours for 49 targets, plus pilot time/retries; report progress per site.

## Ordered work

- [ ] **0. Restore the scheduler safely.** Add an authenticated, read-only dry-run that reports due campaign/delivery counts without writes or provider calls. Inspect the live queue before changing cron. Use the stable public origin/nginx routing, bounded HTTP timeouts, overlap protection, timestamped logs and failure exit status; never bind cron to a slot port. Install only after the endpoint/claim behavior is deployed and dry-run succeeds. If backlog exists, leave sends disabled until the campaigns are reviewed. Retain rollback evidence. Decide scheduler coverage per site; installed demos stay disabled by default. Media development can run in parallel with this operational repair.

- [ ] **1. Define shared contracts and inventory.** Record source/active slot/revision/storage capabilities for hub, ASAP, The Brave and discovered demos. Add shared metadata selection without breaking Puck's string value/onChange contract. Use the existing component system and local Playwright browser checks. Per the user’s explicit instruction, do not use Figma or Snapshot MCP. Share attachments, source mode, image node and frozen manifest contracts across editor and server.

- [ ] **2. Images and explicit editing modes.** Implement image upload/library insertion at saved selection, alt/decorative state, caption/link, capped width/alignment, replace/remove and undo/redo. Use shared UI and image serializer in production and public demo. Preserve draft save/reopen and explicit HTML/text authority. Keep each changed code module under 600 lines by extracting focused helpers.

- [ ] **3. Trusted immutable image delivery.** Add audited upload provenance, current-site resolution, versioned uncropped renditions, durable Mongo records and a public image-only delivery endpoint. Include original/optimized WebP handling, dimensions, useful plain text, origin token substitution and missing/invalid image errors. Remove public unknown-key backfill. Record legacy migration effects before release.

- [ ] **4. Attachments through the complete composer.** Reuse upload/library UI with exact MIME choices, progress/cancel/retry, duplicate prevention, size totals, download/preview/removal. Persist reference metadata; ignore client size/MIME/bucket claims during server preparation. Carry selections through save, reopen, preview and test payloads; missing fields on old campaigns default to empty.

- [ ] **5. Shared preparation, freeze and transport.** Route preview, test, queue and dispatch through one preparation path. Validate signature, size, ownership, availability, public origin and final encoded payload. Freeze queued content and private attachment snapshots idempotently; prepare bytes/icons once per batch. Omit unconfigured social links. Reject incomplete payloads before sending. Test with mocked Postmark/storage; no real recipient sends as part of implementation or release.

- [ ] **6. Delivery claims and lifecycle.** Add atomic claims, interrupted-delivery review states, cancellation/unschedule safeguards, frozen version checks and legacy campaign handling. Extend asset usage to newsletter references; source replacement/purge must not invalidate pinned/sent renditions. Add idempotent bounded cleanup and dry-run command with a scheduled vehicle. Test concurrent workers, provider ambiguity, crash windows, cleanup boundaries and missing snapshots.

- [ ] **7. Demo parity and explicit send policy.** Public demo uploads remain session-local and appear in its Media Library, using raster/PDF fixtures and object URLs only inside simulation. Installed demos use real site-owned storage and the new explicit no-send-by-default policy. Share code to prevent production/demo serializers drifting.

- [ ] **8. Validate locally.** Add Bun unit tests for serialization, authoritative mode transitions, ownership, signatures/limits, immutable manifests, attachment preparation, retries/claims and demo policy. Add desktop/mobile browser flows for upload/select/edit/preview/remove, save/reopen, mode conversion and keyboard/focus behavior. Verify Puck picker regression. Run quality:validate and every manifest gate: lint, typecheck, unit, build, portfolio-images, visual, Lighthouse and theme-smoke. Do not relax thresholds or update unrelated baselines. Record pre-existing failures accurately.

- [ ] **9. Complete source distribution and staged release.** Update the platform template and explicit sync allowlist for the full editor/API/model/service/serializer/tests/cleanup set; carry the complete Asset model bookkeeping fields to ASAP/The Brave. Apply reviewed scoped diffs preserving site-specific changes. Commit only this task's changes, preserve the user's unrelated dirty files, validate the exact committed release tree, then deploy through inactive slots. Pilot hub + one installed demo, then ASAP/The Brave, then serial batches of remaining verified targets. Record commits, gates, smoke checks and rollback revisions. Publish the already-tested histories to canonical remotes. Never silently fall back to old code for queued media manifests.

## Release and rollback

The user authorized revising and implementing this plan. Production emails are not a verification mechanism. Use mocked transport and read-only operational dry-runs. Before restoring automatic sends, verify no unreviewed overdue queue exists. If a gate fails, fix the cause before deployment; do not bypass it. Rollback of media-aware code must disable dispatch for campaigns requiring the new manifest. Preserve durable image storage on rollback.

Production release uses the exact reviewed commit; no fresh commit is created by deploy. Velvet Dinosaur uses main and blue/green slots, with all manifest gates run explicitly before deploy:blue-green. The fleet uses each site's verified local release entrypoint. Remote pushes are backup/shared history, never deployment triggers.

## Evidence

Track implementation, tests, operational changes and fleet progress in IMPLEMENTATION.md. Check boxes only when their acceptance conditions have been met; do not mark fleet rollout complete after only the hub build.
