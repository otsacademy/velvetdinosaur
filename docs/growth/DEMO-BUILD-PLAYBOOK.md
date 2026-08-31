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
  **NEVER put an asset path in one of those pipe-delimited lines** — this killed a stamp seven
  minutes in (number-47, 2026-08-31). `check-demo-integrity.ts` flags any page-data string
  where `value.startsWith('/demo-photos/')`, but the media importer rewrites
  `/demo-photos/x.jpg` → `/api/assets/file?key=…` **only when the path is the ENTIRE string
  value**. A gallery row like `/demo-photos/exterior.jpg | 1128 | 1050 | alt | caption` is
  therefore counted but never rewritten, and the stamp dies on
  `N local demo-photo references remain`. It is a perfect blind spot: the images still render
  (the public files remain), the page looks right, and nothing local catches it — the count is
  exactly 2 per affected block, one in `draftData` and one in `publishedData`. Pipe-delimited
  textareas are right for text tables and wrong for anything containing an asset path: give the
  path its own field, i.e. an array field with `image`/`width`/`height`/`alt`/`caption`
  sub-fields. The prospect also gets a real asset picker instead of editing raw paths.
  Confirmed at source: `scripts/import-site-media.ts:46` rewrites only on an exact map hit
  (`replacements.get(value)`), while its line 59 and `scripts/check-demo-integrity.ts:79` count
  anything that merely `startsWith('/demo-photos/')`. The counter and the rewriter therefore
  disagree on exactly the set of compound values, and the disagreement only surfaces at stamp
  time. **`/design-assets/` carries the identical asymmetry** — same rule applies.
  **Cheapest preflight, no scratch mongo needed** — a compound value is a path followed by a
  delimiter, so this must return nothing:
  `grep -rnE "/demo-photos/[^'\"]*[ |,]" components/ scripts/ --include=*.ts --include=*.tsx`
  For belt and braces, also walk a scratch-seeded DB's `draftData`/`publishedData`/`data` and
  assert each `/demo-photos/` string matches `^/demo-photos/[A-Za-z0-9._-]+$` — the stamp runs
  `demo:check` with `--require-media --require-current-facts --max-fact-age-hours=24`, which is
  stricter than the bare command you probably ran locally. Measured: popty-cara 28 refs / 28 bare
  / 0 compound; bodalwyn 120 / 120 / 0; number-47 **2 compound** before the fix and 68/68/0 after.
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
- **Delete the template's `app/about/` route** (found on jamesons-witney, 2026-08-30). It
  shadows the `(site)/[...slug]` catch-all for `/about` but sits OUTSIDE the `(site)` group,
  so it renders the seeded about page with **no SiteDesignFrame, no design CSS and no
  header/footer** — bare blocks at viewport size. `/about` is one of the two LH-gated URLs:
  the unstyled hero image fails `image-aspect-ratio` + `image-size-responsive`
  (best-practices 0.93, all runs). Earlier demos "passed" only because they never seeded an
  `about` slug — their live `/about` is a chrome-less empty 200 (nav never links it).
  Check for other slug collisions too: any `app/<your-seeded-slug>/` directory wins over the
  CMS route. After deleting, `rm -rf .next` in BOTH copies before rebuilding.
- **Reserved-slug lists live in TWO files with different ownership** (jamesons, 2026-08-31):
  `lib/site-reserved-paths.ts` `RESERVED_EXACT_PATHS` holds `about`, `team`, `contact` (+ ASAP
  leftovers) — it is **site-owned**: delete the entries you seed (a blocked slug 404s once
  `app/about` is gone, killing the LH SEO gate). But `lib/page-paths.ts`
  (`RESERVED_FIRST_SEGMENTS` holds `contact`) is **core-synced: the stamp's preflight runs
  sync-editor-baseline in enforce mode and silently reverts your edit** (log says
  `Changed: 1 ~ lib/page-paths.ts`) — an edit that passed your local test dies before the
  gates. Don't fight it: **seed `contact-us` instead of `contact`** (matches most prospects'
  real URL anyway) and point every CTA/footer href at it. If a re-seed renames a slug,
  delete the stale Page doc from Mongo — the old slug otherwise lingers half-broken.
- **A catch-all-served /about fails LH SEO (meta-description 0)**: the `(site)/[...slug]`
  route's `generateMetadata` is dynamic, so under PPR its tags stream into the `<body>` — the
  Lighthouse gatherer reads `<head>` only → SEO 0.92 on a gate-audited URL (jamesons take-5;
  the fleet's known "inner pages SEO 92" behavior, newly fatal on /about). Fix: create
  `app/(site)/about/page.tsx` INSIDE the group — a static `metadata` export (title +
  description from verified copy) + `PublishedDoc('about')` body (the home-route pattern, so
  /edit still owns the content) — and KEEP `about` in RESERVED_EXACT_PATHS so the catch-all
  never competes. Verify the PPR shell: `.next/server/app/about.html` head must contain the
  meta description, the title, and the design CSS chunk.
- **Dress-rehearse before stamping** (cheap vs a 40-min gate cycle): mirror the stamp's rsync
  (`rsync -a --delete --exclude='.git' --exclude='.env*' --exclude='.state.json'
  --exclude='node_modules' --exclude='.next' workspace/site/ /srv/apps/<slug>/`), `rm -rf
  .next && bun run build`, `bun run start -- -p 3299`, then curl EVERY seeded slug checking
  200 + the design CSS chunk + a design class, and screenshot / and /about. The gates only
  audit `/` and `/about` — a broken /team or /contact-us ships silently without this.
  **Warning:** that `--delete` rsync clobbers installer-generated root files the workspace
  doesn't carry — `sauro-core.json` above all. Losing it makes `demo:fleet --strict` error
  FLEET-WIDE, which kills every OTHER stamp's release-stage verification (it broke two other
  sites' stamps on 2026-08-31). After any manual rsync into /srv, restore it (copy the
  `{revision, source, syncedAt}` shape from any healthy install; same revision hash fleet-wide)
  and confirm `bun run demo:fleet -- --strict` exits 0.
  Second dress-rehearsal side effect: **the stamp's installer restores template routes into
  /srv BEFORE your package rsync runs** — if your rehearsal left a NEW route there that
  shadows a template path (e.g. your `app/(site)/about/` vs the template's restored root
  `app/about/`), the installer's own build dies in seconds on Next's "two parallel pages
  resolve to the same path" (jamesons take-6). Before re-stamping after a rehearsal, remove
  such group-routes from /srv and let the stamp's rsync `--delete` do the swap in order.
  **This is NOT limited to manual dress rehearsals — it bites after any FAILED STAMP that got
  as far as the rsync, which is the far more common case** (popty-cara take-2, 2026-08-31:
  take-1 died at the Lighthouse gate long after rsyncing, so take-2's installer found both
  routes and failed at `install` in ~2 minutes with
  `You cannot have two parallel pages that resolve to the same path. Please check /(site)/about
  and /about.`). Because every re-stamp of a route-moving package hits it, make the cleanup
  automatic in your launcher rather than remembering it. **Check all THREE paths — the bare dir
  AND both blue/green slots.** Cleaning only `/srv/apps/<slug>` is not enough and will let the
  next run fail identically: popty-cara take-3 was already in preflight with
  `/srv/apps/popty-cara` clean but **both slots still colliding**, and would have died the same
  way had a peer not checked the slots.

```bash
for base in "/srv/apps/$SLUG" "/srv/apps/$SLUG-blue" "/srv/apps/$SLUG-green"; do
  for d in "$base/app/(site)"/*/; do
    n=$(basename "$d"); [ -d "$base/app/$n" ] && rm -rf "$d"
  done
done
```

  Safe to run mid-preflight; the installer restores template routes and rebuilds afterwards, and
  the package rsync reintroduces the group route in the correct order. Leave `app/X` alone — the
  rsync `--delete` removes it as part of the swap. Quick audit of all three:
  `for d in /srv/apps/$SLUG{,-blue,-green}; do echo "$d root=$([ -d "$d/app/about" ] && echo YES || echo no) group=$([ -d "$d/app/(site)/about" ] && echo YES || echo no)"; done`

  **The test for whether a re-stamp is clean is not "did the previous run fail" but "did it get
  as far as rsyncing the package".** A run killed during `install` leaves nothing behind; a run
  that died at the Lighthouse gate forty minutes later leaves the collision in all three paths.

  The failure is at least cheap and unmistakable — it aborts at `install`, minutes in rather
  than forty, and names both conflicting paths.

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
- **EVERY image needs `optimized`, not just the hero** (confirmed on THREE packages
  independently the same morning — number-47-grassington, popty-cara and teddington-cheese,
  2026-08-31. Every package that copied the reference `Fill` helper has it; assume the shipped
  sites do too until checked).
  `EditableImage` renders a plain `<img>` unless it is handed the `optimized` prop; only that
  prop reaches `OptimizedImage`, which needs `fill`+`sizes` (cover images) or `width`/`height`
  (fixed) to route through `next/image`. Without it you ship the **original file at full size —
  no AVIF/WebP, no srcset**. The shared `Fill` helper in the reference packages passes
  `optimized` ONLY on its eager branch, so a design that marks one hero eager silently ships
  every other photo raw: popty-cara measured **9 of 10 images raw, ~1.86MB on the home page,
  zero `srcset` in the HTML**; number-47 measured 684KB with 599KiB of flagged savings; and
  teddington-cheese measured **22 raw images on its home page and 52 on its shop page**, again
  with zero `srcset` anywhere — the bigger the catalogue, the worse it scales.
  Fix the helper once — always pass `optimized={{ fill: true, sizes }}`, and add
  `priority: true, fetchPriority: 'high'` only for the page-opening image — then give each
  placement a real `sizes` (full-bleed `100vw`; half-width split `(min-width: 900px) 46vw, 92vw`;
  3-up card grid `(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 92vw`) so eager images
  don't over-fetch. **Verify in the RENDERED DOM, not with curl.** On a PPR site the streamed
  shell may contain no `<img>` at all, so `curl / | grep -c 'src="/demo-photos/'` returns 0 both
  before and after the fix and reads as a false pass (teddington hit exactly that). Scroll the
  page in a real browser first — lazy images never resolve `currentSrc` otherwise — then assert
  that every `<img>` whose `getAttribute('src')` starts with `/demo-photos/` is one of your
  deliberate exceptions, and that every other image's `currentSrc` contains `/_next/image`.
  If you also grep the HTML as a secondary check, note React emits the attribute as **`srcSet`**
  and `grep -c` counts matching LINES — on single-line HTML `grep -c 'srcset='` reports 0 against
  a page carrying 9 of them; use `grep -oiE 'srcset=' | wc -l`. All of this is invisible to the
  a11y/best-practices/SEO probes.
  **On a RELEASED site curl DOES work — but only with the post-import marker** (added
  2026-08-31 after measuring the live fleet). `media:import` rewrites every `/demo-photos/...`
  path to the media library, so the pre-import grep returns 0 on a released URL whether the
  site is healthy or broken — a check incapable of failing, in the one place you most want
  the truth. Use instead:
  `curl -s <url> | grep -oE 'src="/api/assets' | wc -l`   → **raw originals, want 0**
  `curl -s <url> | grep -oE 'src="/_next/image' | wc -l`  → optimized
  Measured this way on sites released 30 Aug–31 Aug: **cotswold-dental home 18 of 19 images
  raw; powys-country-house 16 of 17 raw** — both had passed all four gates at 100, and
  bath-street-dental passed both Lighthouse gates with the defect still in place. So this is
  confirmed shipping, not merely latent, and **no gate will ever catch it**: the raw images
  are lazy and below the fold, so LCP and Speed Index never see them.
  Root cause worth knowing: the template ships **no** `Fill` helper — `EditableImage` takes
  `optimized` as an optional prop and defaults to a raw `<img>`. The bug therefore propagates
  by package-cloning (this playbook's own "copy the reference packages" advice), not through
  the template, so fixing one site does not stop the next clone inheriting it. Fix your
  helper at authoring time, and re-check any package you cloned from. Measured end to end on teddington-cheese: home
  **2.93MB → 0.53MB**, shop (50 products) **7.16MB → 0.51MB, a 14× reduction**, /about
  0.31MB → 0.18MB, with 23/23, 52/52 and 3/3 images through `/_next/image` afterwards.
  Non-cover images don't need a `fill` box to be optimized — use the fixed branch
  (`optimized={{ width, height, sizes }}`), which preserves natural aspect (no crop, no
  letterbox) and so never touches the `image-aspect-ratio` audit; a header logo is the typical
  case (number-47's went 54KB PNG → right-sized WebP this way). Genuinely leave raw only what is
  small, lazy and below the fold where the bytes don't justify the churn (popty-cara's two award
  certificates, 153KB total) — and never trade a green audit for a few KB by forcing such an
  image into a cover box, since only `cover` fills are exempt from `image-aspect-ratio`.
- **A page-opening block's image is that page's LCP element.** Blocks reused mid-page are
  lazy, but the same block placed first must load eagerly — give the block an explicit
  "page-opening" prop rather than hard-coding it (popty-cara's `imagePriority`), and set it in
  the seed for whichever page leads with it. Confirm by finding
  `<link rel="preload" as="image" … fetchPriority="high">` in the served HTML.

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

## 9b. Template traps found on the Corn Street port (2026-08-30) — check every site

- **Legacy `app/about/page.tsx` at the app ROOT** (outside the `(site)` group) shadows a seeded
  /about and renders it WITHOUT SiteDesignFrame — a 200 with completely unstyled content.
  Delete `app/about/` when the design has an /about page.
- **`/contact` cannot be a page path.** `lib/page-paths.ts` is Sauro-core canonical
  (`sync/editor-baseline.json` `allow` list): the stamp's `sync:editor` restores the template
  version over any site edit, and it reserves `contact` as a first segment. Use `/contact-us`
  (usually the prospect's own URL shape anyway). `lib/site-reserved-paths.ts` IS site-owned —
  remove `about` from its stale `RESERVED_EXACT_PATHS` when you seed /about. Everything under
  `app/(site)/**` is in the `deny` list (site-owned, never clobbered).
- **A reserved path renders CHROME-ONLY AT HTTP 200 — the worst failure mode we have.**
  `RESERVED_EXACT_PATHS` in `lib/site-reserved-paths.ts` still ships the origin (Scholardemia)
  template's academic routes: `advisory-board, board, chapters, connect, contact, fellowship,
  members, members-list, team`. `isSitePathBlocked()` sends them to `notFound()` — but under PPR
  the 200 shell has already committed, so you do NOT get a 404. You get header + footer with an
  empty `<main>`. A page that is published, has content in Mongo, and previews correctly in
  `/edit` renders as NOTHING live, with no error in the journal.
  **No gate can see it:** Lighthouse audits `/` and `/about`, visual covers `/` plus one route,
  `demo:check` validates evidence not routes. Bath Street's `/team` shipped blank through all
  four gates at 100/100 (2026-08-31).
  **TWO OWNERS — trimming the site file does NOT unblock every path.** `isSitePathBlocked()`
  calls `isReservedPath()` FIRST, and that reads the **core-owned** `lib/page-paths.ts`
  (`editor-baseline.json` `allow` list), whose `RESERVED_FIRST_SEGMENTS` blocks
  `contact, install, legal, stays` + robots/chrome segments. Editing that file is pointless —
  the stamp's `sync:editor` enforce pass reverts it. Only the paths listed in the site-owned
  `lib/site-reserved-paths.ts` (`team, board, members, chapters, fellowship, journal, news,
  events, awards, projects, …`) are fixable per-site.
  So: **`/team` is site-fixable; `/contact` is not.** For `/contact` the fix is to seed the page
  as `contact-us` and repoint the nav (what Bath Street does), or change Sauro core.
  **Rule:** trim `RESERVED_EXACT_PATHS` to paths a hardcoded route in THIS app actually serves —
  check with `find app -name page.tsx`; normally that is `about` alone. Do it in the workspace
  package AND before release, then verify live:
  ```
  curl -s $URL/$path | grep -c '<section'    # 0 = chrome only, page is blank
  curl -s $URL/$path | grep -c '<h1'         # 0 = chrome only
  ```
  Byte size lies — chrome alone is ~38KB and looks like a real page.
  **Check EVERY nav link this way after release, not just the audited URLs.** The 2026-08-31
  fleet sweep found 8 sites serving a blank page linked from their own navigation, six of them
  on `/contact`: blue-anchor /journal, and /contact on bush-farm, eynsham-dental, marthas-coffee,
  small-talk-tearooms, wallys-deli, woodstock-dental.
- **Inner-page meta descriptions stream into `<body>` under cacheComponents.** The catch-all's
  dynamic `generateMetadata` (it awaits `connection()`/DB) resolves after the PPR shell's
  `<head>` has closed, so title+description land in the body where Lighthouse's head-scoped
  audits can't see them — `/about` scores meta-description 0 (SEO 0.90). Fix: make
  `generateMetadata` PURE-STATIC (an IO-free map of path → {title, description}, titles
  mirroring the seeded ones); `generateStaticParams` enumerates the real paths at stamp-build
  time (build runs after seed), so each path prerenders its own head. `dynamic = 'force-dynamic'`
  is NOT an option — the build rejects route segment config under `nextConfig.cacheComponents`.
  The full /about decision table (batch consensus, 2026-08-31): (a) keep the template's static
  `app/about` → its head inherits the root layout description and SEO passes, but the page
  renders CHROME-LESS (outside the `(site)` group) and no gate catches that; (b) serve /about
  via `[...slug]` with the stock dynamic generateMetadata → guaranteed meta-description 0;
  (c) delete `app/about`, serve via `[...slug]` with the static map → head metadata AND full
  chrome. Always ship (c).
- **Footer tel/email links fail `tap-targets`** as a stacked 16px inline pair (every page,
  SEO 0.85–0.99). Make them block anchors with ≥12px vertical padding.
- **Image natural size vs rendered size (mobile best-practices 0.93–0.96, cotswold).** Two
  audits bite: `image-size-responsive` (natural px must roughly cover displayed px × DPR —
  a 120×47 logo upscaled in the header fails) and `image-aspect-ratio` (a landscape source
  rendered into a portrait `<img>` slot fails). `object-fit: cover` fills (EditableImage via
  the Fill helper) are exempt from the aspect audit — raw `<img>`/badge/logo placements are
  not. Pre-check with a file read: every image's natural px ≥ ~2× its displayed CSS px on the
  AUDITED pages (`/` and `/about`), and no landscape source in a portrait slot outside a
  cover fill. Prospect publishes nothing bigger → quality-upscale the asset.
- **The installer runs its own Lighthouse smoke check on the DEFAULT build** before the
  package is even rsynced. "Running Lighthouse 3 time(s)" early in the stamp log (or scores
  in `.lighthouseci/` with old dates) is NOT your gate — the real gate runs inside
  `bun run quality` after seed+media. Two sessions misread this on 2026-08-30/31.
- **NEVER `pkill -f next-server` on this box** — dozens of production sites run here. Kill by
  cwd: `for pid in $(pgrep -f next-server); do case "$(readlink /proc/$pid/cwd)" in *<slug>*)
  kill $pid;; esac; done`.
- **pgrep watchers self-match.** A loop like `while pgrep -f "new-demo.sh <slug>"` matches its
  own shell's command line and never exits. Match the full path with a bracket:
  `ps -eo args | grep -c "bash /opt/vdplatform/scripts/new-demo[.]sh <slug>"`.

## 10. Pre-stamp local checks (in the workspace — catches 90% before the 40-min gate)

```bash
cd /opt/vdplatform/workspaces/<slug>/site
bun install && bunx tsc --noEmit && bun run lint   # lint = zero warnings
bun run build                                      # must be clean
# sync the current template specs in case the template moved since your scaffold copy:
cp /opt/vdplatform/template/tests/visual/demo-safety.spec.ts tests/visual/
```

Worth 15 extra minutes when anything non-trivial changed: seed into a throwaway Mongo DB
(installer/lib/mongodb.sh has the admin creds to mint a scratch user), `PORT=3299 bun run
start`, playwright-screenshot every page (scroll through first — fullPage capture misses
lazy images), click the interactive bits (menus, accordions, tabs), and run `bun run
demo:check` (exactly two media errors should remain; the stamp's media import clears them).
This preview caught an unstyled /about, an invisible navy-on-navy mobile menu pill and a bad
hero crop before they could cost gate cycles. Drop the scratch DB and `.env.local` after.

**Lighthouse never opens a menu, accordion or tab**, so any of them can ship broken with all
four gates at 100. Script the interaction instead of trusting a screenshot: open the panel,
assert every row is visible and ≥24px tall, assert `aria-expanded` flips, and compute real sRGB
contrast per row by compositing the row's own colour over its first *opaque* ancestor background
(applying the WCAG large-text threshold from measured font-size/weight). A reusable
implementation is `/opt/vdplatform/workspaces/popty-cara/check-mobile-menu.mjs`
(`bun check-mobile-menu.mjs <baseUrl> <screenshotPath>`); only the class names at the top are
site-specific. Note it must live where `playwright` resolves — inside the site dir, or symlink
`site/node_modules` next to it, or `bun` aborts with "Cannot find package 'playwright'".

**Several comps have no mobile treatment at all** — not a broken one, an absent one. Popty
Cara's shipped a single `overflow-x: auto` nav row with `scrollbar-width: none`: at 375px only
the first link was visible and the primary CTA sat off-screen behind a suppressed scrollbar.
Pixel parity with the comp would mean shipping that, on the device most prospects open an
emailed link with. Add the fleet burger below ~860px and leave desktop untouched.
**Verify the preview server is YOURS, not merely alive.** "Responds 200" and "is my build" are
different claims, and the failure is silent in the dangerous direction: on 2026-08-31 two
sessions collided on :3299, and the loser's `bun run start` exited 1 on EADDRINUSE while the
shell still looked successful — it was about to grade screenshots of *another site*. Ports 3299
and 3294 are both contended. So: `fuser -k <port>/tcp`, confirm free with `ss -ltn | grep <port>`,
start the server, poll for HTTP 200 rather than a blind `sleep`, and then **check ownership**:

```bash
PID=$(ss -ltnp | grep ":$PORT " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2)
[ "$(readlink /proc/$PID/cwd)" = "$SITE" ] || { echo "wrong server on $PORT"; exit 2; }
```

**Assert geometry per breakpoint, not just screenshots.** Two real mobile chrome bugs on
teddington-cheese were invisible in full-page captures and only fell out of measurement: a
`flex: 0 0 auto` brand block 345px wide pushed the menu toggle to x=512 on a 390px viewport —
and because the design scope sets `overflow-x: clip` the toggle was *unreachable*, not merely
off-screen, so the mobile nav was inoperable; and a topbar phone number was clipped by 8px at
390 and 38px at 360. **Do NOT rely on `documentElement.scrollWidth === clientWidth` — on this fleet it is
structurally blind.** The design rule mandates `overflow-x: clip` on the design scope (`clip`,
never `hidden`, because `hidden` kills the sticky header), and `clip` suppresses the scroll
container entirely: overflowing content is silently CUT and `scrollWidth` never exceeds
`clientWidth`. The assertion passes on a visibly broken page. Measure real geometry instead,
**at widths below 375px** — 375 is the narrowest Lighthouse ever tests, so anything that clips
only at 320/360 is invisible to all four gates *and* to a visual baseline (which just records
the broken render):

```js
for (const el of document.querySelector('.xx').querySelectorAll('*')) {
  const r = el.getBoundingClientRect();
  if (r.width && r.height && r.right - window.innerWidth > 1) { /* clipped */ }
}
```

**Two false-positive sources to exempt, or the detector cries wolf on every design in the fleet.**
(a) A cover fill legitimately overflows its own frame — that is what `object-fit: cover` does —
and the frame's `overflow: hidden` contains it. Exempt **media only** (`img/video/picture/svg/
canvas`) that has a clipping/scrolling ancestor *between it and the design scope*: text or layout
cut inside such a box is still a real defect, and content cut by the SCOPE's own `overflow-x:
clip` has no such ancestor, so teddington's vanished column is still reported. (b) A hero's
one-shot settle animation is mid-flight at measurement time: popty-cara's detector reported a
2–3px overflow at 320/360/414 but not 375, purely because that one load took longer to reach
`networkidle` and settled first. Wait ~2.6s for the settle before measuring.
**The direction matters, though**: a settle that *shrinks* toward rest (`scale(1.05) → 1`) can
only ever over-report, so a CLEAN result measured mid-settle is strictly stronger evidence than a
clean result measured after it — don't discard a valid pass and re-run for nothing. It is the
opposite case, an element that *grows* into place (`scale(0.95) → 1`), where skipping the wait
risks a false negative, which is the genuinely dangerous direction.

**Sweep EVERY element under `[data-site-design-frame]`, not just the chrome.** A chrome-only
checker misses the worst case: teddington's opening-hours table rendered 380px wide, so at 360px
`clip` silently destroyed its entire **Richmond column** — every Richmond opening time, including
the only Sunday either shop opens. Three reasons nothing else caught it, and they generalise:
(1) the `scrollWidth` assertion passed, per above; (2) Lighthouse's narrowest form factor is
375px and the table broke at ~380px, so the gate viewport sat just inside the failure — and LH
has no clipped-content audit at any width; (3) **a full-page screenshot looks correct**, because
the clipped column is not squashed or overlapping, it is simply absent, and the remaining table
still fills the width. On a 360px phone the customer concludes that shop does not exist. This is
a content-integrity bug on a gate-audited URL that every automated signal reports as healthy.

Note the trap in our own design rules: wide content is supposed to scroll inside its own
`overflow-x: auto` container, and the scope is required to use `overflow-x: clip` — the second
rule silently disarms the symptom of violating the first. A descendant scroll container still
works under an ancestor's `clip`, so the fix is to wrap the wide element in its own
`overflow-x: auto` div AND tighten it to fit at common widths; give the wrapper `tabIndex={0}`,
`role="region"` and an aria-label, or the scrollable region fails its own axe rule.

The usual culprits are `grid-template-columns: repeat(auto-fit, minmax(Xpx, 1fr))` with X ≥ 300
and flex items carrying `min-width: 300px` — both overflow a 280px container at 320px. Fix with
`minmax(min(Xpx, 100%), 1fr)` and `min-width: min(Xpx, 100%)`: when the container is wider than
X these resolve to X, so desktop and the 375px gate width stay byte-identical (number-47 diffed
the desktop render and confirmed pixel-identical), and below X they clamp instead of overflowing.
Popty Cara had 2 such grids and 4 such flex items; number-47 had 19 grids and 22 clipped
elements on its home page alone.

> **A probe is only a rehearsal if the differences from the gate are ones you can ENUMERATE.**
> This is the rule that governs everything below, and it was learned twice in one afternoon —
> both times as a probe that went confidently green for reasons unrelated to the thing being
> tested:
> - popty-cara's probe passed `--chrome-flags="--no-sandbox"` and set `CHROME_PATH` to the
>   playwright chromium. Eight clean Lighthouse runs — while the gate, using neither, could not
>   launch Chrome at all on the same box, and failed ~40 minutes later.
> - bodalwyn's probe ran the real `bun run lighthouse` but without `MONGODB_URI`, so lhci's
>   `bun run start` served a site with no seeded content. It would have reported four green
>   scores for empty pages.
>
> In both cases the probe answered a question the gate was not asking, and neither author could
> have listed the differences before being shown them. Prefer invoking the gate's own command
> (`bun run lighthouse`, inheriting `lighthouserc.*.json`) over reconstructing its flags; mirror
> the stamp's ORDER too (seed → media → build → serve), since a probe that builds before seeding
> measures stale renders; and have the probe print what it resolved — browser path, server URL,
> page count — so a drift from the gate announces itself in the first second rather than after
> the scores.

**Local Lighthouse probing is worth doing, but ONLY with the gate's own settings** (2026-08-31,
measured on two packages independently). a11y / best-practices / SEO probe reliably at any time
and catch the audits that actually fail. **Performance does not**: the CLI's default Lantern
simulation reads catastrophically low on this box — same package, same minute, only the
throttling method differing, gave **0.83 (LCP 4.7s) simulated vs 1.00 (LCP 0.2s) with the gate's
`provided`**. A live, already-gate-passed fleet site measured 0.79 under Lantern too, so a low
simulated score proves nothing. Mirror `lighthouserc.*.json` exactly — including screen
emulation, not just the throttling method:

**Do NOT set `CHROME_PATH`, and `unset` it before stamping.** The box runs
`kernel.apparmor_restrict_unprivileged_userns = 1`, so Chrome gets a sandbox only if its binary
has an AppArmor profile. The snap chromium (`/usr/bin/chromium-browser`) has one; the
**playwright-downloaded** chromium in `~/.cache/ms-playwright/` does **not**. With a clean
environment `chrome-launcher` discovers the snap binary and launches headless with no special
flags — which is what 29 successful stamps have used. Export `CHROME_PATH` to a playwright
binary, launch a stamp from that shell, and `lhci` inherits it and dies on EVERY run with
`FATAL zygote_host_impl_linux.cc:128 No usable sandbox!` — roughly 40 minutes in, at the
Lighthouse gate, with an error that reads like a box problem rather than a shell-variable
problem. That killed popty-cara's take-1 on 2026-08-31. A local probe can mask it entirely by
passing `--no-sandbox`, so the probe passes and the gate fails on the same machine.
Leaving it unset also makes the probe a faithful rehearsal: same binary as the gate, rather than
a different experiment. **Never "fix" it by adding `--no-sandbox` to `lighthouserc.*.json`** —
that edits gate configuration to accommodate a shell variable and ships to every future site.

```bash
unset CHROME_PATH   # and launch the stamp itself via `env -u CHROME_PATH`
node_modules/.bin/lighthouse "http://localhost:<port>/" --only-categories=performance \
  --form-factor=mobile --screenEmulation.mobile --screenEmulation.width=375 \
  --screenEmulation.height=667 --screenEmulation.deviceScaleFactor=2 \
  --throttling-method=provided --skip-audits=is-crawlable \
  --chrome-flags="--headless --disable-dev-shm-usage"
# NOTE: no --no-sandbox. With CHROME_PATH unset this launches fine on the snap
# chromium, and omitting the flag is what keeps the probe honest — passing it
# would let the probe succeed on a binary the gate cannot launch at all.
# desktop: --preset=desktop --throttling-method=provided --skip-audits=is-crawlable
```

**How to recognise a Lantern artefact rather than a real regression:** a large LCP "Load Time"
phase attributed to an asset that serves instantly outside the harness. Bodalwyn's desktop probe
read perf 98 with LCP the only sub-1.0 weighted audit at "1.2 s" — of which a 934ms Load Time was
blamed on a 41 KiB image that `curl` returns in 2ms, with TTFB 128ms and load-delay 0. That ratio
is the simulation's, not the server's. Real LCP problems show up as load *delay* (a late-
discovered or lazily-loaded image) or as a genuinely large transfer; a trivially small asset with
a huge modelled Load Time is Lantern every time.
Probe on a QUIET box (1-min load < 4) or the numbers are noise either way, and ignore the PWA
category — it scores ~0.38 and is not in the gate's assertions. Even a pessimistic probe is
worth running: chasing a bad number is what surfaced the fleet-wide unoptimized-image defect
in §7 on both packages.

## 11. Stamp

**Serialize with other sessions first.** Two parallel stamps sabotage each other's Lighthouse
runs — the documented penalty is ~10 desktop performance points, against gates that assert
`minScore: 1` with no headroom.

**The queue only serialises stamps against EACH OTHER — the box also hosts non-fleet work, and
that quietly costs you the run.** Every detector in this section looks for `new-demo.sh` /
`run-stamp.sh` and is blind to anything else on the host. On 2026-08-31 a `scholardemia` build
unrelated to the fleet ran at **1143% CPU / 19.4GB RSS**, holding 12 of 16 cores and taking load
past 17.

Be precise about what this does and does not cause, because the two get conflated:

- **It does NOT stop the gate starting.** (popty-cara take-1 died at `-- gate: lighthouse --`
  with `ChromeLauncher ... ECONNREFUSED` *while* that build was running, and the contention was
  a red herring — the real cause was a `CHROME_PATH`/AppArmor problem in the launcher, see §10.
  Finding a plausible cause is not the same as finding the cause; read past the first error to
  the `FATAL` line.)
- **It DOES cost you score.** The gate runs `throttlingMethod: provided`, so LCP, TBT and Speed
  Index are measured against real wall-clock with no simulation to absorb contention. A box with
  most of its cores held inflates all three, the documented penalty is ~10 desktop points, and
  the assertions are `minScore: 1` with zero headroom. The gate starts, runs, and fails on
  numbers that have nothing to do with the site.

Mitigation: check for a CPU hog as well as load average before firing. **Use an instantaneous
reading, not `ps %cpu`** — that field is a lifetime average, so it over-reads a process that
saturated the box an hour ago and is now idle, and under-reads the build that started five
seconds ago. The second sample of `top -bn2 -d 1` is a true instantaneous figure; a threshold
around 150% works. Load average alone is also lagging (~1 minute), which is long enough to fire
into an already-saturated box. Interference can arrive *mid-run* too, which no pre-check
prevents — so budget for a re-run rather than assuming a green pre-check guarantees a green gate.
And simply message the other project's session: non-fleet neighbours are not adversaries and
generally have no idea their build is costing someone a 50-minute gate.

**Do these three things, in this order. Everything below is the evidence for why.**

1. **CLAIM the slot before you run** — atomic `mkdir /opt/vdplatform/workspaces/.stamp-claim`
   holding `slug`/`pid`/`since`, `trap`-removed on EXIT/INT/TERM, stolen only if the holder pid
   is dead **AND** the claim is >4500s old. (Dead-pid alone is not enough: it can steal in the
   window between another session's `mkdir` and its pid-file write, reintroducing the very race
   the claim removes. If your launcher `exec`s between stages the pid is preserved and stays
   valid; if it forks, record the new pid or your claim looks stale to everyone within seconds.)
   This is the only step that actually closes the race; steps 2–3 cannot.
2. **Use argv-SHAPE as the liveness backstop** (for a crashed session that never released its
   claim), counting RUNS not processes — see below.
3. **Gate on peers' preflight wrappers too**, not just `new-demo.sh`.

> **Coordination is only as good as its least-informed participant — and that argues for moving
> the claim INTO `new-demo.sh`.** On 2026-08-31 four sessions built progressively better
> detectors, agreed a queue, and adopted a shared claim; none of it bound the fifth session,
> which pre-empted a running preflight because its detector was stamp-only and it had never
> joined the conversation. Its check was not sloppy — ours was a convention it had no way to
> know about. **Every mechanism in this section except the claim requires the other party to
> have read this document. The claim does not: it just fails their `mkdir`.** So the durable fix
> is for `new-demo.sh` itself to take the claim at startup and release it on exit, protecting
> every session including those that never read any of this. Proposed, not implemented — that
> script is shared platform code and should not be changed mid-flight by one session. Until
> then, treat the queue as advisory and expect to be surprised.

**Do NOT gate on either of the methods this playbook used to recommend.** Both were measured
unsafe on 2026-08-31 and both produced real incidents that night:
substring greps of any form (bare / prefixed / anchored) and the
`find … stamp-*.log -newermt '-90 seconds'` sweep. Keep them, at most, as a second opinion. The
measurements are below so you can check rather than trust — but if you implement the first thing
you read in this section and stop, implement the numbered list, not the paragraphs after it.
(This warning exists because an earlier revision of this very section opened with the superseded
grep advice, and an agent reading top-down would have implemented it and stopped short of the
correction — which is close to how the collision below happened.)

**Evidence — why substring matching cannot work here** (2026-08-31, all three forms measured
against the same instant, all three wrong in some direction). The problem is that on a multi-session night every watcher's argv legitimately
mentions these paths, so any text pattern eventually matches a watcher instead of a stamp.
Measured simultaneously: bare `new-dem[o].sh` → 6 (all watchers, never clears — a gate on this
waits forever); prefixed `scripts/new-dem[o].sh|run-stam[p].sh` → 5 (one watcher false-positive,
wedges more slowly); anchored `^bash /opt/.../new-demo.sh [a-z]` → 0 **while a peer's preflight
was actually running** — a false-free that collides, which is the dangerous direction.
The two process kinds are structurally different, not textually different:

```
real:    argv = [bash, /opt/vdplatform/scripts/new-demo.sh, <slug>, …]
real:    argv = [bash, /opt/vdplatform/workspaces/<x>/run-stamp.sh]
watcher: argv = [/bin/bash, -c, "<long string mentioning the path>"]
watcher: argv = [grep, …] / [tail, -F, …]
```

So walk `/proc/*/cmdline` and require `argv[0]`'s basename to be an interpreter
(`bash|sh|dash|zsh`) AND `argv[1]` to end with `/scripts/new-demo.sh` or `/run-stamp.sh`. A
`-c` wrapper can never qualify (its `argv[1]` is `-c`); a grep or tail can never qualify (wrong
`argv[0]`); and it still catches a stamp launched via `sh` or a differently-shaped launcher,
because it anchors on neither the interpreter path nor the argv tail. Against that same instant
it returned exactly 1 — the live preflight, nothing else.
**Count RUNS, not PROCESSES.** `new-demo.sh` spawns `( cd … )` subshells that duplicate its own
cmdline, so a healthy single stamp shows 2–3 matching pids — and they appear *minutes* into the
run, so `elapsed=00:22` next to your own 7-minute stamp reads exactly like a peer launching into
you. Popty Cara hit this and was a step from yielding its slot to itself; the `ppid` pointed at
its own stamp. Two ways to collapse them, with different strengths:
**dedupe by slug** (emit `stamp:<argv[2]>` and `sort -u`) needs no parentage lookup and survives
a subshell whose parent has already been reaped — cheapest to write correctly in bash;
**filter by ppid** (drop any pid whose `ppid` is already in the match set) is exact, needs the
parent alive, and is the only one that still distinguishes two genuinely different runs of the
*same* slug — i.e. a re-run launched into its own live predecessor, which is exactly the accident
an auto-launcher makes. Implement both if you can; implement slug-dedupe if you implement one.

**Gate on the peer's PREFLIGHT wrapper as well as the stamp itself.** A launcher spends 6–15
minutes on rebuild + menu/axe/clipping checks + Lighthouse *before* it execs `new-demo.sh`, and
throughout that window a stamp-only check reads zero. Agree a predictable wrapper name across
sessions (`run-stamp.sh` works) so everyone can see everyone else's preflight.

**A CHECK is not a CLAIM — and no detector, however correct, closes the race.** This is the
central lesson of the 2026-08-31 night and it outranks every refinement above. Every detector
discussed here answers only *"is someone running right now?"*, and two launchers polling the
same instant both legitimately get "no" and both fire. That is exactly what happened at the end:
popty-cara started 11:55:41 and bodalwyn-aberystwyth 11:56:53 — **72 seconds apart, four sessions,
four correct-looking checks, still a collision.** Both packages asserted `minScore: 1` on four
categories with no headroom, against a documented ~10-point parallel-stamp penalty, so the likely
cost was both runs failing: ~100 minutes burned instead of 50.
Fix the class, not the instance: **write a claim before you run.** A lock file created before the
launch and removed after (`flock`, or an atomic `mkdir`/`O_EXCL` create carrying pid + slug +
start time), or an explicit announce-and-wait-for-ack over SendMessage, both close what a poll
cannot. Announce-and-ack is what actually held all evening between the sessions that used it;
the one collision came from two launchers that only polled. Keep the process check as the
liveness backstop for a crashed session that never released its claim — belt and braces, with
the claim as the belt.
**If you do collide:** resolve on an objective tiebreak that needs no negotiation — earliest
`ps -eo lstart` wins — and have the loser yield IMMEDIATELY, while both runs are still in the
first ~10 minutes of DNS/installer work. The installer is idempotent, so a yield there costs
minutes and re-runs clean; a kill later, mid-gate, is what has previously left a slot with no
`.next` and a live 502. **Kill by the RECORDED PID**, which the launching session always has —
not by `pkill -f "new-demo.sh <slug>"`, because that pattern also matches any peer's *watcher*
that embeds the same slug in its command line, so it can take out a bystander's monitor. Sweep
stragglers **by `/proc/$pid/cwd`** matching the yielding site's tree — never by process name, the
fleet shares them — and afterwards confirm the live slot still has `.next/BUILD_ID` (running is
not the same as restartable). Worked example: bodalwyn yielded from the 2026-08-31 collision by
killing its recorded pid then sweeping seven descendants under
`/srv/apps/bodalwyn-aberystwyth-blue` by cwd, with nothing killed by name and no bystander
touched.
The log sweep `find /opt/vdplatform/workspaces/*/stamp-*.log -newermt '-90 seconds'` has **two
independent false-free modes, and is not safe as a primary gate**. (a) It misses a stamp entirely
whenever a session tees its log into its own scratchpad instead of the workspace — a normal
launch style, and it returned ZERO while a powys stamp was mid-gate. (b) **It is blind for the
first seconds of every stamp**, before the log is created or flushed: the bodalwyn session ran
exactly this check at 11:55:56, *15 seconds after* popty-cara's stamp began, got nothing back,
and launched into the collision. Mode (b) is the more dangerous of the two because it fires
precisely in the window where two launchers are most likely to be polling — the moment one of
them starts.
Belt and braces: require zero matching processes AND no recent workspace stamp log AND
1-minute load < 4 (a stamp that has just exited leaves the box hot, and Lighthouse on a hot box
reads low).
**Gate on the peer's PREFLIGHT wrapper too, not just `new-demo.sh`** (hit from both sides on
2026-08-31). A well-built launcher spends 6–10 minutes on its own rebuild + Lighthouse batch
*before* it execs the stamp, and during that whole window `new-dem[o].sh` matches ZERO — so a
launcher gated only on that fires straight into a peer's build and gates. Name your stage-2
wrapper predictably, tell the other sessions what it is, and check for theirs:
`ps -eo args | grep -c "run-stam[p]\.sh"`. Two consecutive quiet reads ~30s apart also stop you
firing into a gap between a peer's stamp stages. The strongest form adds a queue gate: don't
fire until you have *observed* the predecessor's stamp start and then finish, so "box is quiet"
alone can never promote you ahead of someone who has not started yet — and keep the peer-wrapper
check anyway, because after a failed first attempt that observation is already satisfied and only
the wrapper check stops you landing in their retry. Coordinate the queue over SendMessage (locked order + exit pings),
and on multi-session nights hand the slot over with an **atomic launcher** (2026-08-31 pattern,
four sessions serialized): a background loop that fires your stamp only when the predecessor's
newest stamp log shows a terminal marker (`PROSPECT_TRACKED_LINK` or `new-demo[.]sh FAILED`)
AND no stamp log box-wide has been written for 90s. Keep the actual launch command in a
separate file the loop invokes — inlining it puts the literal command in the loop's argv and
self-matches. Guard the launch for the ambient certbot renewal timer: if the stamp exits
non-zero in under ~10 min and its log matches "Another instance of Certbot", retry once
automatically after ~15s (cost us a manual round-trip on corn-street take-3).

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
