# Demo build playbook — porting a Claude Design comp into a live SauroCMS demo

_Written 2026-08-30 after shipping demos 19–21 (new-inn-lechlade, contour-leek,
bubbleton-tenby) in one day. This is the reference for the agent building the next batch.
Read `docs/growth/HANDOVER.md` for business state and the `demo-port-pipeline` memory for
history; THIS file is the procedure. Follow it in order — every rule here was paid for with
a ~40-minute failed gate cycle._

## 0. The promise and the non-negotiables

A demo is a **pixel-faithful port** of one of Ian's Claude Design comps into a full SauroCMS
site at `https://<slug>.velvetdinosaur.com`. The sales promise is that the prospect can edit
**every page** in `/edit` — so every design section becomes a Puck block and every view a
seeded CMS page. **Never custom React routes for content.**

Non-negotiable at ship time:

- **Lighthouse 100/100** on mobile AND desktop, every category, `/` and `/about` (3 runs each).
- **Zero-diff visual suite** incl. `demo-safety.spec.ts` and `design-rules.spec.ts`.
- **Evidence audit (`demo:check`)** passes: no invented facts, sourced testimonials, valid manifest.
- **Demo safety**: noindex everywhere, disclaimer banner, public actions guarded (server 409s).
- Site lint runs with **warnings-as-errors** — one stray `<img>` or effect warning fails the gate.
- No code file over **600 lines**.

Division of labour: **Ian designs** (Claude Design, one project per prospect) and **Ian sends
every email himself in his own words**. You port, stamp, verify, and hand him the links.
Never contact a prospect. Never send passwords (invites are email-bound).

## 1. Inputs you need per site

1. **Claude Design project** — Ian sends the project URL/id and the `.dc.html` file name.
2. **Evidence pack** — `docs/mocks/<NN>-<slug>/`: full-page screenshots of the prospect's real
   site, `photos/`, `summary.md`. This is your ONLY source of facts.
3. **Prospect email** — for the tracked link, pixel, and invite. If the pack shows more than
   one published address, note both in the manifest and use the one Ian specifies.

## 2. Directory map

| Path | What |
|---|---|
| `/opt/vdplatform/template/` | The site template (copy this to start; carries all fleet fixes) |
| `/opt/vdplatform/workspaces/<slug>/design/` | Byte-exact `.dc.html` you pulled |
| `/opt/vdplatform/workspaces/<slug>/site/` | The package you author (installed by the stamp) |
| `/opt/vdplatform/scripts/new-demo.sh` | The stamp: DNS→install→seed→gates→release→links |
| `/opt/vdplatform/scripts/mint-invite.sh` | Prospect invite (+tracked wrapper +email pixel) |
| `/srv/apps/<slug>/` | The installed site after stamping |
| `/srv/apps/velvetdinosaur/` | This repo: digest/health/link scripts, growth docs |
| `docs/mocks/<NN>-<slug>/` | Evidence pack |
| `docs/growth/tracked-links-<date>.md` | The link pack Ian emails from |
| `/var/lib/vd-demo-activity-digest/recipients.json` | Recipient registry (never hand-edit) |

Reference implementations — **copy these patterns, do not invent**:

| Site | Steal from it |
|---|---|
| `workspaces/new-inn-lechlade/site` | Menu pages as nested editable pages, MenuGroup arrays, buffet tiers, chrome with topbar-scrolls/header-sticks |
| `workspaces/contour-leek/site` | Price tables (rows as `Name \| £x \| £y` textarea lines), filterable gallery + lightbox client, policies pages, FeatureSplit (one flexible block reused 5 ways) |
| `workspaces/bubbleton-tenby/site` | Shop grid with client-side category filter, honest booking-prototype forms, nested page (`stay/cottage`), photo-row block reused across pages |

## 3. Pull the design (byte-exact)

Use `mcp__claude-design__read_file` (load via ToolSearch if deferred). Text files arrive
entity-escaped and windowed; oversize results auto-save VERBATIM to tool-results files —
assemble via the `lines=` attributes and verify with `wc -c` against the design's size.
**Never retype/hand-relay binary or base64 — it corrupts.** For images use the local evidence
pack instead (`DesignSync get_file` base64 caps at 256KiB). Save to
`/opt/vdplatform/workspaces/<slug>/design/<name>.dc.html` and **read 100% of it** before
writing any code — content data usually lives in a `renderVals()` script block at the bottom.

## 4. Verify every fact against evidence (before authoring)

Open the pack screenshots with the Read tool and check the design's content against them:

- **Prices row-by-row** (the audit and Ian's credibility both depend on this).
- Phone, email(s), address, opening hours (watch: designs invent "6 days a week" when the
  screenshots show 5 — fix the design's copy, not the evidence).
- **Numbers, ratings, awards, history claims**: keep only what the prospect's own site
  publishes. A Google rating shown on THEIR contact page counts (bubbleton's 4.7★/604).
  A design stat with no source (contour's "4.95 rating") gets replaced with an evidenced
  fact, not shipped.
- **Testimonials**: only quote text the prospect publishes. If unverifiable, reframe (rename
  the prop away from `quote/review/testimonial` and make it a statement) or drop it.

## 5. Scaffold

```bash
S=/opt/vdplatform/workspaces/<slug>; mkdir -p $S/site
cp -a /opt/vdplatform/template/. $S/site/
rm -rf $S/site/node_modules $S/site/.next $S/site/.env.local
mkdir -p $S/site/public/demo-photos   # copy the pack photos you map (short names ok)
```

## 6. Author the package

File set (pattern identical across all three references; `xx` = 2-letter scope like `ni`/`co`/`bb`):

- `components/<design>/<design>-fonts.ts` — `next/font/google` only, exposed as CSS vars
  (`--xx-font-serif/-sans`) + a `<design>FontClass`.
- `components/<design>/fields.ts` — **every text/textarea Puck field must set
  `contentEditable: false`** (inline editing swaps strings for JSX and crashes `.split()`).
- `components/<design>/photos.ts` — `/demo-photos/...` path constants.
- `components/<design>/shared.tsx` — `text()`/`lines()` guards (Puck hands back non-strings
  mid-edit), Kicker, Slot placeholder, Fill (EditableImage cover), Button variants.
- `components/<design>/content.ts` — ALL verified copy/data. Big tables as
  `Name | £a | £b` multiline strings so one textarea edits a whole table.
- `components/<design>/*.client.tsx` — headers/forms/filters. **Never spread props across
  the client boundary** (Puck injects a function-bearing `puck` prop) — pass explicitly.
  No setState-in-effect (lint error); DOM writes via refs/ResizeObserver are fine.
- `app/<design>*.css` — 2–3 files, each <600 lines, imported from `site-design-frame.tsx`.
- `components/site/site-design-frame.tsx` — imports the CSS, applies `${fontClass} xx`.
- `components/blocks/store/<design>-*.tsx` — blocks: exported `XX_DEFAULTS` per block +
  `ComponentConfig`; register ALL in `curated.ts`.
- `components/<design>/block-defaults.ts` — `BLOCK_DEFAULTS` map (type → defaults). Seeded
  content must carry full props: **Puck `defaultProps` only apply on editor insert.**
- `scripts/seed-<design>-pages.ts` — chrome (SITE_HEADER_SLUG/SITE_FOOTER_SLUG) + one entry
  per page; `block()` merges BLOCK_DEFAULTS under overrides, ids `xx_<page>_<nn>`;
  `sanitizeData → saveDraftPageData → Page.updateOne (path or $unset) → publishDraftPageData`.
  Nested pages: slug `parent-child`, path `parent/child`. Register `"seed:<design>"` in
  package.json AND `seedCommand` in the manifest.
- `demo/site-manifest.json` — see §9. `app/(site)/[...slug]/page.tsx`: remove `pt-20 md:pt-0`
  for sticky-header designs (keep only for fixed headers).

### Forms and commerce affordances (demo honesty)

Contact/newsletter forms POST to `/api/contact` (server 409s on demos; the client guard
intercepts and explains). Booking/availability panels that the real business can't fulfil
online are **honest prototypes**: no network call, message says "this is a design prototype,
nothing has been sent — call or use the contact form". Decorative "Add →" shop affordances
are spans, not buttons. Drop fake pagination; write an honest count line instead.

## 7. Fleet design rules (enforced by `design-rules.spec.ts` + `demo:check`)

- **Sticky menu**: header must stay visible while scrolling. Puck renders chrome bare, so the
  header block's root shell needs the **chrome-host pattern**: `.xx-chromehost { display: contents; }`.
  Root scope uses `overflow-x: clip` — **never `hidden`** (kills sticky).
- **Scroll motion**: `data-reveal` attrs on section wrappers +
  `@supports (animation-timeline: view())` keyframes that animate **transform ONLY — never
  opacity** (mid-scroll opacity blending fails the Lighthouse contrast audit). Hero/LCP gets
  `data-reveal-load` (on-load) only. A `@media (prefers-reduced-motion: reduce)` block that
  kills all of it is mandatory.
- **Hero animations settle in ≤ ~2.5s, one-shot.** The design prototypes ship 20–44s Ken
  Burns/crossfade cinematics; they hold Speed Index at 4s+ and cap desktop perf at ~0.91.
  Convert to a short settle (`scale(1.05)→1, 2.2s ease-out both`). No infinite hero motion,
  no CSS-background slide stacks (they also eager-download every slide).
- **Never `.xx a { color: inherit }`.** It outranks every single-class link colour
  (0,1,1 beats 0,1,0) — New Inn's nav shipped literally dark-on-dark. Preflight already
  inherits anchor colour; the scoped reset may set `text-decoration` only. Button/nav colour
  rules that must win: prefix with the scope (`.xx .xx-btn-primary`).
- **Hero image gets fetch priority**: the eager Fill passes
  `optimized={{ fill: true, sizes: '100vw', priority: true, fetchPriority: 'high' }}` to
  EditableImage — `loading="eager"` alone leaves LCP ~1.2s cold and costs perf points.

## 8. Accessibility traps with worked numbers (each cost a gate cycle)

- **4.5:1 for text <18.7px** — the designs' muted tokens usually measure 3.2–4.4:
  deepen them (`#A8836A→#866750` on cream; brass `oklch(0.55…)→oklch(0.51…)`; 4.4:1 FAILS).
  On-dark cream text: alpha ≥ .55. Compute, don't eyeball; verify computed colours via a
  playwright probe if unsure.
- **Star glyphs count as text** (`★★★★★`): deep gold `#8a6200` on sand, `aria-hidden` the run.
- **No `<button>` inside `<a>`** (axe nested-interactive) — style the anchor as a chip.
- **`aria-label` must contain the visible text** (axe label-content-name-mismatch): a brand
  link whose visible text is the name must not carry `aria-label="Home"`.
- **`<img>` needs the eslint escape only in a lightbox-style raw view**; everywhere else use
  EditableImage (also: `@next/next/no-img-element` is an error here).
- Logos in tiles: plain `EditableImage` with contain-styling — NOT the cover Fill.

## 9. `demo/site-manifest.json` — exact schema (validated by `scripts/demo-evidence.ts`)

- `factCheck.verifiedAt`: **in the past and <24h old AT STAMP TIME** (refresh before re-runs;
  a future timestamp also fails). `factCheck.reviewer` required.
- `facts` must include ALL of: `tradingStatus, telephone, email, address, openingHours,
  prices, awards, events, socialLinks`. Extra keys allowed (unvalidated).
- `status` only `verified | not-published | not-applicable` (`verified` requires a `value`).
- **Every `sources[]` entry must be an http(s) URL** — cite local pack files in the
  `description` prose instead.
- Any block prop named `quote/review/testimonial` (≥20 chars) needs a `claims[]` entry of
  kind `review`/`testimonial` whose text contains (or is contained by) the prop text, with an
  http `sourceUrl` — or rename the prop and reframe the copy.
- `seedCommand`: `bun scripts/seed-<design>-pages.ts`.

## 10. Pre-stamp local checks (in the workspace — catches 90% before the 40-min gate)

```bash
cd /opt/vdplatform/workspaces/<slug>/site
bun install && bunx tsc --noEmit && bun run lint   # lint = zero warnings
bun run build                                      # must be clean
# sync the current template specs in case the template moved since your scaffold copy:
cp /opt/vdplatform/template/tests/visual/demo-safety.spec.ts tests/visual/
```

## 11. Stamp

```bash
/opt/vdplatform/scripts/new-demo.sh <slug> "<Business Name>" <prospect-email> \
  /opt/vdplatform/workspaces/<slug>/site
```

Run in background (it's 45–60 min: DNS → installer → seed+media+`demo:check` → visual+LH
gates → blue/green release → handover → link mints). **Keep the box quiet during gates** —
a parallel `bun install`/tsc costs ~10 desktop perf points. **Serialize stamps** (shared
playwright port 31900, shared CPU).

On success it prints: `PROSPECT_TRACKED_LINK` (email THIS, never the bare domain),
`PROSPECT_EMAIL_PIXEL` (Gmail: Insert photo → Web Address (URL)), `REVIEW_URL`, and the
done line. Failure modes seen so far:

- **certbot lock** ("Another instance is running") — transient; just re-run the stamp
  (installer is idempotent).
- **`demo:check` manifest errors** — fix per §9 in BOTH workspace and `/srv/apps/<slug>` copies,
  refresh `verifiedAt`, re-run.
- **LH a11y/perf < 1.0** — read the actual failing audit from
  `/srv/apps/<slug>/.lighthouseci/{mobile,desktop}/*.report.json` (newest by mtime; extract
  failing auditRefs). Fix root cause (§7–8), never relax a threshold. Re-run.
- **Stamp died after release** — the trap prints exact recovery commands; follow them.
- **quoted `MONGODB_URI`** when running site scripts by hand: strip with `tr -d '"'`.

## 12. Post-stamp checklist (all of it, every site)

```bash
# live verification
curl -sI https://<slug>.velvetdinosaur.com/ | grep -iE "x-robots-tag|x-vd-demo-site"  # noindex + demo
for p in "" <each-page>; do curl -s -o /dev/null -w "/$p %{http_code}\n" https://<slug>.velvetdinosaur.com/$p; done
curl -s -o /dev/null -w "%{http_code}\n" https://<slug>.velvetdinosaur.com/visit/x     # 307
cd /srv/apps/velvetdinosaur
bun run demo:fleet -- --strict --require <slug>
bun run demo:health                                    # N/N healthy incl. velvetdinosaur-hub
/opt/vdplatform/scripts/mint-invite.sh <slug> <prospect-email>   # tracked invite + pixel
bun scripts/demo-recipient-links-batch.ts              # regenerate the dated link pack
```

Then: add the fleet-table row in `docs/growth/HANDOVER.md`
(“Stamped <date> — NOT yet emailed (…pack file…; prospect email …)”), eyeball the live home
page with a playwright screenshot (sticky header y=0 after scroll, hero renders), and report
the tracked link + pixel to Ian. **You never email the prospect.**

## 13. Budget expectations

Per site, when the package is authored to this playbook: ~30 min authoring review + one
~50-min stamp. Each avoidable gate failure adds ~40 min — the three sites on 29 Aug took
4/3/3 cycles learning the rules above; a site built to this document should take **one**.
For a 6-site batch: serialize; expect roughly a working day of wall-clock, mostly waiting
on gates — author site N+1's package while site N's stamp runs (pure file authoring only;
nothing CPU-heavy during LH).
