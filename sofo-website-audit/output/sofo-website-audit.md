# Practical Website Audit for Soldiers of Oxfordshire Museum

Draft for Velvet Dinosaur review and editing

Audit date: 9 June 2026

Prepared for: Soldiers of Oxfordshire Museum

Prepared by: Velvet Dinosaur

Branding space intentionally left at the top for a logo or cover treatment.

## Executive Summary

The Soldiers of Oxfordshire Museum website already has strong raw material. It presents a distinctive museum, a clear Woodstock location, practical visit information, live events, a rich research offer, online talks, collections content, supporter routes, and good trust signals such as charity status, an Accredited Museum mark, contact details, reviews, and Blenheim-related visitor information.

The main opportunity is not to add more content. It is to help visitors choose the right path faster, especially on mobile. The site currently asks users to work through dense navigation, duplicated route names, long page layouts, and some technical maintenance issues before reaching the action they need.

The highest-impact improvements are practical and achievable:

1. Simplify the top navigation and first-screen calls to action.
2. Make Visit Us, What's On, Learning, Support, Research, and Shop easier to scan on mobile.
3. Fix recurring link issues, especially shop category URLs, legacy collection images, broken PDFs, and malformed email/external links.
4. Improve accessibility basics: alt text, heading order, link names, contrast, iframe titles, and PDF labelling.
5. Add page-level SEO basics such as meta descriptions, cleaner H1 structure, local tourism schema, and clearer page summaries.

The tone of this audit is intentionally practical. The site is doing many important things well. The recommendations below are mostly about reducing friction, improving confidence, and making the existing strengths easier to find.

## Evidence Base

This audit used a live review of public pages on 9 June 2026.

Evidence captured:

- 541 rendered public URLs selected from the WordPress sitemap content types: pages, posts, products, staff, exhibits, gallery images, soldiers, and supporters.
- HTML, text, and rendered page JSON saved under `sofo-website-audit/evidence/`.
- 40 screenshots captured: desktop and mobile screenshots for 20 priority journey pages.
- 3,025 internal URLs checked from captured pages.
- 164 visible external URLs checked from captured pages.
- Lighthouse reports captured for five priority pages on mobile and desktop: homepage, Visit Us, What's On, Learning at SOFO, and Shop.
- Local tourism visibility spot-checks included SOFO's own site, Good Journey, Cotswolds Tourism, TripAdvisor, Blenheim Palace, Wake Up to Woodstock, and other public listings.

Priority pages reviewed in detail included:

| Area | Pages |
|---|---|
| Core visit planning | Homepage, Visit Us, What's On, Galleries/Exhibitions, About |
| Families and schools | Learning at SOFO, Activities for Schools, Family Fun at SOFO, school planning pages |
| Events and booking | What's On, current event product pages, online talks, shop, cart/checkout behaviour |
| Supporters | Support Us, Become a Friend, volunteers, sponsors/supporters, legacy giving |
| Research and collections | Collections, Soldier Search, Research, Archive Enquiry, Online Exhibits, Online Talks, collection object pages |
| Maintenance sample | Public test/untitled pages, legacy archive pages, product catalogue pages, supporter pages |

## What The Site Already Does Well

SOFO has a clear and distinctive subject. The site consistently anchors the museum in Oxfordshire's military heritage, local stories, conflict, peace, families, schools, and research.

Visit Us contains genuinely useful information: opening times, admission prices, Blenheim Annual Pass offer, GoodJourney information, autism-friendly visits, parking, bus and train guidance, welcome guides, and local area links.

The site has a wide range of content for different audiences: first-time visitors, families, schools, adult learners, military history audiences, online talk viewers, researchers, supporters, volunteers, and shoppers.

The research offer is a real differentiator. The combination of Soldier Search, archive enquiries, paid research, object pages, and online talks gives SOFO a stronger digital offer than many small museums.

Trust signals are present: the address, phone/email, charity number, Accredited Museum mark, review links, supporter logos, and Blenheim/GoodJourney context all help reassure visitors.

## Top Five Fixes

| Priority | Fix | Why It Matters |
|---|---|---|
| 1 | Simplify the header and homepage choices | The desktop header shows two dense navigation rows, and mobile hides the full choice set behind a hamburger. Visitors need quick paths to Visit, Book, What's On, Learn, Research, and Support. |
| 2 | Fix recurring broken link patterns | The check found 1,124 internal 404s. Most are pattern-based, especially shop category URLs and old `/pilot/` image URLs, so a small number of template fixes could remove many failures. |
| 3 | Add meta descriptions and clean H1 structure | All 541 captured pages lacked detected meta descriptions. 200 pages had no visible H1 and 132 had multiple H1s. This affects search clarity, accessibility, and page comprehension. |
| 4 | Improve accessibility basics | Lighthouse flagged image alt text, unnamed links, heading order, contrast, and iframe titles. The crawl found missing alt text on 540 of 541 rendered pages. |
| 5 | Improve mobile event and visit planning | Visit Us is useful but very long on mobile. What's On has a calendar and product links but also a long blank stretch in the mobile screenshot. These are high-value visitor journeys. |

## Visitor Journeys

### First-Time Visitor And Tourist Planning A Visit

The homepage gives a strong visual sense of the museum and presents three useful first choices: Events, Exhibitions, and Visit Us. The address, phone, email, social links, and search are visible.

The friction is choice overload. On desktop, the first screen includes two navigation rows with overlapping labels: Home, Events, Exhibitions, Collections, Friends' Membership, Visit, Shop, Basket, My Account, Oxfordshire's Military Heritage in 50 Objects, Research, Learning, Online Talks, Blog, Support Us, Room Hire, Image Services, and About. A first-time visitor who simply wants opening times, tickets, parking, or current exhibitions has to scan a lot.

The Visit Us page is strong once reached. It includes opening times, admission prices, last admission, Blenheim Annual Pass information, GoodJourney, parking, public transport, autism-friendly visits, welcome guides, and local links. On mobile, however, it becomes a very long page with many small sections.

Recommendations:

- Add a compact "Plan your visit" strip near the top of the homepage with today's opening pattern, "Book tickets", "Find us", "What's on", and "Blenheim pass offer".
- Reduce the main navigation to one primary row on desktop and a clearer grouped menu on mobile.
- On Visit Us, add a short jump list near the top: Opening Times, Tickets, Getting Here, Access, Groups, Local Area.
- Make "Book tickets" and "Plan your visit" more visually consistent across homepage, Visit Us, and What's On.

### Families And Schools

SOFO has good family and school material. The site includes Learning at SOFO, Activities for Schools, Family Fun at SOFO, primary and secondary school visit planning, assemblies, loan boxes, educational resources, autism-friendly visits, and kids/family pages.

The issue is discoverability and duplication. Older `educationalresources` URLs coexist with newer `learning-at-sofo` routes. Some learning links from the Learning page are image/icon based with little visible link text in the crawl. That makes the section feel thinner than it is.

Recommendations:

- Make Learning the canonical hub for schools, families, outreach, and lifelong learning.
- Keep older resource URLs live if they have value, but route users from them back to the newer Learning hub.
- Give each learning card clear text labels and short summaries, not only image links.
- Add one "For teachers" section with visit planning, curriculum relevance, costs, access, booking, and contact email.

### Events, Exhibitions, And Booking

The What's On page uses an events calendar and explains that users can click an event title to reach the shop/product page for tickets where applicable. The June 2026 calendar includes current events such as talks, object handling, model-making sessions, Veterans Coffee and Chat, and Iraqi Women, Art & War activities.

The booking route works conceptually, but the experience can feel fragmented because events become WooCommerce products. Some product titles are very long. Product pages are also included in the shop catalogue alongside books and gifts, which can blur the distinction between "book an event" and "buy from the shop".

One small QA example: the product URL for "Meet Me at the Soldiers Museum | 2pm - 4pm | Thursday 4 June 2026" includes `34-june-2026` in the slug, even though the page title/body say 4 June 2026. That is minor, but it is the sort of detail that can reduce confidence around event booking.

The mobile screenshot of What's On shows the calendar and one event block, then a large blank area before the footer. This makes the page feel unfinished on mobile.

Recommendations:

- Create a current events list below or beside the calendar with plain cards: date, event title, type, price/free, booking status, and "Book" or "More details".
- Keep event products in WooCommerce if that is operationally easiest, but present them to visitors as events first and products second.
- Add a recurring event QA checklist: date, title, slug, stock, price, image alt, excerpt, canonical event page, and sold-out/postponed state.
- Fix the mobile spacing/blank area on What's On.
- Separate shop browsing from event booking in navigation and page headings.

### Supporter Or Friend

The supporter content is strong. Support Us, Become a Friend, volunteers, ambassadors, sponsors, in memoriam, legacy giving, easyfundraising, donations, and the Oxfordshire Military Family Tree campaign all exist.

The challenge is that support routes compete with each other. The user may see Support Us, Friends' Membership, Become a Friend, Become a Volunteer, Military Family Tree, sponsors, ambassadors, shop, and donations in different places. These are all valid, but they would be more persuasive as one supporter journey.

Recommendations:

- Create one supporter hub with clear choices: Donate, Become a Friend, Volunteer, Leave a Legacy, Sponsor, Support a Project, Shop.
- Keep the donation CTA consistent and reduce the number of different donation destination styles where possible.
- On Become a Friend, bring current membership benefits and sign-up action closer to the top before the long history of past events.
- Use the Impact Report PDF on Support Us as a trust asset, with a short summary on the page for users who do not open PDFs.

### Researcher

The researcher journey is one of the site's strongest assets. The site includes Research, Soldier Search, Soldier Search FAQ, Archive Enquiry, paid research enquiry products, online exhibits, object records, and online talks.

The Research page explains archive enquiry service scope and fees. The Research Enquiry Fee product asks users to contact SOFO before purchase, which is sensible. The route would be clearer if the Research page, Archive Enquiry form, Soldier Search, FAQ, and payment step were visually tied together as one process.

Issues found:

- Soldier Search itself is a very short page in the rendered text capture, so users may not get enough context before searching.
- The archive enquiry page links to a missing "example of a completed enquiry" page.
- Some research resource links returned 404 or were blocked/non-OK in automated checks, including old museum/research links.
- There are malformed email links on a small number of pages, such as relative URLs that include an email address instead of `mailto:`.

Recommendations:

- Add a "Research in three steps" panel: search the database, read the FAQ, submit an enquiry, pay only after confirmation.
- Restore or replace the missing completed-enquiry example.
- Add clearer context to Soldier Search: what is covered, what is not, how to interpret a result, and when to use the paid research service.
- Run a quarterly link check on research resources, because external archives and military history resources move often.

## Key Findings And Recommendations

### 1. Homepage Clarity And First-Screen Calls To Action

The homepage has strong imagery and useful first choices. It quickly communicates that this is a real visitor attraction, not only an archive site. The three large cards for Events, Exhibitions, and Visit Us are helpful.

The first-screen opportunity is to prioritise the actions most visitors need:

- Is the museum open today?
- How much are tickets?
- Can I book now?
- Where is it?
- What is on during my visit?
- Is it good for families/schools?

Recommendations:

- Add a slim visitor information strip above or below the main image/cards.
- Use consistent primary CTAs: Plan your visit, Book tickets, What's on, Support us.
- Keep the homepage story copy, but place the practical visitor actions before campaign banners.
- Make the Blenheim and GoodJourney benefits visible from Visit Us and optionally homepage, because they are useful local tourism hooks.

### 2. Navigation And Duplicate Menu Complexity

The desktop header uses two visible nav rows. The same or similar choices appear in both rows, and some labels differ for the same route: Visit Us/Visit, Cart/Basket, Become a Friend/Friends' Membership. About appears both as `https://sofo.org.uk/about` and `https://www.sofo.org.uk/about/`.

There are also legacy or overlapping routes:

- `/shop/`, `/sofo-shop/`
- `/galleries/`, `/sofo-galleries/`, `/sofo-gallery/`
- `/collection/`, `/collection1/`, `/collection-2/`, `/collection-3/`
- `/learning-at-sofo/` and older `/educationalresources/` routes

Recommendations:

- Define one canonical navigation structure and redirect or de-emphasise legacy routes.
- Keep the public menu focused: Visit, What's On, Exhibitions, Learning, Collections/Research, Support, Shop, About.
- Move My Account, Cart/Basket, search, and social links into secondary utilities.
- Use one canonical domain style, preferably `https://www.sofo.org.uk/...`, across internal links.

### 3. Events, Booking, Donation, And Shop Flow

The site uses WooCommerce for shop products, ticketed events, free event reservations, paid research services, image services, and physical products. That is understandable operationally, but the front-end should keep visitor journeys distinct.

Key evidence:

- The shop page mixes all products and services alphabetically, including event tickets and books.
- Many product pages generate broken relative shop category URLs: 1,086 internal 404s matched the `/product/.../sofo-shop-category/` pattern.
- The event calendar links users into product pages using product IDs and product slugs.
- The checkout route redirects to cart when empty, which is acceptable, but the user-facing labels should be consistent.

Recommendations:

- Fix the shop category URL template so product tags/categories do not become broken relative paths.
- Give events a visitor-friendly listing view and keep WooCommerce as the back-end checkout step.
- Use clear product excerpts for tickets: date, time, location, access, refund/cancellation note, and who it is for.
- Keep donation, Friend membership, and shop purchase flows visually distinct.

### 4. Accessibility

The site has good intent around accessibility. Visit Us includes autism-friendly visit information, access guides, welcome guides, and contact routes. That is a strength.

The technical accessibility basics need attention:

- Missing alt text was detected on visible images across 540 of 541 rendered pages.
- Lighthouse flagged image alt text and unnamed links on every sampled priority page.
- Lighthouse flagged heading order issues, especially on Visit Us and Learning.
- 200 captured pages had no visible H1; 132 had multiple H1s.
- The Visit Us Lighthouse report flagged an iframe without a title.
- Shop Lighthouse reports flagged contrast issues and accessible-name mismatches.
- Many icon/image links have empty visible text in the crawl.
- PDFs and downloadable guides are useful, but the audit did not verify whether the PDFs themselves are tagged and accessible.

Recommendations:

- Add meaningful alt text to content images and empty alt text only for genuinely decorative images.
- Fix page templates so each page has one clear H1, then logical H2/H3 sections.
- Add accessible names to icon/image links and social links.
- Add a title to embedded iframes such as maps or booking widgets.
- Improve contrast on shop elements flagged by Lighthouse.
- Add file type/language labels to PDF links, and check key PDFs for tagging and reading order.

### 5. Mobile Usability And Content Density

The mobile site is usable, but several priority journeys are dense.

Observed examples:

- Homepage mobile hides the full navigation behind a hamburger and stacks the three main cards cleanly.
- Visit Us is extremely long on mobile, with many useful details but no visible jump navigation.
- What's On shows a calendar and event items, then a large blank area before the footer.
- Long product/event titles create scanning friction on small screens.

Recommendations:

- Add top-of-page anchors for Visit Us and Research.
- Add compact event cards below the calendar on mobile.
- Reduce blank vertical space on What's On.
- Use shorter mobile event card titles, with full details on the event page.
- Consider sticky mobile CTAs for Book tickets and What's On on visitor-facing pages.

### 6. SEO Basics And Local Tourism Discoverability

The site has many indexable pages and generally descriptive page titles, but basic SEO metadata needs work.

Evidence:

- All 541 rendered pages lacked a detected meta description.
- H1 structure is inconsistent across the site.
- Public sitemap/content includes `test-page` and `/untitled/`, which should be reviewed for indexability and naming.
- Local tourism listings exist on sites such as Cotswolds Tourism, Good Journey, TripAdvisor, Blenheim Palace, Wake Up to Woodstock, Daily Info, and other attraction directories.
- Visit Us includes strong local hooks: Woodstock, Oxfordshire Museum, Blenheim Palace, GoodJourney, parking, public transport, and welcome guides.

Recommendations:

- Add unique meta descriptions for the top 30 pages first: homepage, Visit Us, What's On, Galleries, Learning, Research, Soldier Search, Support Us, Become a Friend, Shop, Online Talks, and current exhibition/event pages.
- Add structured data where appropriate: Museum, TouristAttraction, LocalBusiness, Event, Product, FAQ, and Breadcrumb.
- Review public sitemap entries and noindex or remove test/empty/legacy pages that should not appear in search.
- Make the Blenheim Palace proximity, Woodstock location, family suitability, GoodJourney offer, and annual-pass offer part of page metadata and visible copy.
- Keep local listings accurate and consistent with the site for phone, address, opening times, ticket offer, and primary URL.

### 7. Performance

Desktop performance is generally acceptable in the sample. Mobile performance is weaker.

Lighthouse summary:

| Page | Mobile Performance | Desktop Performance | Mobile LCP | Total Byte Weight |
|---|---:|---:|---|---|
| Homepage | 65 | 84 | 8.8 s | 4,802 KiB |
| Visit Us | 64 | 90 | 8.3 s | 2,277 KiB |
| What's On | 68 | 87 | 7.4 s | 3,256 KiB |
| Learning at SOFO | 67 | 80 | 9.5 s | 2,713 KiB mobile / 6,420 KiB desktop |
| Shop | 65 | 84 | 9.7 s | 4,833 KiB mobile |

Recommendations:

- Compress and resize large images, especially homepage, shop, learning, event, and gallery images.
- Serve modern formats where possible.
- Lazy-load below-the-fold images, but keep first-screen imagery prioritised.
- Review third-party scripts and console errors flagged by Lighthouse.
- Cache static assets aggressively.
- Re-test after image and template changes.

### 8. Link Health And Content Maintenance

The link checks found a high raw number of issues, but many are caused by a few repeated patterns.

Internal link findings:

- 3,025 internal URLs checked.
- 1,124 returned 404.
- 1,086 of those matched a repeated broken shop category URL pattern under product pages.
- 25 were old `/pilot/wp-content/uploads/...` media/image URLs used by exhibit pages.
- 3 were email addresses accidentally treated as relative page URLs.
- Broken examples included:
  - `https://www.sofo.org.uk/example-of-a-completed-enquiry-for-100/` from Archive Enquiry.
  - `https://www.sofo.org.uk/wp-content/uploads/2019/08/...Spanish.pd` from Visit Us.
  - `https://www.sofo.org.uk/wp-content/uploads/2017/03/Praetorians-Leaflet.pdf` from Become a Praetorian.
  - `https://www.sofo.org.uk/dday80/` from Oxfordshire D-Day Stories.
  - `https://www.sofo.org.uk/homeguard.php` from Oxfordshire's Regiments.

External link findings:

- 164 visible external URLs checked.
- 30 returned non-OK, failed, or were blocked.
- Some automated failures are likely bot blocking, especially TripAdvisor, Google Forms, and some institutional sites.
- Clear issues included malformed `lhttps://www.littletroopers.net/`, an old Donr support link returning 404, old British Legion/Blenheim PDF/resource links, and old research/museum links returning 404.

Recommendations:

- Fix the WooCommerce/category URL pattern first, because it removes the majority of internal 404s.
- Restore, replace, or remove broken PDFs and old archive resources.
- Convert accidental email URL links into proper `mailto:` links.
- Add redirects for high-value old pages where content has moved.
- Run a monthly or quarterly link check and review failures by source page.

### 9. Trust Signals And Contact Consistency

The site has good trust material: address, email, phone, charity number, Accredited Museum mark, reviews, supporter pages, impact report, and links to local visitor partners.

One important consistency issue: the header screenshot and rendered text show `01993 810 210`, while footer and Visit Us content show `01993 810 211` for general enquiries and event tickets. If both numbers are valid, label them clearly. If one is preferred, use it consistently.

Recommendations:

- Standardise phone numbers and contact labels across header, footer, Visit Us, booking pages, and external listings.
- Put key trust details near relevant actions: charity number near donations, access/reviews near Visit Us, support impact near Donate/Friend pages.
- Use local partner trust more actively: Blenheim pass offer, GoodJourney, TripAdvisor/Google reviews, and Woodstock setting.

## Prioritised Action Plan

### Quick Wins: Next 7 Days

- Fix the phone number mismatch or label each number's purpose clearly.
- Repair the malformed Little Troopers external link.
- Fix the broken Spanish welcome guide URL ending in `.pd`.
- Restore/remove the broken Praetorians leaflet PDF.
- Restore/remove the missing completed-enquiry example from Archive Enquiry.
- Fix accidental email links that resolve as page URLs, such as `engagement@sofo.org.uk` under `/collection/`.
- Review public `test-page` and `/untitled/`; noindex, rename, redirect, or remove as appropriate.
- Correct the `34-june-2026` product slug for the 4 June 2026 event.
- Add meta descriptions to the homepage, Visit Us, What's On, Galleries, Learning, Support Us, Research, Soldier Search, Shop, and Online Talks.
- Add a small homepage "Plan your visit" strip with opening pattern, ticket CTA, location, and What's On.

### Practical Improvements: Next 30 Days

- Simplify the main navigation and remove duplicate labels.
- Decide canonical routes for Shop, Galleries, Collections, and Learning; redirect or de-emphasise older alternatives.
- Fix the repeated WooCommerce `sofo-shop-category` 404 pattern.
- Add clear text labels to image/icon links.
- Create an alt-text pass for priority pages and templates.
- Add one H1 per page template and rationalise H2/H3 structure.
- Improve the mobile What's On layout and remove the blank space.
- Add event cards below the calendar.
- Compress major images and re-run Lighthouse.
- Add structured data for Museum/TouristAttraction, Events, Products, FAQ, and Breadcrumbs where appropriate.

### Larger Improvements For Later Discussion

- Review the CMS/page-builder templates that produce multiple H1s, missing metadata, image links without names, and duplicated navigation.
- Create a redesigned information architecture around visitor tasks: Visit, What's On, Learning, Research, Support, Shop.
- Build a more polished event system that separates event discovery from WooCommerce checkout.
- Create a content governance checklist for every new page/event/product: title, slug, meta description, H1, excerpt, image alt, date, price, CTA, redirects, and link check.
- Consider a refreshed visual system for high-value pages while preserving the museum's existing brand and strong imagery.

## Lighthouse Appendix

Scores below are single local Lighthouse runs captured on 9 June 2026. They should be treated as directional rather than absolute.

| Page | Device | Performance | Accessibility | Best Practices | SEO | Notes |
|---|---|---:|---:|---:|---:|---|
| Homepage | Mobile | 65 | 87 | 96 | 86 | LCP 8.8 s, total size 4,802 KiB |
| Homepage | Desktop | 84 | 88 | 96 | 83 | LCP 2.6 s |
| Visit Us | Mobile | 64 | 77 | 78 | 86 | LCP 8.3 s; heading, iframe title, alt text, contrast |
| Visit Us | Desktop | 90 | 77 | 78 | 83 | LCP 1.9 s |
| What's On | Mobile | 68 | 86 | 96 | 79 | LCP 7.4 s; font size/link/alt issues |
| What's On | Desktop | 87 | 86 | 96 | 83 | LCP 2.3 s |
| Learning at SOFO | Mobile | 67 | 85 | 96 | 86 | LCP 9.5 s; heading, link, alt issues |
| Learning at SOFO | Desktop | 80 | 86 | 96 | 83 | LCP 3.2 s |
| Shop | Mobile | 65 | 83 | 96 | 84 | LCP 9.7 s; contrast and accessible-name issues |
| Shop | Desktop | 84 | 83 | 96 | 83 | LCP 2.7 s |

## Evidence Files

The detailed evidence is saved locally:

- Crawl summary: `sofo-website-audit/evidence/crawl-summary.json`
- Rendered pages: `sofo-website-audit/evidence/pages/`
- Text captures: `sofo-website-audit/evidence/text/`
- Screenshots: `sofo-website-audit/screenshots/`
- Internal link checks: `sofo-website-audit/evidence/internal-link-checks.json`
- External link checks: `sofo-website-audit/evidence/external-link-checks.json`
- Lighthouse reports: `sofo-website-audit/evidence/lighthouse/`

## Closing Note

SOFO's website already has the essential ingredients: real visitor value, a strong local story, a rich collection, practical visit information, a meaningful research offer, and clear ways to support the museum.

The quickest gains are maintenance and clarity. Fixing repeated link patterns, reducing navigation duplication, adding metadata, improving accessibility basics, and making mobile visit/event journeys easier would make the site feel more confident without requiring a full rebuild.

There is also a larger opportunity to shape the site around its main audiences: visitors, families/schools, event attendees, supporters, and researchers. That would be a useful next discussion once the quick wins are complete.
