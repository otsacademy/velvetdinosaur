# Velvet Dinosaur — session handover

_Last updated: 2026-09-04_

## Where things stand

**47 demo websites are live** at `https://<slug>.velvetdinosaur.com`. This is the authoritative
fleet. (Counted 6 Sep from `demo:fleet` — 47 entries — and cross-checked against `/srv/apps/*-blue`,
which lists 48 because `ots-sauro-poc` is a proof of concept, not a demo. The prose count had drifted
six behind the table; the table itself was also split in two by a stray blank line, so its last four
rows were rendering as a headerless table. Both fixed. The table now carries 46 rows — `halls-gardening`
is live and healthy but its row is owed by the session that stamped it.) The inventory is additive: every new demo must inherit the same demo-safety, authentication,
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
| The Salutation Inn, Pembrokeshire | `salutation-inn` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/17-salutation-inn-pembrokeshire; prospect email bwydbrenda62@outlook.com — the only address the site publishes). Invite + tracked link were minted 31 Aug by the fleet-audit session, not the build session. |
| Glamour and Glow, Witney | `glamour-and-glow` | Released 4 Sep — NOT emailed. **No prospect email exists**: the salon publishes none anywhere on its site, so there is no tracked invite to mint (phone/walk-in demo, like bath-street). Review link in the stamp log. Design comp `bcdd0f72-78e6-4a9a-a344-ad9075e31842`; pack docs/mocks/glamour-and-glow. Note the branded domain glamourandglowbeauty.co.uk is DEAD (NXDOMAIN) and their public address is a GoDaddy subdomain — the strongest opener on this row. |
| Portway Dental Care, Wantage | `portway-dental` | Released 4 Sep — NOT emailed. **No prospect email exists** (the practice publishes none), so no tracked invite. Review link in the stamp log. Design comp `32f0eb69-4aab-4bc9-9354-e9d350aa8475`; pack docs/mocks/portway-dental. **Read the Portman-group note before sending anything**: this is a group-owned practice, not the local independent the ledger describes. |
| Pokhara Delight, Witney | `pokhara-delight` | Released 4 Sep — NOT emailed. **Has a tracked link and pixel** (pokharadelicious@gmail.com); both in tracked-links-2026-09-04.md. Clean on the first stamp. Design comp `5743766a-1dd9-4a45-8620-352b402878f5`; pack docs/mocks/pokhara-delight. Opener: their live nav still shows the theme's placeholder "Menu Title / Single Link" four times, and their menu lists categories with no dishes or prices. |
| Bodalwyn Guest House, Aberystwyth | `bodalwyn-aberystwyth` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/bodalwyn-aberystwyth; prospect email enquiries@bodalwyn.co.uk). Invite minted 31 Aug by the fleet-audit session. |
| Popty Cara | `popty-cara` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/popty-cara). **Two published addresses**: the homepage displays ENQUIRES@POPTYCARA.CO.UK but every mailto routes to orders@poptycara.co.uk — the invite is minted against `orders@` (the address their own site actually sends to); switch if Ian prefers the displayed one. Invite minted 31 Aug by the fleet-audit session. |
| Powys Country House, Corwen | `powys-country-house` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; **no docs/mocks pack** — facts verified against a fresh 16-page mirror of the live site in the workspace + the design project's own harvest; prospect email info@powyscountryhouse.co.uk) |
| Bath Street Dental Practice, Cheltenham | `bath-street-dental` | Stamped 31 Aug, then re-released (eb167cd) to fix a blank `/team`. 15 pages live incl. 9 `/treatments/<slug>`. **No prospect email published** — this one is a walk-in/phone demo, so there is no tracked invite to mint and it is absent from tracked-links-2026-08-31.md. First site in the fleet serving optimized images (14 opt / 2 raw on /team; the 2 are header+footer logos, already 14KB webp). |
| The Teddington Cheese, Teddington & Richmond | `teddington-cheese` | Stamped 31 Aug — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; **no docs/mocks pack** — facts verified against a fresh 229-page mirror of the live site + its 78 published photographs, archived in the workspace; prospect email cheese@teddingtoncheese.co.uk) |
| Number 47 Grassington | `number-47-grassington` | Stamped 31 Aug (take 2) — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-08-31.md; pack docs/mocks/number-47-grassington with fact-by-fact summary.md; prospect email sarahwhitfield479@btinternet.com — the only address the site publishes, reservations handled by Sarah Whitfield). 6 pages (home / about=The House / rooms / grassington / gallery / contact-us), 20 Puck blocks. Take 1 failed at seed+media+integrity: the gallery block stored shots as `path | w | h | alt | caption` textarea rows, and the media importer only rewrites a `/demo-photos/` reference when the path is the WHOLE value — fixed by converting to an array field with a scalar `image` sub-field. All photography is the guest house's own, including three panels cropped out of their own slider triptych; small originals Lanczos-upscaled. Comp's unsourced '5/5 guest rating' panel replaced with the two magazine features their site actually publishes. |
| White Rose Accountancy, Faringdon | `white-rose-accountancy` | Stamped 1 Sep — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-04.md; prospect email alison@whiteroseaccountancy.co.uk). Single-page practice site ported as home + /about. The practice publishes exactly one image (its rose mark); the comp's three photographic slots render editable placeholders rather than borrowed imagery. **Was serving 502 for ~3 days** (see outage note below) — restored 4 Sep. Its build session deliberately stamped with an EMPTY prospect-email arg, noting Ian had not authorised outreach, so no invite existed and the link pack skipped it silently; invite minted 4 Sep under the standing rule below. Confirm with Ian before emailing. |
| Fringe Hair & Beauty, Minster Lovell | `fringe-hair-beauty` | Stamped 1 Sep — **no prospect email published** (ledger row 11 is phone-only), so like bath-street-dental there is no tracked invite to mint and it is absent from the link pack. Walk-in/phone pitch. |
| The Academy Partnership, Witney | `academy-partnership` | Stamped 4 Sep — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-04.md; prospect email admin@theacademypartnership.co.uk). **No docs/mocks pack** — the practice's live site answers HTTP 403 to every non-browser client, so the evidence is a byte-exact Wayback mirror archived in the workspace (`/opt/vdplatform/workspaces/academy-partnership/evidence`, with `summary.md`). 8 pages: home + about + services + case-studies + faqs + contact-us, 15 Puck blocks. Design `50e5121d-fd13-4dcb-8d17-b719907ac975`. All four gates 100 first cycle. Ledger row 3's "counters claim unverified" is now settled: the four figures ARE published (`data-counter-value` 300 / 25 / 192 / 40000), and the demo states exactly those. |
| Buscot Manor, Buscot | `buscot-manor` | Stamped 4 Sep — **no prospect email published** (the house lists a telephone and a postal address only, so like bath-street-dental and fringe-hair-beauty there is no tracked invite to mint and it is absent from the link pack). Walk-in/phone pitch: 07973 831690. **No docs/mocks pack** — the evidence is the Wix site harvested into the design project (6 pages of text, 33 assets), mirrored in the workspace. 6 pages (home / about=The Manor / stay / the-barn / gallery / contact-us), 20 Puck blocks. Design `05aa9f25-dd03-4199-b84a-ee27e9fb193f`. All four gates 100 first cycle; 58 optimized images and zero raw across the six pages. The comp's 17 images were Wix display derivatives (some 306px wide) — this port re-downloaded the ORIGINALS from static.wixstatic.com, up to 4256x2832. |
| Burford Road Dental, Carterton | `burford-road-dental` | Stamped 4 Sep — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-04.md; prospect email reception@burfordroad.co.uk). **No docs/mocks pack** — the evidence is the practice's live site harvested into the design project (129 pages of text, 112 assets). **15 pages**, incl. six nested `/treatments/<id>`; 19 Puck blocks. Design `99dced20-bdd2-4df9-bea9-a76ed6f9f957`. All four gates 100 first cycle. Every published price is reproduced with the date the practice gives it (NHS list 'correct as of December 2020', Denplan 'from 1st April 2023', endodontics 'from 1st August 2021'). Four comp corrections: no 'NHS & private' new-patient claim, PRIVATE not FREE car park, the published '50+' years rather than '70+', and the five-star rating row removed — the asterisks on their testimonials page are dividers, not a rating. |
| The Riverside, Lechlade | `riverside-lechlade` | Stamped 4 Sep — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-04.md; prospect email theriverside.lechlade@arkells.com, published on their contact page — the ledger's "phone only" was wrong). 10 pages, 18 Puck blocks. **Built WITHOUT a Claude Design comp** — see the section below before treating it as a normal port. All four gates passed first time. |
| The Witney Hotel | `witney-hotel` | Stamped 4 Sep — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-04.md; prospect email info@witneyhotel.co.uk — **the ledger had the wrong domain**, the live site is witneyhotel.co.uk not thewitneyhotel.co.uk). 7 pages, 15 Puck blocks. **Built WITHOUT a Claude Design comp** (same 403 as riverside — see that section). All four gates passed first time, 12/12 Lighthouse runs at 100. **Layout fix released 13 Sep (commit bda75da, blue slot):** /rooms had rendered every room's copy in a ~50px column on desktop — a second `.wh-room` rule inherited from the Riverside stylesheet — now a 2×2 of large photographs with per-room enquiry links; gallery is a masonry with portrait frames + captions; page heroes no longer repeat the section heading below them; About + Contact added to the menu; home gains a rooms teaser; Your Stay gets a Good-to-know list. Reseeded (no prospect edits existed), all gates green again, 12/12 Lighthouse at 100. Two traps recorded in memory: `layout` is a reserved block prop (withLayout eats it) and a reseed does not reach the live slot until it restarts. |
| Home Farm & Home Town Salon | `home-farm-salon` | Stamped 4 Sep — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-04.md; prospect email info@homefarmsalon.co.uk — **the ledger said "phone only", which is wrong**: they publish two numbers and two emails in their own contact-card graphic). **This is TWO salons**: Home Farm, Ardington (2014) and Home Town, Wantage (2017, with its own licensed bar) — the demo keeps them distinct and never attributes the bar to Ardington. 8 pages, 20 Puck blocks. **Built WITHOUT a Claude Design comp** (same 403 as riverside). All four gates passed first time, 12/12 Lighthouse runs at 100. Their site's duplicated opening-hours block (the ledger's finding) is confirmed: the same unlabelled block prints twice on both home and contact, and since no per-salon hours exist anywhere the demo publishes one set for both. |
| Witney Dental Practice | `witney-dental-practice` | Stamped 6 Sep — NOT yet emailed (tracked link + tracked invite saved for the next link pack; prospect email enquiries@witneydentalpractice.co.uk). **No docs/mocks pack** — the evidence is the practice's live site harvested on 6 Sep (both public pages, byte-exact HTML plus text, archived in the workspace). 4 pages (home / treatments / about / contact-us), 19 Puck blocks. Design `6ef4501e-9b3e-4805-bdac-be2875299bda`. All four gates 100 first cycle (take 2 — take 1 died at the installer's certbot step because a peer session's certbot held the machine-wide lock; nothing to do with the package). The comp was drawn from the practice's email address alone and carried **eleven deliberate blanks** — every one is filled from the harvest: 01993 702415, the OX28 6BB address, the published opening hours, the £82 new-patient examination (the comp said fees 'aren't published on this site yet'; they are), and the three clinicians the practice names. Photographic slots stay as editable placeholders — the practice publishes no photograph of itself, only its logotype and three stock banner strips. |
| G&O Engineers Ltd, Witney | `go-engineers` | Stamped 6 Sep — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-06.md; prospect email info@gandoengineers.co.uk). **No docs/mocks pack** — the evidence is the company's live site harvested on 6 Sep (ten pages, byte-exact HTML plus text, archived in the workspace). 4 pages (home / services / about / contact-us), 16 Puck blocks. Design `0569493d-5b7d-4e80-b658-21b22890e89c`. All four gates 100 first cycle. Like Witney Dental, the comp was drawn from an email address alone: it said "no published phone number yet", left address/hours/rates/credentials "to be confirmed", and described G&O as a plumbing and heating firm. The company publishes 01993 771 754 on every page and sells itself as "all the home maintenance services you may need in a one stop shop", so the port fills the blanks (number, 1 Cotswold Business Park OX29 0YB, company 04634960, Gas Safe/OFTEC/CHAS) and widens the service set to the six areas it actually advertises. Two comp blanks stay blank because the company genuinely publishes neither: no opening hours (the 24/7 call-out is stated instead) and no rates. Photographic slots are editable placeholders — its images are website-builder stock and its footer expressly forbids copying them. **Tell the client: the apex domain `gandoengineers.co.uk` is dead** — it resolves to 208.43.88.227 but answers on neither port 80 nor 443; only `www.` serves the site. |
| Hall's Gardening Services, Witney | `halls-gardening` | Stamped 6 Sep — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-06.md; prospect email info@hallsgardeningservices.co.uk). 5 pages, 14 blocks. **Built WITHOUT a Claude Design comp** (same 403 as riverside). All four gates first time, 12/12 at 100. Their site carries **"Welcome to Timber Land!"** — someone else's headline — at the top of all fifteen pages, every footer reads © 2017, /decking says only "Images coming soon.", and the contact page renders its own post-submit confirmation before anything is sent. The source's eleven near-empty service pages are consolidated into one services page here: copying them would have reproduced the fault. |
| ReesRussell LLP, Witney | `rees-russell` | Stamped 6 Sep, re-released same day with a CLS fix — NOT yet emailed (tracked link + tracked invite in tracked-links-2026-09-06.md; prospect email witney@reesrussell.co.uk). 8 pages, 17 blocks. **Built WITHOUT a Claude Design comp** (same 403 as riverside). **Their live /ourteam renders three unshipped template cards reading "Member Name" and "Member About Goes Here"** — the strongest single fault on the bench, and NOT reproduced here; that page became /our-offices instead. Their footer lists three offices while the team page lists four (Wendover, which publishes no email). Palette and logo are the firm's own, sampled from their logo artwork. |
### Outage: white-rose-accountancy served 502 for ~3 days (1–4 Sep)

Both slot units were SIGTERM'd within the same second (`exited with code 143`, 1 Sep
12:23:56) and neither was restarted. `.next/BUILD_ID` was intact in both slots, so this was
purely a stopped service — `systemctl start vd-white-rose-accountancy-green` restored it in
seconds on 4 Sep.

Same failure class as bakewell-pudding on 28–29 Aug (interrupted slot switch, never
restarted), and the reason `vd-demo-fleet-health.timer` exists. **The monitor did its job and
still nobody acted**: it emails only on CHANGE, so the site was reported once when it broke
and then stayed silent for three days. Two sessions were stamping other sites that evening.
The likely trigger is a broad kill that caught both slots at once — the playbook's "NEVER
`pkill -f next-server` on this box" rule, §9b.

Worth considering: a daily digest of anything currently unhealthy, not just transitions.

### Standing rule: a stamp is not finished until the prospect link exists

`demo-fleet-health` proves a site SERVES; it says nothing about whether Ian can email it.
Three sites (salutation-inn, bodalwyn-aberystwyth, popty-cara) went live 31 Aug with no
prospect invite in Mongo, so `demo-recipient-links-batch.ts` silently skipped them and they
were absent from the link pack — invisible until a fleet audit diffed live sites against the
pack. **Every build session must run `mint-invite.sh <slug> <prospect-email>` before
reporting done**, and the audit below catches any that slip:

```
cd /srv/apps/velvetdinosaur
bun run demo:fleet | grep '^- ' | awk '{print $2}' | sort > /tmp/live.txt
bun scripts/demo-recipient-links-batch.ts     # prints "Skipped (no prospect invite): ..."
```

Anything named in that Skipped line is either a deliberate no-email demo (bath-street-dental
publishes no address — walk-in/phone pitch) or a missed mint that must be fixed.

### Customer-journey defects fixed fleet-wide (14 Sep)

The 13 Sep real-browser test of the 30 emailed demos (`output/customer-test-2026-09-13/README.md`)
passed registration, verified login, save, preview, publish and sign-out everywhere but found six
defects. All six are fixed; four were one template fix, because the files were byte-identical on
48 of 49 blue/green sites.

| Finding | Root cause | Fix |
|---|---|---|
| Editor showed the old draft after reload (30/30) | `getDraftPageData()` was `'use cache'` and `revalidateTag(tag, 'default')` is stale-while-revalidate in Next 16; Puck 0.22 reads its `data` prop once, so the fresh API fetch never reached the canvas. The editor-smoke gate runs the uncached in-memory branch, so it could not see it. | Draft reads are always fresh; `revalidateTagSafe` expires immediately (`{ expire: 0 }`); the canvas remounts (`key`) when server data replaces it. Hub commit `1a88631`. |
| "Submit for approval" shown to admins, button published anyway (30/30) | `app/edit/[slug]/page.tsx` never passed `isAdmin` to `EditorShell`. | Route resolves `requireAdmin` + the chapter profile exactly like the dashboard editor. |
| Popty Cara / Salutation Inn uploads 403 | Installer's per-site bucket `vd-<slug>` survived a partially re-run stamp; the shared key only has rights on `velvetdinosaur`. | Six env files repointed, active slots restarted, write proven with `ops/scripts/r2-bucket-probe.ts`; `demo:fleet -- --strict` now fails on bucket drift. |
| Purge left originals and thumbnails (28/28) | Purge deleted only the public key, not the original or the six variants; replace orphaned the previous original. Worse, `models/Asset.ts` never declared `originalKey` (nor `fallbackKey`/processing fields), so Mongoose stripped them on every upload and no record knew where its original lived. | Schema declares the fields; `collectPurgeKeys()` merges the record's keys with originals found by stem (`asset-originals/<path sans extension>.<ext>`, incl. `--replace-<ts>`); `deleteAssetObjects()` removes them in batches (unit-tested; proven by listing the bucket on the canary). |
| Corn Street team photos 429 | Browsers negotiate HTTP/2 on the shared :443 socket and multiplex 20+ image streams; `/api/` carried `limit_conn vd_conn 20` (and `vd_api` 20 r/s). Only a real browser reproduces it — curl never does. | `location ^~ /api/assets/file` with its own zones (`vd_media` 60 r/s, `vd_media_conn` 100) on all 53 vhosts + installer templates via `ops/scripts/nginx-media-carveout.sh`. Verified: 3 Chromium visits, 0 non-200 images. |
| Hair Lounge burger off-screen at 390px | Header row could not shrink: 30px letter-spaced wordmark + Book button + burger needed ~485px; `overflow-x: clip` hid it. | Wordmark `clamp(22px, 6.5vw, 30px)`, Book button hidden under 640px and added to the mobile menu (workspace + checkout). |

Rollout: every site takes the fix through its own full-gated blue/green release, one at a time
(`ops/scripts/fleet-release-queue.sh`, ~40 min per site; the gates share Playwright ports). The
release covers all 48 sites, not only the 30 tested, because the code is identical.

**Baseline glyph drift (found the same day).** The zero-tolerance visual gate failed on the hub
(10 snapshots) and on the popty-cara canary (3 snapshots) by 148–182 pixels each: icon glyphs
(external-link arrow, WhatsApp, the "photo to follow" placeholder, the demo-notice icon) render
a few pixels differently than when the baselines were captured in late August. Proven
environmental on the hub by re-running the gate on the previous commit (identical failure
set). Expect it on every site stamped before September. The queue runner refreshes and
retries once when the only failures are public `visual.spec.ts` baselines of ≤ 1000 pixels
(`GLYPH_DRIFT_MAX_PIXELS`), records the counts in the site log, and stops for a human on
anything else. Each drifted site therefore costs ~46 min instead of ~40.
**Status (14 Sep, 13:15 UTC):** hub deployed (`2ebcaa5`), popty-cara released twice as the canary and re-tested with the 13 Sep harness — 13/13 journey steps, button reads "Publish", reload shows the saved heading, upload works, bucket empty after purge. The 47-site queue started at 13:15 UTC (`ops/scripts/fleet-release-queue.sh --marker listStoredOriginalKeys --from-file output/fleet-fix-2026-09-14/queue-slugs.txt`); progress in `logs/fleet-release-<run>/summary.tsv`. Per-site logs there show any glyph-drift refresh.

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

**Designed but NOT built: NONE.** Every design project with files is now live — Cotswold
Dental Wellness and Salutation Inn both shipped 31 Aug. The next batch starts from new
designs, not from a backlog.

Dead projects to ignore: `af74a16b…` ("Website redesign request", empty), `0a8c19bd…` (Hair
Lounge duplicate, uploads only), `125f0a2a…` (Bubbleton duplicate, uploads only),
`483cd019…` (mislabeled Bush Farm design — Ian confirmed 29 Aug it is not to be built).

**Full procedure: `docs/growth/DEMO-BUILD-PLAYBOOK.md` — read it start to finish before
porting anything.** It encodes every gate failure from the 29 Aug builds (demos 19–21) as a
rule; a site built to it should pass the stamp in one cycle. The `demo-port-pipeline` memory
file holds the same lessons as history. **Next batch**: inputs per site are a Claude Design project + the `docs/mocks/` pack +
the prospect email.

### Three comps ported and released (4 Sep): Glamour and Glow, Portway Dental Care, Pokhara Delight

All three were blocked until Ian ran `/design-login` — the ordinary claude.ai login carries no
`user:design:read` scope, and `/design-login` writes a SEPARATE `designOauth` credential. Detail,
including how to pull binary design assets (MCP `read_file` refuses them; use `render_preview`'s
short-lived serve URL), is in `docs/growth/PORT-READINESS-glamour-portway-2026-09-04.md` and the
`demo-port-pipeline` memory.

Fact-checking held up well: all 72 of Glamour's prices matched their published list exactly, and
all 14 of Portway's team members matched including every GDC number. Four corrections were
needed — Portway advertised Wednesday late opening the practice does not offer; Glamour carried
an unsourced "self-employed hairdresser" and star ratings the salon never publishes; and Pokhara's
comp assumed nothing was confirmed when the restaurant in fact publishes its address, phone, full
opening hours and five prices, which were filled in on Ian's instruction.

**Five traps found the hard way. Every one of them passed at least one full green gate run.**

- **A generated `.ts` content file can contain `\\n`**, which TypeScript reads as a literal
  backslash-n. Glamour shipped **9 price rows instead of 72** through a completely green stamp,
  and the visual baselines were captured FROM the broken build, so `visual:test` matched the bug
  forever. Grep `components/` for it and count rendered rows before releasing.
- **`new-demo.sh` names the wrong stage on a quality-gate failure** — `STAGE` is never updated for
  `quality: site`, so a Lighthouse failure prints "FAILED during: seed + media + integrity". Read
  the `-- gate: X --` markers.
- **`media:import` needs the whole production env**, not just `MONGODB_URI`; it reads
  `process.env.R2_BUCKET` with no dotenv. `set -a; . .env.production; set +a` first.
- **Never `exec` from a claim-holding launcher** — it discards the EXIT trap and the stamp claim
  outlives the run, so every later launcher sees `CLAIM HELD` by a dead pid.
- **An empty-state placeholder with `position: absolute; inset: 0` escapes its grid cell** unless
  that cell is itself positioned, and paints over the neighbouring photograph.

Two authoring rules now worth applying fleet-wide: give a logo's `sizes` its rendered WIDTH (passing
the CSS height served a 96px file into a 65px slot and cost best-practices 0.96 on both gate URLs),
and wrap scope resets in `:where()` so `.xx p { margin: 0 }` at (0,1,1) stops outranking every block
class. The second was flagged by the academy-partnership session and was live in two of my packages.

Also: photo filenames are not identities. A first pass on Pokhara captioned a lamb curry as momo.
Build a labelled montage and map images by eye before writing alt text.

### The Riverside, Lechlade — built WITHOUT a comp (4 Sep)

**Read this before treating the site as a normal fleet port.** The Claude Design
comp (`700c5ad0-970c-4055-8bc0-5c7c4ed1700f`) could not be pulled: this machine's
claude.ai token carries no `user:design:*` scope, so the MCP server, `DesignSync`
and a direct API call all return HTTP 403 `needs_design_scopes`, and the API says
refreshing the sign-in will not fix it. **`/design-login` is still the fix** if the
comp is wanted. Ian instructed the session to build regardless, so **the layout,
palette, type and section structure of this site are the agent's, not Ian's** —
the first fleet site where that is true. Expect a divergence if the comp is
pulled later. Full diagnosis in the workspace's `design/PROVENANCE.md`.

Content is another matter: every word comes from the pub's own site and its two
current menu PDFs, archived in the workspace with 119 of its own photographs and
a fact-by-fact `evidence/summary.md`. Ten seeded pages (home, about,
bar-and-food, rooms, garden, location, functions, events, gallery, contact-us),
18 Puck blocks, nothing on a custom route.

Three findings worth carrying to the next build:

- **The ledger's "phone only" for this row was wrong.** The pub publishes
  `theriverside.lechlade@arkells.com` on its contact page. Ledger corrected.
- **Strip HTML comments BEFORE tags when harvesting a hand-built site.** This one
  comments stale copy out rather than deleting it: its Bar & Food page is 5,414
  characters with comments and **721 without**, and the buried 87% held a 2023
  Easter trail, a closure notice, four contradictory sets of opening hours and a
  superseded menu. Now a rule in the playbook (§4).
- **Don't guess room photos from filenames.** The first-numbered shot in each set
  is often an exterior — `windrush_1` is two ducks, `thames1_1` and `thames2_1`
  are building fronts, `leach2_1` is the pub sign. An earlier pass shipped those
  as bedrooms; the correct pairing was read off the pub's own accommodation page.

Two defects caught locally that would each have cost a ~40-minute gate cycle:
`/about` scored SEO 92 on the `canonical` audit (the root layout emits a homepage
canonical on every page, which Lighthouse flags on an inner page — fixed with a
per-route `alternates.canonical`), and the first preview 404'd every inner page
because the build ran before the seed, so `generateStaticParams` enumerated
nothing. **Mirror the stamp's order — seed, then build — or the probe measures a
site that does not exist yet.**

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
- ~~**Editor shows a stale draft after reload; admins see "Submit for approval"; purge leaves
  originals and variants in R2; image-heavy pages 429 in browsers.**~~ **Fixed 2026-09-14** — see
  "Customer-journey defects fixed fleet-wide (14 Sep)" above. The gate blind spot remains worth
  knowing: anything under the editor-smoke token runs the uncached in-memory page store, so a
  production cache bug can never fail a gate.
- **Two demos had the installer's per-site bucket in their env** (`vd-popty-cara`,
  `vd-salutation-inn`) and could not upload. `new-demo.sh` upserts the shared bucket late in the
  stamp; a re-run that skips that stage keeps the installer default. `demo:fleet -- --strict`
  now catches it; prove a site's storage chain with `ops/scripts/r2-bucket-probe.ts`.
- **`new-demo.sh` mints its admin invite to `eugenia@ontourism.academy`** (hardcoded, line 55) but
  Ian signs in as `ian.wickens@ontourism.academy`, so every stamp produces an admin link that
  expires unused.

## Open items

- **Fleet release queue for the 14 Sep core fix.** `ops/scripts/fleet-release-queue.sh` runs the
  48 releases serially with full gates. If a site fails its gate the queue stops with its commit
  on `develop`; fix and rerun the queue (released sites are skipped by the marker check).
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
