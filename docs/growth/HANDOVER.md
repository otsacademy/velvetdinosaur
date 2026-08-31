# Velvet Dinosaur — session handover

_Last updated: 2026-08-31_

## Where things stand

**26 demo websites are live** at `https://<slug>.velvetdinosaur.com`. This is the authoritative
fleet. The inventory is additive: every new demo must inherit the same demo-safety, authentication,
evidence and release gates and be added here.

**All 18 were emailed by Ian on 28 August 2026.** Every invite is unused as of 29 August. Prospect
invites were extended from 10 September to **30 September** so the promised 14 days runs from when
they are actually read after the bank holiday weekend — the links already emailed are unchanged,
only `expiresAt` moved. Original dates: `invite-expiry-backup-2026-08-28.json`.

Next review point for a second batch: **Thursday 3 September**, the first day with three clear
working days of exposure after the bank holiday.

`bun run demo:fleet` lists the fleet, but **only counts sites that have `demo/site-manifest.json`**.
A stamped site without one is invisible to it — `witney-podiatry` ran live and undisclaimed for
three days that way and was removed on 28 August (source archived in `docs/retired/`). To enumerate
what really exists, list `/srv/apps/*-blue` instead; most nginx confs are not world-readable, so
grepping vhosts under-reports.

| Business | Slug | Outreach status |
|---|---|---|
| The Old Original Bakewell Pudding Shop | `bakewell-pudding` | Emailed 28 Aug |
| Bank House, Hartington | `bank-house` | Emailed 28 Aug |
| Blue Anchor Inn / Spingo Ales | `blue-anchor` | Emailed 28 Aug |
| Bush Farm B&B | `bush-farm` | Emailed 28 Aug |
| Claire Lewis Hairdressing | `claire-lewis` | Emailed 28 Aug |
| Eynsham Dental Care | `eynsham-dental` | Emailed 28 Aug |
| Homedene Farm Shop | `homedene-farm` | Emailed 28 Aug |
| Il Botanico | `il-botanico` | Emailed 28 Aug |
| Maggie's Fish & Chips | `maggies-fish` | Emailed 28 Aug |
| Martha's Coffee + Kitchen | `marthas-coffee` | Emailed 28 Aug |
| Michael's Butchers, Bistro & Deli | `michaels-malmesbury` | Emailed 28 Aug |
| The Old Craft Barn | `old-craft-barn` | Emailed 28 Aug |
| Small Talk Tearooms | `small-talk-tearooms` | Emailed 28 Aug |
| The Star Inn, Woodstock | `star-inn-woodstock` | Emailed 28 Aug |
| Wally's Deli | `wallys-deli` | Emailed 28 Aug |
| The White Hart, Minster Lovell | `white-hart-minster` | Emailed 28 Aug |
| Woodstock Dental Practice | `woodstock-dental` | Emailed 28 Aug |
| Higher Farm B&B, Malpas | `higher-farm-malpas` | Emailed 28 Aug |
| The New Inn Hotel, Lechlade | `new-inn-lechlade` | Stamped 29 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; prospect email info@newinnhotel.co.uk) |
| Contour & Co, Leek | `contour-leek` | Stamped 29 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; prospect email jok1904@googlemail.com) |
| Bubbleton Farm Shop, Tenby | `bubbleton-tenby` | Stamped 29 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; prospect email tom@bubbleton.co.uk — note the site also publishes tom@bubbleton.wales) |
| Hair Lounge, Chipping Norton | `hair-lounge-chipping-norton` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/29-hairlounge-chipping-norton; prospect email hairloungechippingnorton@yahoo.co.uk) |
| Corn Street Dental, Witney | `corn-street-dental` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/11-corn-street-dental-witney; prospect email dentist@cornstreetdental.co.uk) |
| Sima's Beauty, Witney | `simas-beauty-witney` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/09-simas-beauty-witney; prospect email simaflp@aol.com) |
| Jamesons Accountants, Witney | `jamesons-witney` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/33-jamesons-witney; prospect email advice@jamesons.co.uk) |
| Cotswold Dental Wellness, Chipping Norton | `cotswold-dental` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/07-cotswold-dental-chipping-norton; prospect email info@cotswolddentalwellness.co.uk) |

## The bench

42 verified prospects in `prospect-ledger-2026-08-24.md`. There are **56 harvested content packs**
in `docs/mocks/` — 18 built, **38 unbuilt** — named by priority:

- `COMP-*` — already built (7 of the folders; the 4 newest demos predate the renaming)
- `01`–`41` — the design queue in priority order
- unnumbered — no usable website (Facebook-only or dead domain); walk-in pitch only

Each pack holds full-page screenshots of every page of the prospect's current site, a `photos/`
folder, and a `summary.md` with social links and the verified evidence of what's wrong with their site.

## How a new demo gets built

1. **Ian designs it** in Claude Design (claude.ai/design), one project per prospect.
2. **Claude pulls the design** with the `DesignSync` tool — no zip export needed. Ian just sends the
   project URL. (Load the tool first: ToolSearch `select:DesignSync`.)
3. **Claude ports it** into a site package: every design section becomes an editable Puck block,
   every view becomes a seeded CMS page. Never custom React routes — the prospect must be able to
   edit every page in `/edit`, that is the whole sales promise.
4. **Claude stamps and releases it**, confirms demo mode and noindex, runs all manifest gates, and
   only then mints the prospect's invitation link.

### Batch 3 reconciliation (30 Aug evening — audited against the Claude Design account)

**Shipped 30–31 Aug** (built in 4 parallel Claude sessions; all live and in the fleet table above):
| Site | Design project | Evidence pack |
|---|---|---|
| Jamesons Accountants, Witney | `52460787-3c10-42e5-8cef-d194f981efa6` | `docs/mocks/33-jamesons-witney` |
| Sima's Beauty, Witney | `55227a47-c790-478b-bed2-c8859616dc6f` | `docs/mocks/09-simas-beauty-witney` |
| Corn Street Dental, Witney | `30d7cc1d-b6c9-4723-a410-5e1c26adecb5` | `docs/mocks/11-corn-street-dental-witney` |
| Hair Lounge, Chipping Norton | `8ceef699-6a71-4604-b355-a7217ab4a813` (the one WITH files — `0a8c19bd…` is an empty duplicate) | `docs/mocks/29-hairlounge-chipping-norton` |

**Designed but NOT built — only ONE remains** (Cotswold Dental Wellness shipped 31 Aug):
| Site | Design project | Design files | Evidence pack |
|---|---|---|---|
| Salutation Inn, Pembrokeshire | `4371b0c3-f5ce-4b0f-b954-21a21a404531` | `Home.dc.html` (39KB, single view) | `docs/mocks/17-salutation-inn-pembrokeshire` |

Dead projects to ignore: `af74a16b…` ("Website redesign request", empty), `0a8c19bd…` (Hair
Lounge duplicate, uploads only), `125f0a2a…` (Bubbleton duplicate, uploads only),
`483cd019…` (mislabeled Bush Farm design — Ian confirmed 29 Aug it is not to be built).

**Full procedure: `docs/growth/DEMO-BUILD-PLAYBOOK.md` — read it start to finish before
porting anything.** It encodes every gate failure from the 29 Aug builds (demos 19–21) as a
rule; a site built to it should pass the stamp in one cycle. The `demo-port-pipeline` memory
file holds the same lessons as history. **Next batch: Ian plans 6 more sites** — inputs per
site are his Claude Design project + the `docs/mocks/` pack + the prospect email.

### Port hardening learned on the New Inn stamp (29 Aug pm — template carries all three fixes)

- **`.scope a { color: inherit }` is banned.** A scoped anchor reset outranks every
  single-class link colour (`.xx-nav-link`, `.xx-btn-*`) — New Inn's header nav shipped
  dark-on-dark and axe only caught it once the header sat over a solid background. Preflight
  already inherits anchor colour at element level; the scoped reset may set `text-decoration`
  only.
- **Hero animations must settle in ≤ ~2.5s.** Design-prototype cinematics (44s crossfade
  cycles, 20–26s Ken Burns) keep Lighthouse's Speed Index "visually incomplete" — New Inn
  desktop perf sat at 0.88–0.91 until the hero went static. Long/infinite hero motion is a
  gate-killer class, not a tuning issue.
- **demo-safety.spec.ts now waits for hydration** before the public-action click (synthetic
  cancelable submit probe). On a cold image-optimizer cache the browser's 6-connection pool
  queues JS chunks behind `/_next/image` for seconds; pre-hydration clicks fell through to a
  native form navigation. The 18 already-live sites carry the older spec (all passed today) —
  if one ever flakes on "public action guard", copy the template spec in.
- **Keep the box quiet during Lighthouse batches.** A parallel `bun install` + typecheck cost
  ~10 desktop perf points on an otherwise-green run.

## Outreach

- Email Tue–Thu 6:30–8:00am; call 48 hours later, in that sector's quiet window
  (pubs 10–11:30am, cafés 2:30–4pm, B&Bs 10:30am–3pm, dentists 11–12 or 2–4pm asking for the
  practice manager, salons Tue–Thu 10–11am).
- Ian's approved email template is his own words — do not rewrite it. Ian sends the emails himself.
- Never send passwords: the sign-up link is bound to the prospect's email and they set their own.

## Next demo candidates (assessed 28 Aug)

38 of the 56 packs are unbuilt, but **no design comps exist for any of them** — every Claude Design
project that is a prospect is already built, so each new demo starts at the design stage. The other
gate is a contact email; about a third of the local bench is phone-only.

Ranked on genuine photographs at 1000px or wider, excluding logos and theme graphics:

1. **The New Inn Hotel, Lechlade** — https://newinnhotel.co.uk — info@newinnhotel.co.uk
   Six hero images at 2048x1024, the best assets on the bench, and local (~20 miles). Ledger notes
   "fragmented booking frames", which lands on the included booking engine. **Caveat:** the harvester
   failed on six PDF menus, so food and drink content is missing — same gap that left Michael's
   menus empty.
2. **Bubbleton Farm Shop, Tenby** — https://www.bubbleton.wales/ — tom@bubbleton.co.uk
   Most real photographs (21), eight clean page captures, and glamping + cottage strands that suit
   the booking engine. Photos top out at 1240x826, so no true hero image.
3. **Contour & Co, Leek** — https://contourleek.com/ — contourleek@yahoo.co.uk
   Salon, so appointments fit the booking engine (Claire Lewis is the precedent). **Caveat:** its
   large files are mostly graphics — logos, nail swatches, a cuticle diagram — not photography.

Sharpest opener if leading on the fault rather than the photos: **Jamesons Accountants**,
https://jamesons.co.uk, advice@jamesons.co.uk — footer still links to an `sg-host.com` staging domain.

Beware raw file counts when ranking packs: New Inn's "107 photos" is 36 thumbnails at 150x150 and
only 13 real photographs, and pixel-width alone counts a 1234px logo as usable imagery. The emails
for Contour and Bubbleton are **not** in the research packs — they were found published on the live
sites, so other "no email" entries may be reachable the same way.

## Fleet monitoring

`vd-demo-fleet-health.timer` checks all live demos every 15 minutes
(`bun run demo:health`, or `scripts/demo-fleet-health.ts`). Per site it asserts HTTP 200, the
robots `noindex` tag, and the demo safety banner — the two markers whose absence made
`witney-podiatry` an undisclaimed indexable demo. It discovers the fleet from `VD_DEMO_SITE=true`
in each `.env.production`, so unlike `demo:fleet` it cannot be blinded by a missing
`demo/site-manifest.json`.

It emails only on **change** — a site newly broken or newly recovered — so an ongoing outage does
not repeat every 15 minutes. State lives in `/var/lib/vd-demo-fleet-health/state.json`; deleting it
re-alerts for anything currently down. Flags: `--dry-run`, `--force`, `--json`, `--strict`.

This exists because **`bakewell-pudding` served 502 for about 13 hours on 28–29 August** — its blue
slot was started at 18:27 and SIGTERM'd at 18:32 by an interrupted slot switch, then never
restarted, the day after its prospect was emailed the link. Nothing noticed. `demo:fleet` reads
manifests on disk and had no idea. If a demo 502s, check
`systemctl status vd-<slug>-<slot>.service` first — the alert email names the unit.

## Prospect click tracking (added 2026-08-29)

The recipient-tracking machinery (built 28 Aug, ~10 h *after* the batch-1 emails went out untracked)
is now wired into outreach. Flow: mint a per-prospect HMAC link
(`bun run demo:recipient-links -- --site=<slug> --name="<Name>" --email=<email>`, registry
`/var/lib/vd-demo-activity-digest/recipients.json`) → prospect clicks
`https://<slug>.velvetdinosaur.com/visit/<token>` → 307 + cookie → nginx activity log → the
2-hourly digest attributes it by name and keeps a cumulative **Campaign status** table (ever
clicked / browsed / signed in per prospect). A bare fetch reports as `redirect only`; only
interaction + dwell counts as a human visit.

- **Every future stamp is tracked automatically**: `new-demo.sh` prints `PROSPECT_TRACKED_LINK`
  (and fails the stamp if the build lacks the `/visit` route); `mint-invite.sh` prints a
  `TRACKED_INVITE` wrapper. Email the tracked variants, never the bare domain — rule now in
  `outreach-playbook.md`.
- **Batch 1 follow-ups**: 18 links minted (expiry 30 Sep, emails recovered from each site's
  invites collection) in `docs/growth/tracked-links-2026-08-30.md` (supersedes the 08-29 pack —
  same recipients, refreshed expiry, plus the email-open pixel column). **The `/visit` route is live on
  bakewell-pudding only** — the other 17 live builds predate it, so their links show the 404 page
  until that site is released once (one-command enablement documented in the pack; run it just
  before bumping that prospect). The digest warns loudly if the registry is ever empty again.

## Known platform faults (none are site bugs — do not chase them per-site)

- **Slot-port collisions across sites (CRITICAL class).** The installer/port allocator has assigned
  the same port to slots of different sites. On 29 Aug this put the `ra` production site's blue
  slot and `bakewell-pudding`'s green slot both on **3013**: when the design-rules rollout switched
  bakewell to green, nginx sent `bakewell-pudding.velvetdinosaur.com` to whichever process held the
  port — **a prospect's demo served the Rising Dust Adventures motorcycle site for ~18 minutes**
  (10:17–10:35, fixed by re-pointing the upstream to blue and permanently moving bakewell-green to
  port 3213 via a systemd drop-in + `VD_DEPLOY_GREEN_PORT` in all three env copies). Two more
  duplicates are armed but dormant (both idle slots): `vd-thebrave-green` = `vd-michaels-malmesbury-blue`
  (**3017**) and `vd-velvetdinosaur-green` = `vd-ots-sauro-poc-blue` (**3019**). Whichever deploys
  second loses its port and nginx serves the other site. Fix the allocator in the installer and
  re-port the idle slots before any thebrave or velvetdinosaur deploy. Audit with:
  `for u in /etc/systemd/system/vd-*-{blue,green}.service; do echo "$(basename $u) $(sudo grep -o 'PORT:-[0-9]*' $u)"; done | sort -t- -k2 | uniq -D -f1`.


- ~~**`new-demo.sh` cannot finish a stamp.**~~ **Fixed 2026-08-29.** The abort at `visual:update`
  was a **stale `.next`**, not a bad test. `sync:editor --site` writes newer editor sources into the
  site after the build, so the canvas interaction guard was missing from the built output and the
  inert-link test failed. Proven on star-inn-woodstock: mobile 549 failed, then passed after a
  rebuild with nothing else changed. `new-demo.sh` now runs `rm -rf "$W/.next"` before building.
  The other test (line ~319) was already fixed upstream by template commit `521c53d`. The template
  suite is 10/10 green. **No live site was ever affected** — every live slot contains the guard.
- **A failed stamp now says so.** `new-demo.sh` had `set -euo pipefail` and no trap, which is why a
  half-deployed site could sit live silently. It now tracks stages and, on any failure after the
  installer, prints what state the domain is in, warns not to send the link, and gives the commands
  to finish or take it down.
- ~~**Leftover smoke pages.**~~ **Cleaned 2026-08-29.** A fleet-wide editor-smoke run on 25 Aug
  (23:13–23:20 UTC) left 4 test pages (`smoke-desktop`, `smoke-mobile`, `smoke-direct-desktop`,
  `smoke-direct-mobile`) in 17 prospects' CMSes, visible in their page lists. All 68 were backed up
  to `/opt/vdplatform/backups/smoke-page-cleanup-2026-08-29/` and deleted; fleet re-verified 18/18
  healthy afterwards. **This cannot recur:** `lib/pages.ts` now routes all page operations to an
  in-memory store whenever the editor-smoke token is active, so smoke runs never touch Mongo —
  proven empirically (two suite runs on star-inn-woodstock persisted zero pages). No asset debris:
  the upload test uses mocked asset routes. Note: former smoke URLs still answer HTTP 200 with a
  404 body — that is how every missing slug behaves on these sites (the PPR shell flushes before
  the DB lookup, the same core trait as the meta-description fault below), not a leftover.
- **Every Puck inner page emits its meta description in `<body>`, not `<head>`** — Lighthouse SEO 92
  on all 18 sites. The slug route's `generateMetadata` awaits a DB lookup, so the PPR shell's
  `<head>` flushes first. Never caught because every `lighthouserc.*.json` audits only `/` and
  `/about`, and `/about` is a static template route, not a Puck page. Fix belongs in core.
- ~~**`visual:test` hardcodes port 43000**~~ **Fixed 2026-08-29:** the template's `visual:test`,
  `visual:update` and `playwright.config.ts` now use 31900/31901, below the ephemeral range
  (32768–60999). Sites stamped before this still carry the old ports; pass `PLAYWRIGHT_PORT` when
  running gates in them.
- **`retire-demo.sh` leaves three things behind**: the nginx vhost (it looks for
  `<slug>.velvetdinosaur.com`, the files are `<slug>.conf`, so the domain then serves a **502**),
  the `-current` symlink and systemd units, and the Mongo database (`dropDatabase` fails — the
  site's user is readWrite; drop every collection instead). See the `demo-ops-scripts` memory.
- **`new-demo.sh` mints its admin invite to `eugenia@ontourism.academy`** (hardcoded, line 55) but
  Ian signs in as `ian.wickens@ontourism.academy`, so every stamp produces an admin link that
  expires unused.

## Open items

- **Demo auto-delete is manual.** Nothing sweeps expired demos on a timer, so the advertised
  "deleted after 14 days" needs running by hand — and `retire-demo.sh` is incomplete (see above).
  With invites now expiring 30 September, the first sweep falls due mid-September.
- **Bellissimo Hair is listed in the ledger as a dead site but has no URL in the research.** Worth
  checking: a genuinely dead website is the strongest opener on the bench.
- ~~**`new-demo.sh` must be run with `< /dev/null`**~~ **Fixed 2026-08-29:** the script now feeds
  the installer `< /dev/null` itself, and the failure trap turns any stall into a loud abort with
  recovery instructions. The external workaround is no longer needed (and remains harmless).
- **`quality --all` flakes** with a Chrome interstitial under load; individual gates pass. Retry.
- **Verify the served commit.** Follow each site's documented local release flow and check the live
  health endpoint before declaring a deployment complete.
- **Admin invites on all 18 live demos are dead.** `new-demo.sh` minted them to
  `eugenia@ontourism.academy`; it now uses `ian.wickens@ontourism.academy` (fixed 29 Aug), but the
  existing 18 were stamped before that. Re-mint any you need with
  `mint-invite.sh <slug> ian.wickens@ontourism.academy`. Prospect invites are unaffected.
- ~~Company number pending~~ **Done 2026-08-25:** Velvet Dinosaur Web Design Ltd, company no. 17419510.
  `lib/legal-identity.ts` drives every registered-identity surface.
