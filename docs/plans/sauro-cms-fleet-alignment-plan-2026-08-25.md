# SauroCMS Fleet Alignment and Demo-Safety Plan

Date: 2026-08-25

Status: Complete. Phases 1–9 were implemented and verified on 2026-08-26.

## Implementation progress

- Phase 1 is recorded in `/opt/vdplatform/template-history.git` at `76b4a8c` and `562d6cc`.
- Phase 2 was completed on 2026-08-25. The canonical reference is now `/opt/vdplatform/template`; after the Phase 4 ownership refinement, parity covers 455 shared runtime files across editor/preview routes, CMS persistence, assets/media, support, shared Puck/theme behavior and required models. Theme APIs, their shared authorization/storage/normalization runtime, support email rendering, shared Puck patterns and live-capture dependencies are explicitly covered.
- Phase 3 was completed on 2026-08-25 and its browser coverage is recorded in `/opt/vdplatform/template-history.git` at `6c82df9`, with administrator-visibility hardening and negative browser coverage at `233c397`. The shared workspace shell injects an administrator-only `Customer Portal` entry linked to `/edit/support`, independently of every site's navigation configuration. The same navigation is rendered in the desktop sidebar and mobile drawer, and browser coverage verifies administrator navigation, non-admin hiding on forced admin routes, and a console-clean support workspace load in both Playwright projects.
- Installed Sauro source checkouts are discovered from both registries and `/srv/apps`; unstamped packages under `/opt/vdplatform/workspaces` are independently reported as `workspace/<slug>` targets. Runtime blue/green slots are excluded.
- The Brave now resolves to `/srv/apps/thebrave-release`.
- `/opt/vdplatform/sync/editor-baseline.json` is at version 2 and covers every parity-classified core file while explicitly preserving site-owned navigation, branding, field vocabulary, preview registries, blocks, schemas and defaults. A regression test enforces that parity-to-sync invariant.
- Phase 4 was completed on 2026-08-26. The canonical core was synchronized into all 31 detected installed, reference and unstamped-workspace targets after active-process checks. Site-owned blocks, designs, content, branding and environment files were preserved; browser-safe site registry/preview adapters now form an explicit seam around the shared client registry.
- The synchronized core includes smoke-safe page/database access, restored optional Hero branding fields and immediate numeric image-width persistence. Site-specific legacy migrations, normalizers and page definitions remain site-owned.
- Every target's declared gates passed, including production builds, desktop/mobile visual coverage, three-run mobile/desktop Lighthouse gates where declared, and theme smoke checks. Desktop/mobile editor coverage verifies text and image editing and persistence.
- Phase 5 was completed on 2026-08-26. Future demo creation now synchronises the canonical core before and after the site overlay, records the canonical revision, and fails before seeding, committing or deploying on drift. Normal quality and release entrypoints run the same preflight. The tested canonical revision is `67cf7df7ff99d7382ff9061f0db9b9be4cebcba3` in `/opt/vdplatform/template-history.git`.
- Phase 6 was completed on 2026-08-26. `VD_DEMO_SITE=true` centrally enables the exact public disclaimer, full robots metadata and response headers, no-store caching, and proxy-level rejection of public side-effect mutations before their handlers execute. Authenticated editor, administration, support and media operations remain available.
- Phases 7 and 8 were completed on 2026-08-26 for the authoritative twelve-demo fleet. Database-backed strict checks found and removed or corrected unsupported reviews, placeholder/editor copy, stale hours and prices, missing media-library assets, and unverified Bank House contact/host claims. All twelve have source-backed nine-field evidence manifests verified within the required 24-hour window. Five later demo-mode packages were audited to the same standard as additional coverage.
- Closing strict parity reports 465/465 canonical core files on all 31 detected targets across 95 shared runtime scopes, with zero drift, missing, foreign or extra-core files. The synchronisation preflight covers 467 files; two generated/reference-only paths are intentionally outside parity comparison.
- Phase 9 was completed on 2026-08-26. All twelve authoritative demos passed their complete declared manifests, were committed, promoted to matching local `develop` and `main` revisions, deployed through blue/green release paths and verified independently at their public URLs. The five additional demo-mode packages also passed strict integrity and their complete declared quality manifests.
- Closing live probes passed on all twelve authoritative demos: the home page returned the exact disclaimer and required no-store/noindex headers, `robots.txt` disallowed `/`, the active systemd slot was healthy, and a real `POST /api/contact` probe returned `409` with `X-VD-Demo-Blocked: true`.

### Phase 9 authoritative release record

| Demo | Tested and deployed commit | Active slot at closing verification |
| --- | --- | --- |
| `eynsham-dental` | `7659cb547483c24fdd0380f332d7928f249927dc` | blue |
| `white-hart-minster` | `515f31dd1f741f66a8ecb93b814e71533d0344c3` | blue |
| `bush-farm` | `bd7cc8439a9e236020750923d928e3679e58f5fc` | blue |
| `maggies-fish` | `ff4d7155724f590eae0778dcea0567959fe71ad6` | blue |
| `il-botanico` | `885858b85e08193a90fcd05bf4ba9f648bb72fb8` | green |
| `bank-house` | `c97b703035783c80dfb4c2ceaee98445b6f43eb6` | blue |
| `old-craft-barn` | `50a43bb30cdf39611a38f2204ea9f8d17a8911ce` | green |
| `small-talk-tearooms` | `4063decb7baf75a54de7d88d5e58cf1548783e35` | blue |
| `marthas-coffee` | `dbb1842a3c08c8a080972499960388d03c25b889` | blue |
| `blue-anchor` | `e9b88e50dac691cbd8a43e8ebf804e3a595e6907` | green |
| `claire-lewis` | `cdacaf46b8eac8e57dc385125aa96778d68460b6` | green |
| `woodstock-dental` | `d2087bce224ea345df179a493cda343642a63704` | blue |

No authoritative demo repository had a Git remote configured at closure, so the required GitHub push could not be performed. Production and both local long-lived branches nevertheless use the exact quality-tested commits above; no untested source was created during deployment.

### Additional demo-mode package record

All five additional packages passed strict integrity plus their full lint, typecheck, build, desktop/mobile browser, visual, three-run mobile/desktop Lighthouse and theme manifests. The Git-backed installed checkouts were committed at `5b64f43` (`bakewell-pudding`), `c03d21e` (`homedene-farm`), `51e9f33` (`michaels-malmesbury`) and `a31c20e` (`wallys-deli`). `star-inn-woodstock` and its matching workspace package have no Git metadata; their synchronized source passed the same gates, including the closing accessibility correction.

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

### Authoritative current demo fleet

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
12. Woodstock Dental — `woodstock-dental`, stamped and deployed during Phase 9

The authoritative release and outreach inventory is the twelve entries above. Do not infer the demo count from `/opt/vdplatform/workspaces`, because several of these twelve predate that packaging flow.

### Additional demo-mode workspaces

These later packages are not substitutes for the authoritative twelve, but receive the same safety controls and audits while present:

1. The Old Original Bakewell Pudding Shop — `bakewell-pudding`
2. Michael's Butchers, Bistro & Deli — `michaels-malmesbury`
3. Homedene Farm Shop — `homedene-farm`
4. The Star Inn, Woodstock — `star-inn-woodstock`
5. Wally's Deli — `wallys-deli`

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
