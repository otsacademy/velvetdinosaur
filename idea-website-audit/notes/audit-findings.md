# IDEA Website Audit Findings

Captured: May 21, 2026

## Evidence Base

- Public crawl: 39 sitemap URLs from `https://developmentethics.org/sitemap.xml`.
- News sitemap: `https://developmentethics.org/news-sitemap.xml` returned an empty URL set.
- Robots: public sitemap crawl allowed; admin/login paths disallowed.
- Screenshots: 13 priority pages captured in desktop and mobile viewports.
- Internal links: 62 internal links checked, 0 failed.
- External links: 189 external links checked, 70 returned non-OK status or failed to connect. This includes 23 HTTP 404s, 2 HTTP 410s, 2 expired-certificate failures, 1 certificate-name failure, and 9 timeouts/aborts. Some 403s may be bot or paywall protections and should be manually reviewed before removal.
- Lighthouse: local reports captured for home, joining, and officers pages. PageSpeed Insights was attempted but returned HTTP 429 without API authentication.

Key local evidence files:

- `evidence/crawl-summary.json`
- `evidence/sitemap-urls.json`
- `evidence/news-sitemap.xml`
- `evidence/internal-link-checks.json`
- `evidence/external-link-checks.json`
- `evidence/lighthouse/lighthouse-summary.json`
- `screenshots/desktop/home.png`
- `screenshots/mobile/contact.png`
- `screenshots/mobile/officers-board.png`
- `evidence/text/home.txt`
- `evidence/text/joining-idea-2.txt`
- `evidence/text/contact.txt`
- `evidence/text/member-resources.txt`
- `evidence/text/news-and-events.txt`
- `evidence/text/past-events.txt`

## High Confidence Findings

### 1. The first-time visitor journey is clear about IDEA's field, but weak on current activity and next steps.

Evidence:

- The homepage says the site provides "news about recent and future discussions and research on development ethics" and explains IDEA's purpose.
- The homepage text does not surface a current conference, current newsletter, active call, or recent news item.
- The top navigation visible on the homepage exposes only seven main destinations: IDEA, About, Officers Board, Bylaws, Past Events, Member Resources, Joining IDEA.
- The news sitemap is empty, while the main sitemap contains 39 public URLs.

Recommendation:

- Add a short "current activity" area near the top of the homepage with the latest confirmed update, next event, membership route, and contact route.
- Keep the existing purpose statement, but add a practical visitor choice set: "Learn about development ethics", "Join IDEA", "Find events and recordings", "Contact the secretary".

### 2. The membership journey has a contact-consistency problem.

Evidence:

- The navigation points to `https://developmentethics.org/joining-idea/`.
- The sitemap also includes a newer `https://developmentethics.org/joining-idea-2/` updated on 2026-02-05.
- Both joining pages say contributing membership requests should be emailed to Anna Malavisi at `malavisi@msu.edu`.
- The global footer and Officers Board page identify Jack Simpson as Secretary, with `jh10j3s@leeds.ac.uk`.
- The external membership payment link `https://www.pdcnet.org/idea` returned HTTP 200 in the external link check.

Recommendation:

- Consolidate the membership page to one canonical URL and make the navigation point there.
- Replace the old contributing-membership contact with the current secretary contact, or use a role-based IDEA email if available.
- Add a simple "How to join" summary above the long text: dues, contributing membership option, payment link, renewal help, and contact.

### 3. The Contact page currently undermines trust.

Evidence:

- The Contact page contains placeholder contact information: "10 Street Road", "City, 10100", "USA", `mail@example.com`, and `(555) 555 1234`.
- The same page footer contains the real secretary contact.
- The mobile screenshot shows the placeholder information and form before the real contact details in the footer.

Recommendation:

- Remove placeholder address, phone, and email immediately.
- Either replace the page with a short named contact section for Jack Simpson, or remove the page from sitemap/navigation until it is ready.
- If the form remains, confirm it routes to the current secretary and add expected response context.

### 4. Current activity is hard to distinguish from archive material.

Evidence:

- 27 of 39 sitemap URLs were last modified in 2022 or earlier.
- The `news-and-events` page was last modified in 2021 and begins with 2022 conference and 2018 prize content.
- The `past-events` page was last modified in 2023 but lists mostly 2014-2022 material.
- The 2022 congress pages remain prominent through sitemap and event-page links.

Recommendation:

- Create one "News and Events" hub with two clearly separated sections: "Current" and "Archive".
- Put dates on every event listing and make past events visibly archived.
- If there is no current event, say that plainly and invite people to join the mailing list or contact the secretary.

### 5. Resource pages need link maintenance and clearer structure.

Evidence:

- `member-resources` lists Reading List, Video Library, Audio, Syllabus, Courses and Degrees.
- Audio and Syllabus appear as text without visible links in the captured DOM.
- The UN Training in Human Development resource returned HTTP 404.
- The site has multiple resource-like URLs, including `member-resources`, `reading-list`, `teaching-resources`, and `teaching-resources/development-ethics-reading-list`.

Recommendation:

- Rework resources into a small library: Reading, Teaching, Video/Audio, Courses, Partner links.
- Mark external links with a short description and review date.
- Remove or replace dead resource links, starting with the UN Training link.

### 6. The leadership page has useful content, but the mobile experience is sparse and image-heavy.

Evidence:

- `officers-board` lists the President, Vice President, Treasurer, Secretary, Board of Directors, Advisory Board, and Past Presidents.
- The page includes 31 visible images in the DOM, all with empty alt attributes in the crawl output.
- Mobile Lighthouse measured the officers page at 5,455 KiB total byte weight, 23.4 s LCP, and 66 performance.
- The mobile screenshot shows a very long, narrow page where many board names are separated by large empty vertical space.

Recommendation:

- Use compact person rows or cards on mobile with image, name, role, and optional affiliation.
- Keep portraits, but use optimized sizes and consistent aspect ratios.
- If portraits are decorative because the person's name is adjacent, empty alt text is acceptable; if not decorative, add meaningful alt text.

## Technical Findings

### Internal links are in good shape.

Evidence:

- 62 internal links checked.
- 0 internal links failed.

Recommendation:

- Keep the sitemap and internal links, but reduce duplicate/legacy pages once content is consolidated.

### External link rot is material.

Evidence:

- 189 external links checked.
- 70 returned non-OK status or failed to connect.
- Confirmed 404 examples include:
  - `https://medellin.travel/en/destinations/santa-fe-de-antioquia`
  - `https://dl.dropboxusercontent.com/u/36043317/IDEA/IDEAmini-conferenceProgram%20NASSP.pdf`
  - `http://hdr.undp.org/en/nhdr/training/`
  - `http://www.brynmawr.edu/internationalstudies/idea/`
  - `http://www.inif.ucr.ac.cr/congreso_inif/docs/MEMORIA.pdf`
- One visible Past Events link points to a Google Sites edit URL rather than a public URL: `https://sites.google.com/d/.../edit`.

Recommendation:

- Prioritize external links on active journey pages first: homepage, joining, member resources, past events, news/events, and officers.
- For archive pages, either repair links or label pages as historical and keep only important public source links.
- Replace the Google Sites edit URL with a public view URL.

### Lighthouse shows acceptable desktop basics, but mobile performance is inconsistent.

Evidence:

- Home desktop: Performance 85, Accessibility 95, Best Practices 100, SEO 100, LCP 2.7 s.
- Home mobile: Accessibility 96, Best Practices 100, SEO 100, but LCP 15.8 s and Speed Index 8.2 s. The mobile performance score was unavailable because Lighthouse reported a trace metric issue, but the timing metrics were still recorded.
- Joining mobile: Performance 65, Accessibility 94, Best Practices 100, SEO 100, LCP 15.4 s, Speed Index 10.5 s.
- Officers Board mobile: Performance 66, Accessibility 96, Best Practices 96, SEO 100, LCP 23.4 s, total page weight 5,455 KiB.
- Lighthouse repeatedly flags one unnamed footer image link.

Recommendation:

- Compress and resize hero/footer/portrait images for actual display sizes.
- Fix the unnamed footer logo link with accessible text or remove the link wrapper.
- Keep SEO basics, but add stronger page-specific titles/descriptions when pages are consolidated.

## Priority Order

1. Remove placeholder Contact page details.
2. Correct the joining page secretary/contact conflict.
3. Point navigation to one canonical joining page.
4. Replace the Google Sites edit URL with a public URL.
5. Repair or remove the highest-traffic dead external links.
6. Add a current activity panel to the homepage.
7. Split News and Events into current vs archive.
8. Clean up resource pages into one simple library.
9. Optimize mobile images and footer accessibility.
