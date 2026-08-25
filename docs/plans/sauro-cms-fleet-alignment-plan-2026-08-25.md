# SauroCMS Fleet Alignment and Demo-Safety Plan

Date: 2026-08-25

Status: Phases 1–2 implemented. Phase 3 onward remains pending.

## Implementation progress

- Phase 1 is recorded in `/opt/vdplatform/template-history.git` at `76b4a8c` and `562d6cc`.
- Phase 2 was completed on 2026-08-25. The canonical reference is now `/opt/vdplatform/template`; parity covers 459 shared runtime files across editor/preview routes, CMS persistence, assets/media, support, shared Puck/theme behavior and required models. Theme APIs, their shared authorization/storage/normalization runtime, support email rendering, shared Puck patterns and live-capture dependencies are explicitly covered.
- Installed Sauro source checkouts are discovered from both registries and `/srv/apps`; unstamped packages under `/opt/vdplatform/workspaces` are independently reported as `workspace/<slug>` targets. Runtime blue/green slots are excluded.
- The Brave now resolves to `/srv/apps/thebrave-release`.
- `/opt/vdplatform/sync/editor-baseline.json` is at version 2 and covers every parity-classified core file while explicitly preserving site-owned navigation, branding, field vocabulary, preview registries, blocks, schemas and defaults. A regression test enforces that parity-to-sync invariant.
- Strict parity now exposes the synchronization work intentionally reserved for phase 4; the canonical template itself reports zero drift, missing, foreign or extra-core files.

## Objective

Make every current and future SauroCMS website use the same current core editing and support implementation while preserving each site's content, design, blocks, branding and isolated data.

For demonstration websites, also enforce a consistent disclaimer, search-engine blocking, factual verification and zero-side-effect public interactions before a preview is sent.

This is a direct fleet correction, not a pilot or conditional rollout.

## Important repository safety

`/srv/apps/velvetdinosaur` contains substantial unrelated, uncommitted owner work. It was restored after the previous deployment and must not be reset, cleaned, overwritten or included in this task.

At the time this plan was written, the restored work included:

- `docs/mocks/` with 56 top-level prospect packs and 2,561 files.
- Growth research and handover documents.
- Agreement PDFs and handoff archive.
- The in-progress business-reviews feature.
- Ten modified tracked files and 2,620 untracked files.
- Three retained safety stashes created during the prior deployment.

The 2,620 untracked files were verified byte-for-byte against the retained stash: zero missing and zero mismatches. Do not use `git reset`, `git clean`, destructive rsync, or broad checkout commands against this working tree.

Before changing anything, inspect `git status`, current stamp processes and active agents. Bakewell Pudding, Michael's Malmesbury and Homedene Farm may be under active construction in `/opt/vdplatform/workspaces`.

## Confirmed causes of the fleet failure

1. The parity tool treats ASAP as the reference implementation, but new sites are created from `/opt/vdplatform/template`.
2. The template is behind the latest tested editor. Current parity reports six core editor differences between ASAP and the template.
3. Most existing demos contain the same six older files.
4. Claire Lewis and Velvet Dinosaur contain only part of the latest shared implementation and still report three core differences.
5. The existing `new-demo.sh` installs the platform template, then runs an `rsync --delete` from the workspace package over the installed site. A stale package therefore reintroduces an older core.
6. `bun run sauro:parity -- --strict` exists but is not enforced by demo stamping, normal quality checks or deployment.
7. `sync/editor-baseline.json` omits parts of the functional backend, including the CMS page draft-save route. This prevented the recent cache correction from propagating automatically.
8. The parity manifest currently checks primarily UI directories. It does not fully cover the CMS save/publish APIs, support APIs or all other files required for consistent behaviour.

## Current parity evidence

Run from `/srv/apps/velvetdinosaur`:

```bash
bun run sauro:parity
bun run sauro:parity -- --strict
```

At the time this plan was written:

- ASAP: zero core drift.
- Rising Dust (`/srv/apps/ra`): zero core drift.
- `/opt/vdplatform/template`: six drifted files.
- Most prospect demos: six drifted files.
- Claire Lewis: three drifted files.
- Velvet Dinosaur: three drifted files, plus legitimate site-owned/extra functionality.
- The parity entry for The Brave points at `/srv/apps/thebrave`, while the active release checkout is `/srv/apps/thebrave-release`; this must be corrected so the checker assesses the deployed source.

The currently divergent editor files include:

- `components/puck/editor/PuckEditorShell.tsx`
- `components/puck/editor/editor-getting-started.tsx`
- `components/puck/editor/inline-touch-editing-support.client.tsx`
- `components/puck/blocks/editable-image.client.tsx`
- `components/puck/blocks/puck-image-block.client.tsx`
- `components/theme/theme-root-client.tsx`
- `app/api/cms/pages/[slug]/route.ts` is functionally divergent but is not adequately covered by the existing parity scope.

## Where the support panel went

The support system was not deleted. It is present across the inspected sites and packages:

- Page: `/edit/support`
- Account submission route: `/account/support`
- 12 support UI component files.
- 13 support API routes.
- Eight support models.
- Ticket creation, messages, status management, documents, development schedule and system-status functionality.

The visible entry disappeared in ASAP commit `c17b021` on 2026-08-21. That commit removed the header's `Customer Portal` button and stated that support remained in the sidebar. No sidebar link existed. The shared shell was then propagated to the fleet, leaving the support workspace functional but undiscoverable except by direct URL.

The focused correction is to restore a shared, visible `Customer Portal`/`Support` entry in the core workspace shell. It must not depend on individual site navigation configuration.

## Scope

### Sauro core parity

Apply to every detected SauroCMS checkout, not only a hand-maintained shortlist:

- All Sauro sites under `/srv/apps`.
- All packages under `/opt/vdplatform/workspaces`.
- `/opt/vdplatform/template`.
- ASAP, Rising Dust, The Brave and Velvet Dinosaur.
- Witney Podiatry and other earlier-pattern sites that still carry SauroCMS.
- Future sites created by the installer or `new-demo.sh`.

### Current prospect-demo set

The directly identified set is:

1. Eynsham Dental Care — `eynsham-dental`
2. The White Hart, Minster Lovell — `white-hart-minster`
3. Bush Farm B&B — `bush-farm`
4. Maggie's Fish & Chips — `maggies-fish`
5. Il Botanico — `il-botanico`
6. Bank House Guest House — `bank-house`
7. The Old Craft Barn — `old-craft-barn`
8. Small Talk Tearooms — `small-talk-tearooms`
9. Martha's Coffee + Kitchen — `marthas-coffee`
10. Blue Anchor Inn / Spingo Ales — `blue-anchor`
11. Claire Lewis Hairdressing — `claire-lewis`
12. Woodstock Dental — `woodstock-dental` workspace, built but not stamped
13. The Old Original Bakewell Pudding Shop — `bakewell-pudding`
14. Michael's Butchers, Bistro & Deli — `michaels-malmesbury`
15. Homedene Farm Shop — `homedene-farm`

Witney Podiatry is also in Sauro scope even though its content began on the earlier custom-route pattern. Woodstock Butchers is retired and should not be redeployed, but may remain in parity inventory as an offline/retired record.

### Demo-safety rules

Apply only to sites identified by `VD_DEMO_SITE=true`. Do not put prospect disclaimers or public noindex rules on genuine production customer/platform sites.

## Implementation plan

### 1. Build one canonical SauroCMS core

Use `/opt/vdplatform/template` as the canonical runtime source because it creates future sites.

Bring into it the combined, already-tested implementation from ASAP, Rising Dust, Claire Lewis and Velvet Dinosaur:

- Current Puck workspace shell.
- Current onboarding/help content.
- Inline content-editable text fields.
- Touch selection support.
- Direct image selection.
- Drag and numeric resizing.
- Crop ratio, focal point, alignment and reset controls.
- Direct image replacement through the media library.
- Correct site-framed preview behaviour.
- Current media picker.
- Theme handling that does not generate invalid font URLs.
- String/value normalisation that prevents `e.split is not a function`.
- Draft-save cache invalidation that does not overwrite fresh edits.
- Canonical `/edit/pages/[slug]` route.
- Restored visible support access.

Do not blindly copy one site's entire tree. Reconcile only the known core differences and preserve declared site-owned seams.

Record the completed canonical template revision in the existing `/opt/vdplatform/template-history.git`.

### 2. Expand parity to cover behaviour, not only UI files

Make the template the parity reference instead of ASAP.

Expand the parity and sync manifests to cover the required shared core:

- `app/edit/**`
- `app/preview/**`
- CMS page read/save/publish/reset APIs.
- Asset/media APIs.
- Support pages and APIs.
- Account support submission page.
- Shared admin workspace shell.
- `components/edit/**`
- `components/puck/**`
- Shared theme runtime.
- Shared Puck configuration and field vocabulary.
- Page/cache utilities involved in editor persistence.
- Shared support utilities, models and email templates.
- Required Page, Asset and support models.

Continue excluding site-owned material:

- `components/blocks/store/**`
- Site-specific block schemas/defaults.
- Site design frames.
- Site field vocabulary.
- Branding and site-owned navigation configuration.
- Public assets.
- Site content, page data and themes.

Correct The Brave's parity path to `/srv/apps/thebrave-release`.

Discover and check both installed sources and `/opt/vdplatform/workspaces/*` packages.

### 3. Restore the support panel entry

Restore a prominent shared `Customer Portal` or `Support` entry in the core workspace shell:

- Link to `/edit/support`.
- Show on desktop and mobile.
- Require an authenticated administrator, matching the route's existing access control.
- Do not rely on per-site navigation configuration.
- Preserve the existing support workspace, APIs and data model.

Add browser coverage proving that an administrator can reach the support workspace from the main editor shell and that the page loads without console errors.

### 4. Synchronise every current site and workspace

Apply the canonical core directly to every detected SauroCMS source and unstamped workspace.

For each target:

1. Confirm the target is not being changed by another active build/stamp process.
2. Synchronise only canonical core paths.
3. Preserve all site-owned blocks, designs, content, branding and environment files.
4. Run strict parity.
5. Run the site's declared quality gates.
6. Verify direct text and image editing on desktop and mobile.

Do not treat an earlier revision as acceptable. Every active target must report zero missing or drifted core files.

### 5. Fix future demo creation

Change `new-demo.sh` so stale workspace packages cannot replace the current core:

1. Synchronise the canonical core into the workspace package before installation.
2. Copy the site package into the installed source.
3. Synchronise canonical core paths again after the package overlay.
4. Run strict parity before seeding, committing or deploying.
5. Record the canonical Sauro revision in the generated site.
6. Abort immediately when core drift or required support/editor files are missing.

Add the strict parity check to normal quality and deployment commands so a manually edited core file cannot be released only on one site.

### 6. Enforce demonstration-site safety centrally

When `VD_DEMO_SITE=true`, the shared platform must provide all of the following.

#### Visible disclaimer

Display a prominent site-wide banner:

> Unofficial website concept prepared privately by Velvet Dinosaur. This is not the business's current website.

The banner must appear on every public page at desktop and mobile widths. It must not appear inside the editing/admin interfaces or on genuine production sites.

#### Search and cache prevention

- Metadata: `noindex`, `nofollow`, `noarchive` and `nocache`.
- HTTP: `X-Robots-Tag` with equivalent directives.
- HTTP: `Cache-Control: no-store, no-cache, must-revalidate`.
- `Pragma: no-cache` and an expired `Expires` value where appropriate.
- `robots.txt`: disallow the complete demonstration site.

Verify the rendered HTML and response headers rather than checking only the source file.

#### Zero-side-effect public interactions

Disable at both UI and API levels:

- Enquiries and contact submissions.
- Booking creation.
- Baskets/orders.
- Newsletter subscriptions.
- Payments and checkout.
- Public account creation.

Replace each public action with a clear demonstration message. Server routes must also reject the operation without database writes, email delivery, booking creation, payment activity or other side effects.

Editor saving, admin authentication and media management remain functional.

### 7. Remove unsafe or misleading content

For every demo:

- Remove invented testimonials and reviews.
- Remove placeholder/lorem content.
- Remove editor instructions accidentally rendered publicly.
- Remove unresolved links and dead calls to action.
- Allow a review, award, price or claim only when there is a recorded source.

Extend the existing `demo:check`/handover tooling to report these problems consistently. Do not silently rewrite questionable claims; remove them or verify them.

### 8. Verify factual details immediately before outreach

For every prospect, recheck and record:

- Business trading status.
- Telephone number.
- Email address.
- Postal address.
- Opening hours.
- Prices.
- Awards.
- Events.
- Social links.

Record the source and verification timestamp. This check must be repeated immediately before creating or sending the prospect handover/invite, rather than relying on the original content-harvest date.

### 9. Test and deploy

For every current target:

- Lint.
- Typecheck.
- Unit tests.
- Production build.
- Strict Sauro parity.
- Desktop and mobile editor tests.
- Inline text persistence.
- Image replacement and resize persistence.
- Media-library visibility.
- Support-navigation and support-workspace smoke test.
- Public route crawl.
- Broken internal-link check.
- Mobile horizontal-overflow check.
- Demo disclaimer and robots/header checks.
- Demonstration action tests proving zero side effects.
- Declared visual and Lighthouse gates.

Commit the exact tested source. Deploy active sites using their configured blue/green deployment path and verify the public URL and service health after switching.

## Definition of done

The task is complete only when all of these statements are true:

1. `bun run sauro:parity -- --strict` reports zero core drift for every active SauroCMS site and every unstamped workspace.
2. The canonical template contains the complete current editor and support implementation.
3. Every site exposes a visible Support/Customer Portal entry and `/edit/support` works.
4. Every Puck page supports genuine inline text editing.
5. Every editable image supports direct replacement, resizing, crop, focal point and alignment controls.
6. Media assets are visible and selectable from the editor.
7. Draft and published data persist correctly without the previous cache race or `e.split` failure.
8. Every demonstration site displays the disclaimer on every public page.
9. Every demonstration site returns the required search and cache prevention headers.
10. No public demo interaction can create a genuine enquiry, booking, subscription, order or payment.
11. No invented reviews, placeholders, public editing instructions or unresolved links remain.
12. Business facts have current source evidence recorded before outreach.
13. Desktop, mobile, internal-page, quality, visual and Lighthouse checks pass.
14. Existing active sites are deployed and healthy.
15. A future stamp automatically fails if it attempts to use an older SauroCMS core.

## First actions for the fresh session

1. Read the applicable `AGENTS.md` files for `/srv/apps/velvetdinosaur` and `/opt/vdplatform`.
2. Inspect current agents/processes so the three active prospect workspaces are not overwritten mid-build.
3. Re-run `bun run sauro:parity` and save the starting report.
4. Inspect the six currently divergent core files and the CMS draft route.
5. Build the canonical template revision.
6. Restore the shared support entry.
7. Update parity/sync/stamp enforcement.
8. Synchronise all existing sources and workspaces.
9. Apply demo-safety rules and content checks.
10. Run the complete gates and deploy active sites blue/green.
