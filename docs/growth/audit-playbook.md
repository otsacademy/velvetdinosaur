# Audit Playbook — the 20-minute sales audit

This is the repeatable process behind the `/audit` offer. The goal is a **personal
15-minute video** that demonstrates competence and ends with one priced next step.
It is deliberately lighter than the deep audits in `idea-website-audit/` and
`sofo-website-audit/` — those are paid-engagement depth; this is the free door-opener.

**Time budget: 20 minutes of prep + 15 minutes of recording. If it's taking longer,
you're doing a paid audit for free — stop and trim.**

## 1. Pre-checks (5 minutes, before recording)

Run these and keep the tabs open so the video shows live evidence:

- [ ] **PageSpeed Insights** (pagespeed.web.dev) — mobile + desktop scores. Screenshot both.
- [ ] **Your own site's scores** in a neighbouring tab (velvetdinosaur.com — the 100/100 contrast is the strongest single visual in the video).
- [ ] **Phone-width view** (devtools, iPhone SE width) — load the homepage and the contact route.
- [ ] **The obvious money page** — can you find price/booking/contact in under 10 seconds?
- [ ] **Google their business name** — what does the search snippet look like? Is the title tag "Home"?
- [ ] **One spot-check for rot** — click 5 links in the footer/nav; note any 404s, placeholder text, or "© 2019".

Pick the **three highest-impact findings**. Not five, not eight. Three.

## 2. Finding categories (pick 3, ranked by impact on enquiries)

1. **Speed** — score below ~70 mobile, slow LCP, huge images. Frame in customer terms: "roughly X in 10 visitors give up before this loads."
2. **Mobile experience** — broken menu, tiny tap targets, horizontal scroll, forms that fight autofill.
3. **Trust** — outdated copyright, placeholder content, no photos of real people, no reviews, expired SSL.
4. **Contact friction** — buried phone number, long forms, no idea what happens after submitting.
5. **Search basics** — missing/duplicate titles, no meta descriptions, headings soup, no local-business schema.
6. **Message clarity** — homepage doesn't say what they do, for whom, in which area, within 5 seconds.

## 3. Recording the video (15 minutes, one take, Loom or OBS)

Don't script it word-for-word — one take, honest, unpolished is the point. Structure:

- **0:00–0:30 — Personal opener.** Their business name, one genuine compliment about the business (not the site). "I'm Ian, I build websites in Oxfordshire, and I recorded this for you — nobody else has seen it."
- **0:30–2:00 — The headline finding**, live on screen. Lead with the most visceral one (usually speed or mobile).
- **2:00–11:00 — The three findings**, each as: *what I see → why it costs you customers → what fixing it involves*. Always the customer-impact framing, never jargon-shaming.
- **11:00–13:00 — The prioritised list**, spoken plainly: "If you only do one thing, do X."
- **13:00–15:00 — The one ask.** "Fixing these three things is a fixed-scope project. For a site like yours that's £X, done in N weeks, and I only take payment when you've seen it working. If you want that, reply to this email or WhatsApp me. If not — the list is yours, genuinely, do it with whoever you like." Then stop. No second ask.

## 4. Delivery email (send with the video)

Subject: `Your website audit video — [Business Name]`

> Hi [Name],
>
> Here's the 15-minute audit video I promised: [link]
>
> The short version — three things are costing you enquiries:
> 1. [Finding one, one line]
> 2. [Finding two, one line]
> 3. [Finding three, one line]
>
> Everything's explained in the video, in order of impact. The list is yours to
> use however you like. If you'd like me to do the work, it's a fixed £X and
> takes about N weeks — just reply and I'll send over the details.
>
> Ian

## 5. Pricing the ask

Anchor to the public pricing (from £3,500 for a full build, £250/year hosting).
For audit conversions, have a smaller productised entry point ready:

| Offer | Scope | Price guide |
|---|---|---|
| Quick fixes | The 3 audit findings only, on their existing site | £450–£900 fixed |
| Landing page rebuild | One key page rebuilt properly, 1 week | £1,200–£1,800 fixed |
| Full rebuild | The standard offer | from £3,500 |

Quote **one** of these in the video — whichever genuinely fits — not the menu.

## 6. Follow-up rules

- **+3 days, no reply:** one short bump. "Did the video land OK? Happy to answer anything in it — no charge, obviously."
- **+10 days, no reply:** final touch, then mark `lost` in the tracker. "No worries at all — the list's yours. If it's useful in six months, you know where I am."
- Never more than two follow-ups. The audit's credibility *is* the no-pressure stance.

## 7. Log it

Every audit goes in `docs/growth/outreach-tracker.csv` (status `audit_sent`) the day
it's delivered, with the three findings in the notes column — they become reusable
niche patterns after ~5 audits in the same trade.
