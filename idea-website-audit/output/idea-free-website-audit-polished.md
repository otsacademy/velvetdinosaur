# Practical Website Audit for IDEA

Prepared for the International Development Ethics Association  
Prepared by Ian Wickens, Velvet Dinosaur  
Date: May 21, 2026

## Executive Summary

IDEA's site already communicates the association's intellectual purpose and has the core pages a visitor expects: About, officers, bylaws, events, resources, membership, and contact. The main opportunity is not to add more content. It is to make the existing content feel current, trustworthy, and easier to act on.

The biggest issues found were:

1. The Contact page contains placeholder address, email, and phone details.
2. The Joining IDEA page includes an old secretary contact while the footer and Officers Board identify Jack Simpson as Secretary.
3. Visitors do not get a clear "what is current now" signal on the homepage, News and Events, or Past Events.
4. Resource and archive pages contain many older external links, including confirmed 404s.
5. Mobile performance is weaker on image-heavy pages, especially the Officers Board.

These are practical fixes. The site does not need to be rebuilt before it can be made more credible. A short content clean-up and navigation pass would materially improve the visitor journey.

## Evidence Captured

This audit was based on a live crawl and technical checks on May 21, 2026:

- 39 public sitemap pages crawled from `https://developmentethics.org/sitemap.xml`.
- `https://developmentethics.org/news-sitemap.xml` checked and found empty.
- 13 priority pages captured in desktop and mobile screenshots.
- 62 internal links checked, with 0 failures.
- 189 external links checked, with 70 non-OK or failed responses.
- Local Lighthouse reports captured for the homepage, Joining IDEA, and Officers Board.
- PageSpeed Insights was attempted without authentication, but the API returned HTTP 429 rate-limit responses.

## What To Fix First

| Priority | Fix | Why it matters |
| --- | --- | --- |
| 1 | Remove placeholder details from Contact | Placeholder contact information damages trust immediately. |
| 2 | Correct the Joining IDEA contact | A membership page should not send people to an old officer if the footer names a different secretary. |
| 3 | Choose one canonical Joining IDEA URL | The navigation points to `/joining-idea/`, while the sitemap also includes newer `/joining-idea-2/`. |
| 4 | Replace the Google Sites edit URL on Past Events | Visitors should never be sent to an edit/admin-style URL. |
| 5 | Repair resource and archive links | External link rot is visible enough to affect confidence in the site. |
| 6 | Add a current activity panel to the homepage | New visitors need to know whether IDEA is active now and where to go next. |

## Visitor Journey Findings

### 1. First-Time Visitor

The homepage explains IDEA's purpose and includes a strong short introduction to development ethics. It says the website provides news about recent and future discussions and research, but the page does not show a recent event, current call, newsletter, or next practical step.

The navigation is also narrow. It shows About, Officers Board, Bylaws, Past Events, Member Resources, and Joining IDEA. That is a reasonable base, but it does not create a clear route for "what is happening now".

Recommendation:

- Add a small homepage section with "Current activity", "Join IDEA", "Resources", and "Contact".
- If there is no current event, say that plainly and invite visitors to join the mailing list or contact the secretary.
- Keep the existing mission text, but make the next action visible above the fold or immediately after the intro.

### 2. Membership

The Joining IDEA page is useful and the external payment link to Philosophy Documentation Center returned HTTP 200. The issue is consistency.

The site has both `/joining-idea/` and `/joining-idea-2/`. The navigation points to `/joining-idea/`, while `/joining-idea-2/` is the newer sitemap entry. Both pages include the same contributing-membership paragraph, which directs requests to Anna Malavisi at `malavisi@msu.edu`. The footer and Officers Board identify Jack Simpson as IDEA Secretary at `jh10j3s@leeds.ac.uk`.

Recommendation:

- Keep one membership URL and redirect the other.
- Update the contributing-membership contact to the current secretary or to a stable role-based IDEA email.
- Add a short "How to join" summary at the top: dues, payment link, contributing membership, renewal help, contact.

### 3. Contact

The Contact page currently shows placeholder information:

- `10 Street Road`
- `City, 10100`
- `mail@example.com`
- `(555) 555 1234`

The real secretary contact appears only later in the global footer. On mobile, the placeholder details are prominent before the footer.

Recommendation:

- Remove the placeholder address, email, and phone immediately.
- Replace the page with one clear contact route for Jack Simpson, or temporarily remove the Contact page until it is accurate.
- If the contact form remains, confirm it routes to the current secretary and add a short expectation such as "For membership and association queries".

### 4. News And Events

The site has substantial historical material, but current and archive content are mixed together.

Evidence from the sitemap shows that 27 of 39 public pages were last modified in 2022 or earlier. The News and Events page was last modified in 2021 and begins with 2022 and 2018 content. Past Events was last modified in 2023 and lists older events, including 2014-2022 material.

Recommendation:

- Rename or restructure the current event area as "News and Events".
- Split it into "Current" and "Archive".
- Put dates on every listing.
- Mark old congress, webinar, and prize pages as archive material so visitors do not mistake them for current calls.

### 5. Member Resources

The Member Resources page is a useful starting point, but it reads like a list rather than a maintained resource library. Some items are visible text without links, such as Audio and Syllabus. The external check found that the UN Training in Human Development link returns HTTP 404.

Recommendation:

- Rebuild resources into a small library with sections: Reading, Teaching, Video/Audio, Courses, Partner links.
- Add one-line descriptions so visitors know why each resource matters.
- Add a "reviewed" date for external resource lists.
- Remove or replace dead links, starting with the UN Training link.

### 6. Officers And Trust Signals

The Officers Board page contains the important leadership information: President, Vice President, Treasurer, Secretary, Board of Directors, Advisory Board, and Past Presidents. It is a good trust signal, but the mobile experience is long and image-heavy.

The mobile screenshot shows a narrow page with significant empty vertical spacing. Lighthouse measured the Officers Board mobile page at 5,455 KiB total page weight, 23.4 s Largest Contentful Paint, and a 66 performance score.

Recommendation:

- Use compact mobile person rows or cards with image, name, role, and optional affiliation.
- Optimize portrait images to display size.
- Keep the page as a leadership trust page, but make it easier to scan on phones.

## Technical Quality

### What Is Working

- Internal links checked cleanly: 62 checked, 0 failed.
- Basic SEO scores were strong in local Lighthouse checks.
- Best Practices scores were 100 on the homepage and Joining IDEA page.
- The site has a robots file and public sitemap.

### What Needs Attention

External links need review. Of 189 checked external URLs, 70 returned non-OK status or failed to connect. This included 23 HTTP 404s, 2 HTTP 410s, expired certificate failures, and timeouts. Some 403 responses may be caused by bot protection or access controls, so they should be reviewed before removal.

Confirmed examples include:

- `https://medellin.travel/en/destinations/santa-fe-de-antioquia` returned 404.
- `https://dl.dropboxusercontent.com/u/36043317/IDEA/IDEAmini-conferenceProgram%20NASSP.pdf` returned 404.
- `http://hdr.undp.org/en/nhdr/training/` returned 404.
- `http://www.brynmawr.edu/internationalstudies/idea/` returned 404.
- `http://www.inif.ucr.ac.cr/congreso_inif/docs/MEMORIA.pdf` returned 404.

There is also a Past Events link to a Google Sites edit URL. That should be changed to a public view URL.

### Lighthouse Snapshot

| Page | Mode | Performance | Accessibility | SEO | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| Homepage | Desktop | 85 | 95 | 100 | LCP 2.7 s |
| Homepage | Mobile | n/a | 96 | 100 | LCP 15.8 s, performance score unavailable due Lighthouse trace issue |
| Joining IDEA | Desktop | 85 | 93 | 100 | LCP 2.7 s |
| Joining IDEA | Mobile | 65 | 94 | 100 | LCP 15.4 s |
| Officers Board | Mobile | 66 | 96 | 100 | LCP 23.4 s, total weight 5,455 KiB |

The repeated accessibility issue is an unnamed footer image link. Fixing the footer logo link would be a small, high-confidence improvement.

## Recommended 30-Day Action Plan

### Week 1: Trust And Accuracy

- Remove placeholder Contact details.
- Update the Joining IDEA contact conflict.
- Set one canonical Joining IDEA URL.
- Replace the Google Sites edit URL.
- Fix the unnamed footer image link.

### Week 2: Current Activity

- Add a homepage current activity panel.
- Separate active News and Events from archive content.
- Add dates and archive labels to older event pages.

### Week 3: Resources And Links

- Review external links on Member Resources, Past Events, News and Events, and About.
- Replace dead links where better current URLs exist.
- Archive pages that cannot be fully maintained.

### Week 4: Mobile Polish

- Compress and resize portraits, hero, and footer images.
- Convert the Officers Board page into a more compact mobile layout.
- Re-run Lighthouse and a link check.

## Closing Note

IDEA already has the right core material: purpose, history, officers, membership, events, and resources. The quickest improvement is accuracy and currency. Fixing contact details, membership guidance, archive labeling, and link maintenance would make the site feel more reliable without requiring a full redesign.
