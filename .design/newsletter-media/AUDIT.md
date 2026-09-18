# Audit: newsletter images and attachments plan

Date: 2026-09-18
Audited: TASKS.md and DESIGN_BRIEF.md in this folder, against the live checkout, `/opt/vdplatform/sync/editor-baseline.json`, systemd/nginx/cron on this host, and the ASAP and Velvet Dinosaur databases.

## Verdict

The plan's codebase claims are accurate and the shape of the work is right. Every file it names exists; the visual editor has no image plugin; the serializer drops unknown blocks into an empty `<p>`; the campaign schema has no attachment field; the sync allowlist covers the editor but not the serializer, model, service, API or demo files. Reusing the Media Library for both features is the correct call.

It should not start as written. One operational fact is wrong, two requirements are not achievable with the current architecture, and the whole "scheduled delivery" strand rests on a dispatcher that has been dead on ASAP for six months.

## Blocking findings

### 1. ASAP's scheduled dispatch has not worked since 15 March 2026
`crontab -l` (user ianw) posts to `http://127.0.0.1:3003/api/internal/newsletter-dispatch-cron` every 5 minutes. ASAP moved to blue/green slots on ports 3103/3104; nothing listens on 3003. The log at `/srv/apps/asap/logs/newsletter-dispatch-cron.log` shows 53,812 consecutive "Couldn't connect" failures since the last success, and the cron has sent 0 emails in its lifetime. ASAP is the only site with real newsletter use (1 completed campaign, 1 draft edited today at 15:28). Velvet Dinosaur and every demo have no dispatcher at all: "scheduled" means an admin presses Dispatch, which sends one batch of 80 per press.

Tasks 5 and 6 (shared preparation, freeze at queue time) protect a path nobody can currently run. Add a task 0: repoint the ASAP cron at the public origin (or the nginx upstream), confirm a dry run in the log, and decide whether other sites get a dispatcher. Do this before ASAP's current draft is scheduled.

### 2. Wrong deploy entrypoint for Velvet Dinosaur
The release section says `bun run deploy:manual` from a clean `main`. Production is served from `/srv/apps/.ops/sites/velvetdinosaur/slots/green` (active since 14 Sep) behind systemd units whose WorkingDirectory is the slot, and `deploy:manual` fails at its restart step from this checkout. Use `bun run deploy:blue-green`. CLAUDE.md is stale on this point; the memory file `deploy-flow-reality` documents it.

### 3. "Switching views must not silently remove images" is not achievable without new work
`insertToken` in the composer wipes `visualBody` when the HTML or Text tab is edited, and `handleTabChange` rebuilds the visual document from **plain text** (`visualValueFromPlainText(textBody)`), not from the HTML. All formatting is already lost on that round trip today. Either scope this down (warn on entering the HTML tab, accept the loss) or add an explicit HTML-to-Plate deserialisation task. Task 8 currently asserts a behaviour the architecture does not provide.

### 4. Versioned rendition keys collide with the public file route
`app/api/assets/file/route.ts` serves any `uploads/*` key that exists in the default bucket, even with no Asset record, and **upserts a backfill Asset record** whenever the requested key has none. A directly addressed rendition key (`…--email-<version>.jpg`) would create a phantom Media Library entry on first load. All 48 demos share the `velvetdinosaur` bucket, so a key from one site is servable and backfillable from any other. The plan must state: no backfill for rendition keys; server-side image and attachment resolution requires an Asset record in the current site's database and never falls through to the bucket. Task 5 says this for attachments; it must also apply to the image manifest.

## Findings that change the design

### 5. Installed demos have no send restriction
All 48 demos carry Velvet Dinosaur's Postmark server token and send as `hello@velvetdinosaur.com` (ots-sauro-poc has an empty token). Nothing in `send-test`, `dispatch` or `campaigns.ts` checks `isDemoHost`. Task 7's "preserve current installed-demo restrictions" refers to something that does not exist. Attachments let a demo prospect send PDFs under the VD sender identity. Decide explicitly: gate attachments (or sending) on demo hosts, or accept the exposure.

### 6. Reuse the news editor's image stack; decide the plugin depth
`components/edit/news-article-editor.client.tsx` already wires `ImagePlugin.withComponent(registry/ui/media-image-node)` with an `insertImageNode(url, {alt, caption, width, height})` helper and a library/upload picker. The stored node shape is `{ type: 'img', url, alt, caption: [{text}], width, initialWidth, initialHeight }`. Task 2 should adopt that shape (plus an `assetKey` field) so both editors store compatible nodes. Caveat: the registry element needs Dnd, Placeholder and Resizable plugins and `react-dnd`, which The Brave does not have in `package.json`. Choose between the full news stack (consistent, heavier) and a minimal void element, and say which.

### 7. Absolute URLs already have a mechanism
`deriveCampaignBody` serialises the visual document to HTML on the client with `{{appUrl}}` left as a token, and `renderNewsletterCampaignEmail` substitutes it at send. Emit `{{appUrl}}/api/assets/file?key=…&intent=email` from the serializer instead of adding a new absolutisation step. Precondition already shared with unsubscribe links: `resolveBaseUrl()` returns empty when no base URL env is set.

### 8. The send path is per-recipient and already does disk I/O per email
`renderNewsletterCampaignEmail` reads the five social icon files from disk for every recipient. With up to 5 MB of user attachments, per-recipient R2 loads across an 80-recipient batch is a real cost. Make "prepare attachments once per batch" a requirement, not "where possible".

### 9. Cleanup has no scheduler
`purgeExpiredTrashedAssets` has no caller anywhere in app, lib, scripts or ops, and only ASAP has a cron. The "30 days after completion, then eligible for cleanup" promise needs a vehicle: run it opportunistically at queue or dispatch time, or drop the retention promise.

### 10. The demo is a full duplicate
`components/demo/newsletter/demo-email-template-visual-editor.tsx` (322 lines) and `lib/demo-email-template-visual.ts` are copies of the real editor and serializer. Task 7 means doing tasks 2 and 3 twice. Budget for it, and add a check that the two serializers agree on image output.

## Findings that change the rollout

### 11. Sync manifest gap confirmed, and Asset.ts is already behind on ASAP and The Brave
Allowlist coverage: `components/edit/**`, `components/puck/**`, `app/api/assets/**`, `models/Asset.ts`, `lib/uploads.ts` are in; `lib/email-template-visual.ts`, `models/NewsletterCampaign.ts`, `lib/email/newsletter-campaign.ts`, `lib/newsletter/campaigns.ts`, `app/api/admin/newsletter/**`, `components/demo/newsletter/**` and `lib/demo-editor-assets.ts` are not. A partial sync would ship an editor that emits image nodes with a serializer that drops them. Separately, `models/Asset.ts` on ASAP and The Brave lacks the `originalKey`, `processingStatus` and `fallbackKey` fields added on 13 Sep; the plan's rendition and purge-protection work depends on those fields, so the pilot must carry the whole file.

### 12. Fleet time
`ops/scripts/fleet-release-queue.sh` runs full gates serially at roughly 15 minutes per site. 49 installed slots is about 12 hours of queue. "Small batches" should say that.

### 13. Line limits
`lib/uploads.ts` is 896 lines, `media-library.client.tsx` 1497, `news-article-editor.client.tsx` over 2000. "Narrowly extend lib/uploads.ts" adds to a file already 50 percent over the hard limit. New helpers go in new files.

### 14. Adjacent defect in the file task 5 modifies
`NEWSLETTER_SOCIAL_LINKS` in `lib/email/newsletter-campaign.ts` is hardcoded to ASAP's Facebook, Instagram, X, Bluesky and LinkedIn accounts, and the file is byte-identical on Velvet Dinosaur, The Brave and every demo. Any newsletter sent from those sites carries ASAP's social footer. Since task 5 edits `loadInlineSocialIconAttachments` and `withHtmlFooter`, make the links site-configurable or omit them when unset.

## Minor corrections

- 49 `-blue` slots exist, not 48. ots-sauro-poc has its own bucket and no Postmark token; if it is excluded on purpose, say so in the inventory.
- `workspace/*` directories are untracked scratch copies from a parallel session, not build overlays. They are not rollout targets.
- The email column is a 560 px table. Target rendition width is 1120 px for 2x displays, not "the content area".
- Task 3's "unauthenticated image request works" is already true today; the file route has no auth.
- Task 6's "retry never resends a successful recipient" is already true; the dispatcher only picks `pending` deliveries.

## Confirmed as stated

- All named files exist at the stated paths; picker contract is `value: string, onChange(string)` and library items already carry `key`, `mime`, `size`, so the selection adapter is small.
- `@platejs/media`, `@platejs/caption`, `@platejs/resizable` and `sharp` (with jpeg, png and flatten already used in `lib/assets/image-pipeline.server.ts`) are present on Velvet Dinosaur, ASAP, The Brave and the demos.
- Public uploads are converted to WebP; the JPEG `social` variant is 1200 px cover-cropped; the `inline` variant is the public key itself.
- Asset usage scans Page and NewsArticle only.
- Replace keeps the same key and regenerates deterministic variant keys, so a deterministic email rendition would be overwritten in place. Versioning is required.
- Preview, send-test and dispatch already share `renderNewsletterCampaignEmail`.
- nginx gives `/api/assets/file` its own zone (60 r/s, burst 240, 100 connections per IP), which is adequate for mail-client image proxies.
- No unit or Playwright test covers the newsletter today; task 8's tests are new coverage, and the `unit` gate runs `bun run test:unit` so new `*.test.ts` files are picked up.
