# Outreach Playbook — filling the audit pipeline

The `/audit` page converts interest into requests; this playbook creates the
interest. The audit offer only works at a steady outreach cadence — the machine
is: **find → personalised first touch → audit video → fixed-price ask**.

## The maths behind 4 gigs a month

Working backwards with conservative rates:

- 4 gigs ← ~8–12 audit videos delivered (1 in 2–3 converts when targeted well)
- 8–12 audits ← ~25–35 positive replies… realistically **100–120 first touches a month**
- That is **5–6 personalised touches per working day**. About 45–60 minutes daily.

Rules that keep the machine honest:

1. **Outreach happens every working day, including mid-project.** The famine after
   each gig comes from stopping outreach during delivery.
2. **Track actual conversion rates after the first 50 touches** and redo this
   maths with real numbers instead of the estimates above.
3. **A touch without a specific observed finding doesn't count** toward the daily 5.

## Picking the niche

Score candidate niches 1–5 on each; pick the highest total and commit for 90 days:

| Criterion | What good looks like |
|---|---|
| Findable | A directory, map pack, or association list you can walk through systematically |
| Money on the line | The website plausibly wins/loses them jobs (trades, clinics, restaurants, venues) |
| Visibly broken | You can spot real problems from the outside in under 2 minutes |
| Repeatable | Same problems recur, so audits get faster and case studies transfer |
| Reachable | A named owner/manager with a public email — not `info@` into the void |

Good starting candidates for Oxfordshire: trades with Google Ads running to slow
sites, independent restaurants/pubs with non-mobile sites, clinics and dental
practices, wedding/event venues. **Your fourth gig in one niche is far easier
than your first in four niches.**

## Daily cadence (45–60 min)

1. **Prospect (10 min):** add 5–6 businesses to the tracker from your niche source.
   Capture the *opener finding* while you're there — the one specific broken thing.
2. **First touches (25 min):** send 5–6 emails using the template below. Every one
   contains the prospect's specific finding in the first two lines.
3. **Bumps (10 min):** everyone at `contacted` older than 4 days gets one bump;
   older than 12 days moves to `lost`.
4. **Log everything** in `outreach-tracker.csv` before closing the laptop.

## First-touch template

Subject: `[their-domain.co.uk] — [the finding, plainly]`
(e.g. `smithsplumbing.co.uk — takes 9 seconds to load on a phone`)

> Hi [Name],
>
> I was looking at [niche] sites in [area] and checked yours — [specific finding
> in plain customer terms, e.g. "on a phone it takes about 9 seconds before
> anything shows, and most people give up at 3"].
>
> I'm a web designer in [area] ([your-site link] — that's mine, it scores 100/100
> on Google's speed test). I record free 15-minute video audits for local [niche]
> businesses: I go through your site, show you what's costing you enquiries, and
> give you the three fixes that matter most. The video's yours to keep, whoever
> does the work.
>
> Want one? Just reply "yes" and I'll have it to you within two days.
>
> Ian
> Velvet Dinosaur · velvetdinosaur.com/audit

Rules: **under 120 words**, one specific finding, one link, one yes/no ask.
Never attach anything. Never mention price. The bump is two sentences:
"Still happy to record that free audit for [domain] — takes you nothing but a
'yes'. Shall I?"

## Tracked links (always — never email a bare demo URL)

Every demo email must use the prospect's **tracked link** (`https://<slug>.velvetdinosaur.com/visit/<token>`),
never the bare domain. A click then appears in the activity digest within two hours, named to the
prospect — click intelligence drives the 48-hour call: "clicked but didn't sign up" gets a
different opener from "never clicked".

- New demos: `new-demo.sh` prints `PROSPECT_TRACKED_LINK` at stamp; `mint-invite.sh` prints a
  `TRACKED_INVITE` wrapper alongside the raw sign-up link. Email the tracked variants.
- Mint or refresh by hand: `bun run demo:recipient-links -- --site=<slug> --name="<Name>" --email=<email>`
  (registry: `/var/lib/vd-demo-activity-digest/recipients.json`).
- Batch 1 (28 Aug) went out untracked; the follow-up pack is `docs/growth/tracked-links-2026-08-30.md`
- **Email-open pixel (added 30 Aug):** every prospect row in the pack also has a personal
  `https://velvetdinosaur.com/open/<token>.gif` pixel. In Gmail compose: Insert photo -> Web
  Address (URL) -> paste it (renders as an invisible dot). The digest then shows
  "email opened" per prospect — delivery evidence that the email reached an inbox and was
  displayed, i.e. it did not silently die in spam. Caveats: do not reopen your own sent copy
  (Google caches the first fetch per URL and your own view can consume it); Apple Mail
  prefetches images, so an open proves delivery, not always a human read; a missing open
  proves nothing (image blocking). Clicks remain the intent signal.
  — check each link's status column before using it.
- The digest's "Campaign status" table answers "has prospect X ever clicked?" cumulatively; a bare
  fetch is reported as `redirect only` and only interaction + dwell counts as a human visit, so
  email-scanner prefetches cannot masquerade as interest.

## Pipeline stages (tracker `status` column)

`prospect → contacted → bumped → audit_requested → audit_sent → in_talks → won | lost | no_fit`

- `audit_requested` — they said yes; the two-business-day clock starts.
- `won` — deposit paid, not verbal agreement.
- `no_fit` — you chose not to pursue (site fine, business closing, etc.). Keeping
  this separate from `lost` keeps your conversion stats honest.

## Weekly review (Friday, 15 min)

- Touches sent vs the ~25–30 target; requests, audits delivered, gigs won.
- Which opener findings got replies? Double down on those.
- If 50+ touches and reply rate under ~8%: change the *finding type* you lead
  with before changing the niche.
- If audits deliver but don't convert: the ask is wrong, not the audit — check
  you're quoting one fixed price in the video, not "let me know".

## Sources of warm-er leads (work these before cold email)

- Past clients and the enquiry inbox — anyone who enquired but didn't book gets
  offered a free audit — it costs nothing, it's a two-line email.
- Google reviews you've received — reply-and-ask for referrals.
- The `/audit` page link belongs in your email signature, WhatsApp business
  profile, and any local Facebook/Nextdoor group answers you post.
