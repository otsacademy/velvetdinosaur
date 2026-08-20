# Sauro CMS UI Parity & Quality Plan

**Status:** Draft for approval
**Date:** 2026-08-20
**Owner track:** Product/UI. Complements `fleet-upgrade-plan.md` (dependency/orchestration track); this plan maps to that plan's Phases 4–5 territory but does not wait for the fleet engine. All work here is prepared and released through each repository's own documented flow.

## 1. Goal

One Sauro CMS experience — the same workspace shell, editor components, and interaction quality — on every instance across this server, with ASAP as the reference implementation. Once parity holds, review the UI once, fix the clunky/unfinished areas once, and let improvements propagate through the same pipe instead of being re-done per site.

### Non-goals

- No fleet-engine automation is required or built here; adoption is curated, per-site, through normal reviewed commits.
- No dependency upgrades beyond what parity itself requires (baseline is already uniform; see §2.1).
- Site-owned features are preserved, not homogenized (§3).

## 2. Verified current state (2026-08-20)

### 2.1 Dependency baseline (measured from each checkout's package.json)

| Site | next | better-auth | puck | platejs |
|---|---|---|---|---|
| velvetdinosaur, asap, ra, pyanal, thebrave | 16.2.12 | 1.6.26 | @puckeditor/core 0.22.3 | 52.0.17 (ra: n/a) |
| ots-sauro-poc | **16.1.1** | **1.4.10** | @puckeditor/core 0.22.3 | 52.0.17 |

Parity is therefore a UI-code problem, not a framework-migration problem. `ots-sauro-poc` is offline (units disabled, no nginx route), so its stale baseline is tolerated but must be resolved by the Wave 0 keep-or-archive decision (§5).

### 2.2 UI drift vs ASAP (hash-compare of working trees)

| vs ASAP | `components/edit` (126 files) | `components/admin` (143 files) |
|---|---|---|
| velvetdinosaur | 16 identical · 28 differ · **82 missing** | 71 identical · 60 differ · 12 VD-only |
| ra | 5 identical · **103 missing** | 5 identical · 125 differ |
| thebrave | 9 identical · **81 missing** · 23 own | 5 identical · 127 differ |
| pyanal | 86 identical · 39 differ · 1 missing | 77 identical · 64 differ · 32 own |
| ots-sauro-poc | near-exact clone (116/126) | near-exact clone (142/143) |

### 2.3 What the "missing" files actually are

ASAP's surplus is not decoration — it is entire working CMS workspaces plus the newer chrome:

- **Workspaces absent from VD's real admin:** event-registration (13 files), support (12), calendar (11), newsletter (11), event-editor (7), inbox (5), media-library additions (2), plus pagination, move-page dialog, editor loading screen, workspace scope notice.
- **Chrome:** `components/admin/admin-workspace-shell.client.tsx` (521 lines) and `sauro-cms-badge.tsx` do not exist in VD at all.
- **Critical product inconsistency:** VD's public `/inbox`, `/calendar`, `/newsletter`, `/support` routes are **demo mockups** (`components/demo/*`, dummy data, non-persistent) marketing features that VD's own production admin does not actually have. ASAP has them for real. Parity makes the demo honest.

### 2.4 The installer template is the stalest copy

`/opt/vdplatform/template/components/edit` has **26 files** (ASAP: 126); `components/admin` has 133. Every newly installed site is born with the old UI. The template is a first-class parity target (Wave 2). Caveat from the fleet plan: `/opt/vdplatform` is not Git-backed; template refresh must record source repo + SHA provenance and must not become an unversioned fork point.

### 2.5 Site-owned surfaces that must survive adoption

| Site | Owned surfaces (preserve verbatim) |
|---|---|
| velvetdinosaur | `app/admin/fleet`, `app/admin/observability`, work/stays editors, the entire `components/demo` layer |
| asap | approvals, review-links, review-progress, users admin, journal/awards editorial |
| thebrave | specialized video editor (own edit files) |
| pyanal | 32 admin files ASAP lacks (designer-site tooling) |
| ra | to be identified in Wave 0 (only 5 admin files match ASAP — lineage predates the current shell) |

### 2.6 Checkout states (2026-08-20)

asap `develop` (clean except `next-env.d.ts`); ra `develop` clean; pyanal `develop` (only `.state.json`); thebrave on feature branch `codex/ops-path-cleanup-20260419` — its `develop` lives in `/srv/apps/thebrave-release`; velvetdinosaur `main` clean; ots-sauro-poc `develop` clean, **no git remote**.

## 3. Definitions

- **Sauro core:** the file set that must be byte-identical (or parameterized-identical) across sites: workspace shell, edit-index framework, the shared workspaces (inbox, calendar, newsletter, support, events, media library), Puck editor shell, theme editor UI, dialogs/utilities.
- **Site-owned:** listed in §2.5; never overwritten by sync; may consume core APIs.
- **Reference implementation:** ASAP `develop`. Improvements land there first (or, once Wave 2 completes, in the template source) and propagate outward.
- **Demo layer (VD only):** `components/demo/*` mirrors the core for marketing; after each core change, the demo is updated to match reality — it never leads it.

## 4. Mechanism

Near-term: **curated adoption by copy, verified by a parity checker** — no new infrastructure. Long-term (fleet plan Phase 5): extract the core as a shared package once it has stabilized through one full parity cycle; do not extract mid-drift.

Two small tools make this honest (built in Wave 0):

1. `scripts/sauro-parity-check.ts` — reads a checked-in manifest (`docs/platform/sauro-core-manifest.json`: path → role {core, site-owned, template-only}) and reports per-site identical/differs/missing against the reference. Runs read-only; exits non-zero on core drift.
2. **Fleet dashboard tile:** the existing `vd-fleet-producer` already reports Puck drift to `/admin/fleet`; add a `sauro-ui-parity` producer metric so drift is visible continuously, not rediscovered by audit.

Preparation rules (inherited from the fleet plan's spirit): work in a worktree or on a clean checkout at the documented source branch; never prepare on thebrave's feature-branch checkout (use its `develop`); every site's own quality manifest gates its own adoption commit; nothing deploys without its documented release flow.

## 5. Waves

### Wave 0 — Catalog & decisions (~1 day)

1. Build `sauro-core-manifest.json` by classifying every file in `components/{admin,edit,puck,theme}` + `app/admin` across all six sites: core / site-owned / stale-copy / intentional-divergence. The §2.2 hash data is the starting point; ra and thebrave "differs" need eyeballing before any file is declared stale.
2. Feature-level map: which workspaces exist, per site, for real (not demo).
3. Build `sauro-parity-check.ts` against the manifest.
4. **Decision (Eugenia):** ots-sauro-poc — keep as offline rehearsal target (then it stays in the sync set, deps bumped opportunistically) or archive (then it leaves the tables entirely). Recommendation: keep until Wave 4 completes, as the only zero-risk rehearsal of the adoption diff; archive after.

**Exit:** manifest committed; parity checker runs green on ASAP vs ots-sauro-poc and correctly reports the known VD gaps.

### Wave 1 — Velvetdinosaur pilot (~2–4 days)

The biggest gap, our own checkout, and the CMS's home site.

1. Adopt the core per manifest: workspace shell + badge, edit-index framework, and the real workspaces (inbox, calendar, newsletter, support, events, event-registration, media-library additions). Wire routes: today's top-level demo routes stay demo; the real workspaces mount under the admin surface as ASAP does.
2. Preserve VD-owned surfaces (§2.5) and re-point them into the new shell.
3. Reconcile the demo layer: demo screens updated to depict the adopted real UI.
4. Gates: `bun run quality --all` + `quality:validate`; editor acceptance (§7); visual snapshots updated intentionally; Lighthouse 100/100 where the manifest demands it (public routes should be untouched — verify no regression from shared chunks).
5. Release per VD's real production model: blue/green (`bun run deploy:blue-green`) — production runs `vd-velvetdinosaur-blue.service`; the CLAUDE.md manual/in-place note is superseded by the observed slot model (see memory/deploy-flow-reality); confirm at release time.

**Exit:** VD's real admin offers every core workspace; parity checker shows VD core-identical to reference; demo layer depicts real features; all gates green; deployed and attested.

### Wave 2 — Template refresh (~½ day, after Wave 1 settles)

1. Copy the adopted core into `/opt/vdplatform/template`, recording `{source repo, SHA, date}` in a provenance file inside the template.
2. Run the template's own build/verify path if one exists; otherwise stamp a scratch install and boot it.
3. Add the template to the parity checker's site list so it can never silently rot again.

### Wave 3 — Near-parity sites: pyanal, ots-sauro-poc (~1 day)

pyanal: adopt the small delta (39 differing edit files, 1 missing), preserve its 32 designer-site files; its develop flow + gates. ots-sauro-poc per the Wave 0 decision.

### Wave 4 — Divergent sites: ra, thebrave (~2–4 days each)

These are re-platformings, not syncs — almost every admin file differs.

- Wave 0's eyeball classification decides adopt/preserve per file.
- thebrave: prepare against its `develop` (in `thebrave-release`), video-editor acceptance mandatory, released through its own flow.
- ra: identify what its admin actually is first; its 25-file edit tree may predate workspaces entirely.

### Wave 5 — UI review & feature work (starts after Wave 1; full effect after Wave 4)

The point of the whole exercise. On the unified core, one structured review instead of five:

1. **Screen inventory** from the manifest (every admin/edit surface).
2. **Screenshot pass** — logged-in Puppeteer capture of every surface, mobile + desktop, on the reference site.
3. **Heuristic scoring** per screen: navigation clarity, consistency (spacing/typography/tokens), empty states, loading/skeleton behavior, feedback on actions (saves, errors), keyboard/focus behavior, mobile usability. "Clunky and unfinished" becomes a ranked defect list with screenshots.
4. Fix in the reference, propagate via parity sync, verify with the checker + visual snapshots.
5. Then open the feature backlog (new capabilities land in the core, arrive everywhere).

## 6. Ordering rationale

Review-then-sync was considered and rejected: polishing five divergent copies quintuples every fix forever. Sync-then-review means each improvement is paid for once. The only review work pulled earlier is anything that would change *structure* (navigation/shell layout), to avoid adopting a shell twice — flag structural findings during Wave 1 rather than after Wave 4.

## 7. Editor acceptance checklist (every adopting site)

- Authenticate; open `/edit` and the admin workspaces.
- Load representative existing Puck data; select, edit, add, move, delete blocks; save and reload.
- Render the same data through public/preview routes.
- Exercise each adopted workspace against fixture data (never production content on non-VD sites).
- Site-owned flows still work (VD fleet dashboard; thebrave video editor; ASAP review tooling untouched).
- Mobile + desktop editor snapshots captured; `visual:update` only on explicit intent.

## 8. Guardrails

- Never modify a dirty or feature-branch operator checkout; use the documented source branch, worktree if needed.
- Site-owned paths are never overwritten; manifest is the authority, and changing a file's classification is a reviewed commit.
- ASAP is production: adoptions *from* it are read-only; changes *to* it (Wave 5 fixes) go through its own develop flow and gates.
- Template refresh records provenance; no template edit without a source SHA.
- No deploy on red gates; no auto-blessed visual diffs; each site's release flow is its own (VD blue/green, others per their overrides).
- ots-sauro-poc does not go online while its dependency baseline is stale.

## 9. Decisions required

1. ots-sauro-poc: rehearsal-then-archive (recommended) or keep long-term?
2. Where does the core's source of truth live after Wave 2 — stay "ASAP develop" or move to the (to-be-Git-backed) template/control repo? Recommendation: ASAP remains reference until the fleet plan's Phase 0 control-repo decision lands, then transfer.
3. Wave 4 scope for ra: full re-platform now, or park ra until after Wave 5 fixes (its admin is barely used)?
4. Package extraction trigger (fleet Phase 5): after one full parity cycle plus one propagated Wave 5 fix batch — confirm.
