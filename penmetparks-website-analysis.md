# PenMet Parks Website Redesign and CMS Public Audit

Prepared for Velvet Dinosaur  
Audit date: 2026-06-16  
Target: https://penmetparks.org/  
Official RFP verified: https://penmetparks.org/wp-content/uploads/2026/06/20260603-RFP-Website-CMS-date-updated.pdf

## Executive Summary

PenMet Parks' public website is a WordPress site using a custom `parks` theme, a conventional WordPress page/post model, Yoast SEO, MonsterInsights/GA4, Jetpack-related assets, SiteGround optimization/security plugins, Cloudflare, Constant Contact, ActiveNet, TeamSideline, NextRequest, Dude Solutions/Asset Essentials, Jotform, and a Municode-hosted meeting records embed.

The current site already has many of the right public-sector ingredients: public meeting access, RFP archives, financial reports, policies, resolutions, a search form, sitemaps, responsive WordPress blocks, and links into the recreation registration ecosystem. The primary redesign opportunity is not simply visual modernization. It is information architecture, content governance, accessibility documentation, structured content, PDF remediation, and cleaner handoffs between the public website and third-party systems.

The strongest proposal route for Velvet Dinosaur is Route A: a custom accessible WordPress rebuild. The current site is already WordPress, staff expectations likely map to WordPress editing, and the RFP asks for a government-focused CMS with roles, permissions, scheduling, publishing, archiving, migration, training, support, and hosting. A carefully built WordPress CMS can meet those needs with lower implementation risk than a headless rebuild. Route B, headless WordPress with a Next.js frontend, is technically viable but would add preview, hosting, deployment, search, forms, menu, and handover complexity that does not appear necessary based on the public evidence.

The proposal should position Velvet Dinosaur around a government-ready WordPress CMS, structured content types, WCAG 2.1 AA accessibility process, managed secure hosting, documented support SLAs, migration planning, training for non-technical staff, and 1-year, 3-year, and 5-year support/hosting options. The proposal should avoid overpromising around third-party platform accessibility, guaranteed migration of all legacy PDFs without a PDF inventory, API-level integrations without vendor access, and unlimited content cleanup.

## Audit Scope and Boundaries

This was a read-only public audit. I inspected public pages, public assets, public response headers, public sitemaps, rendered browser output, and public third-party links. I did not log in, submit forms, bypass access controls, run vulnerability scans, use aggressive crawling, or collect personal data.

The RFP requirements were supplied in the prompt. The public RFP PDF URL was verified as reachable, but local PDF text extraction tooling was unavailable, so this report does not claim full clause-by-clause extraction from the PDF.

## Evidence Table

| Evidence | URL or source | Observation | Status |
| --- | --- | --- | --- |
| RFP PDF asset | `https://penmetparks.org/wp-content/uploads/2026/06/20260603-RFP-Website-CMS-date-updated.pdf` | Returned HTTP 200 as `application/pdf`, 299,674 bytes, last modified 2026-06-03 15:31:57 GMT. | Confirmed |
| Homepage document | `https://penmetparks.org/` | Returned WordPress HTML with REST API links, page JSON link for page ID 5062, `x-cache-enabled: True`, `x-proxy-cache: HIT`, Cloudflare server header, and zstd compression. | Confirmed |
| WordPress REST root | `https://penmetparks.org/wp-json/` | Public REST root returned site name, description, timezone, page on front, namespaces, routes, and plugin namespace evidence. | Confirmed |
| Site credits | `https://penmetparks.org/site-credits/` | Main content says: "WordPress Theme Development by Scott Marlow" and "PenMetParks.org is powered by WordPress". | Confirmed |
| Theme path | Homepage HTML | Theme stylesheet loaded from `/wp-content/themes/parks/parks-style.min.css?ver=8.2025`; body class includes `wp-theme-parks`. | Confirmed |
| WordPress media | Homepage and sampled pages | Images and PDFs served from `/wp-content/uploads/YYYY/MM/...`; image markup includes WordPress attachment metadata and generated responsive sizes. | Confirmed |
| Yoast SEO | Homepage HTML and sitemaps | Yoast SEO v27.8 comment, Yoast schema graph, `sitemap_index.xml`, `page-sitemap.xml`, and `post-sitemap.xml`. | Confirmed |
| Robots | `https://penmetparks.org/robots.txt` | Yoast robots block allows public crawling and points to `https://penmetparks.org/sitemap_index.xml`. | Confirmed |
| Page sitemap | `https://penmetparks.org/page-sitemap.xml` | 89 page URLs, including parks, recreation, rentals, board meetings, RFPs, policies, resolutions, financial reports, projects, staff, and contact pages. | Confirmed |
| Post sitemap | `https://penmetparks.org/post-sitemap.xml` | 250 post URLs, including news, RFP posts, budgets, audits, advisories, events, and announcements. | Confirmed |
| Current navigation | Homepage rendered HTML | Top navigation: Home, Recreation, Recreation Center, Parks, Rentals, About Us, Get Involved, Public Information. | Confirmed |
| Recreation parent link | `https://penmetparks.org/?page_id=13985` | The sampled page rendered a "Sorry, this page has moved" 404-style page while still being used as the top-level Recreation menu link. | Confirmed |
| ActiveNet | Homepage, recreation pages, rentals | Links to `anc.apm.activecommunities.com/penmetparks` for registration, activity search, memberships, reservations, rental payment, and facility bookings. | Confirmed |
| Youth sports schedules | Youth Sports page | Link to `https://teamsideline.com/sites/penmetparks/schedules` for game and practice schedules. | Confirmed |
| Board meeting records | Board Meetings page | Iframe embeds `https://meetings.municode.com/PublishPage?cid=PENMETWA...`; page references agendas and minutes. | Confirmed |
| Public records request | Main navigation and many pages | External link to `https://penmetparkswa.nextrequest.com/`. | Confirmed |
| Park maintenance requests | Sidebar and maintenance page | Links to `https://citizenportal.dudesolutions.com/PenMetParks`; help links reference Asset Essentials Gov documentation. | Confirmed |
| Jotform | Sports, camps, rental, event pages | Public links to `form.jotform.com` for applications and interest forms. Forms were not submitted. | Confirmed |
| Constant Contact | Homepage network and content | Script from `static.ctctcdn.com`; newsletter CTA points to `https://lp.constantcontactpages.com/sl/MAiy9dA`. | Confirmed |
| Analytics | Homepage HTML/network | MonsterInsights plugin v10.2.2 loads GA4 ID `G-TKNNCJNP8Z` and `googletagmanager.com/gtag/js`. | Confirmed |
| Accessibility plugin assets | Homepage network and REST namespaces | `accessibility-checker` / `edac` assets and namespaces present, including `edac-sr-only-format.min.css` and `edac-frontend-fixes.min.js`. | Confirmed |
| SiteGround plugins | REST namespaces and optimized asset paths | Public REST namespaces include `siteground-optimizer`, `siteground-settings`, `sg-security`, and `sg-ai-studio`; optimized JS served from `/wp-content/uploads/siteground-optimizer-assets/`. | Confirmed |
| Jetpack | Network and REST namespaces | Jetpack carousel/swiper assets and multiple Jetpack REST namespaces present. | Confirmed |
| Accordion blocks | Network and REST namespaces | `accordion-blocks` CSS/JS and REST namespace present. | Confirmed |
| WP Browser Update | Network | CSS/JS from `/wp-content/plugins/wp-browser-update/` and config via `wp-admin/admin-ajax.php?action=wpbu_config_js`. | Confirmed |
| Performance Lab | REST and meta generator | REST namespace `performance-lab/v1`; meta generator says `performance-lab 4.1.0`. | Confirmed |
| Redirection plugin | REST namespace | `redirection/v1` namespace exposed in REST root. | Confirmed |
| Fonts/icons | Network | Google Fonts Outfit, Font Awesome kit, and Font Awesome Pro webfonts load publicly. | Confirmed |
| Security/CDN clues | Headers/network | Cloudflare server headers, Cloudflare email decode script, `x-frame-options: SAMEORIGIN`, `x-content-type-options: nosniff`, and `x-xss-protection`. | Confirmed |
| Hosting inference | Headers/plugin evidence | `host-header`, `x-proxy-cache`, SiteGround plugin namespaces, and SiteGround optimized assets strongly suggest SiteGround-backed WordPress hosting behind Cloudflare. | Likely inference |
| CMS content model | REST routes and sitemaps | Public REST routes expose core `pages` and `posts`; no obvious public custom REST types for parks/events/facilities were observed. Many parks are indexed as page URLs. | Likely inference |

## Current Stack Assessment

### Confirmed stack

- CMS: WordPress.
- Theme: custom `parks` theme, stylesheet version `8.2025`.
- SEO: Yoast SEO v27.8.
- Analytics: MonsterInsights v10.2.2 with GA4 ID `G-TKNNCJNP8Z`.
- CDN/security layer: Cloudflare.
- WordPress optimization/security: SiteGround Optimizer, SiteGround Security, and related SiteGround namespaces.
- Accessibility tooling: Equalize Digital Accessibility Checker / EDAC style and frontend fix assets.
- Content blocks: WordPress block editor output, accordion blocks, block visibility.
- Media: WordPress media library with responsive image sizes and upload year/month paths.
- Forms and signups: WordPress search forms, Constant Contact newsletter, Jotform application forms, Google reCAPTCHA loaded through Constant Contact.
- Third-party public services: ActiveNet, TeamSideline, Municode meetings, NextRequest, Dude Solutions/Asset Essentials, Jotform, Constant Contact, Google/Bing maps, RunSignup, ePACT, MRSC Rosters, Washington state RCW links, CDC, and other reference links.

### Not confirmed from public evidence

- Exact WordPress core version.
- Internal hosting contract, database provider, backup policy, uptime monitoring, or deployment process.
- Staff roles, editorial workflow, approval process, internal CMS pain points, or plugin licensing.
- API-level integration availability for ActiveNet, TeamSideline, Municode, NextRequest, or Dude Solutions.
- Accessibility status of third-party applications and embedded forms.
- Full PDF accessibility status.

## Current WordPress Evidence

The public site gives strong WordPress evidence:

- The Site Credits page explicitly says the site is powered by WordPress.
- The HTML includes `wp-content`, `wp-includes`, `wp-json`, `wp-embed-responsive`, `wp-theme-parks`, `page-id-*`, `post-*`, `wp-block-*`, and WordPress block editor classes.
- The response headers include REST links such as `https://penmetparks.org/wp-json/` and page JSON links.
- The REST root identifies the site as "PenMet Parks" and exposes standard WordPress REST routes for pages, posts, media, menus, widgets, users, types, taxonomies, and block/editor resources.
- The Yoast sitemap index exposes `page-sitemap.xml` and `post-sitemap.xml`.
- Public assets are served from WordPress plugin, theme, and upload paths.
- Image tags include WordPress attachment metadata, responsive image variants, attachment IDs, source sets, and media details.

## Site Structure Map

### Main navigation

- Home
- Recreation
  - Youth Sports
  - Adult Sports
  - Camps
  - Special Events
  - Youth Activities
  - Teen Events and Programs
  - Adult and Senior Activities
  - Specialized Recreation
  - Cancellation and Refunds
  - Financial Assistance for PenMet Parks Programs
  - Pricing Policy
- Recreation Center
  - Recreation Center
  - Neighborhood Greens Mini Golf Course
  - Recreation Center Capital Campaign
  - Recreation Center FAQs
  - Recreation Center Code of Conduct
- Parks
  - Visit a Park
- Rentals
  - Meetings and Events
  - Athletic Fields and Sport Courts
  - Outdoor Spaces
  - Recreation Center Spaces
  - Neighborhood Greens Mini Golf Rentals
  - Youth Party Packages
  - Facility Rental FAQs
  - Pay for Rental
- About Us
  - Our Mission, Vision, and Values
  - Announcements
  - Get Connected
  - Board of Commissioners
  - PenMet Parks Staff
  - Contact Us
  - Community Park Maintenance Request System
  - Lost and Found
- Get Involved
  - Become an Instructor
  - Employment Opportunities
  - Sponsorship and Ways to Give
  - Volunteer for PenMet Parks
- Public Information
  - Board Meetings
  - Requests for Proposals, Qualifications and Invitations to Bid
  - Financial Planning and Reports
  - Claim Information
  - Current Projects
  - Planning and Reports
  - Public Records Request
  - Policies
  - Resolutions
  - PenMet Parks Privacy Policy

### Indexed page groups

The page sitemap confirms 89 page URLs. Important groups include:

- Parks and facilities: `parks/`, `parks/cedrona-bay-boat-launch/`, `parks/demolay-sandspit-nature-preserve/`, `parks/fox-island-fishing-pier/`, `parks/harbor-family-park/`, `parks/hales-pass-park/`, `parks/kopachuck-heights/`, `parks/mccormick-forest-park/`, `parks/narrows-park/`, `parks/peninsula-gardens/`, `parks/rotary-bark-park/`, `parks/rosedale-park/`, `parks/sehmel-homestead-park/`, `parks/sunrise-beach-park/`, `parks/tubbys-trail-dog-park/`, and `parks/wollochet-bay-estuary/`.
- Recreation: youth sports, adult sports, camps, special events, youth activities, teen activities, adult and senior activities, specialized recreation, financial assistance, refunds, pricing policy.
- Recreation Center: recreation center, mini golf course, capital campaign, FAQs, code of conduct, spaces.
- Rentals: rentals, community venues, ballfields/courts, picnic shelters/outdoor spaces, recreation center spaces, mini golf rentals, youth party packages, facility rental FAQs.
- Public information: board meetings, requests for proposals, financial reports, policies, resolutions, claim information, public information, current projects, planning/reports, privacy policy.
- Projects: community recreation center, Peninsula Gardens, aquatics feasibility, dedicated senior space feasibility, Rotary Bark Park trails study, and related project pages.
- About and involvement: mission/vision, staff, contact, maintenance request system, lost and found, volunteer, employment, instructor, sponsorship/ways to give.

### Post and archive structure

The post sitemap confirms 250 posts. Public posts include:

- News and announcements.
- RFP/RFQ/ITB announcements.
- Budget and audit posts.
- Weather and emergency advisories.
- Project updates.
- Event announcements.
- Recreation and registration notices.

This is a good fit for a structured migration where posts, documents, pages, and special content types are separated intentionally rather than carried over as a single flat content pool.

## User Journey Analysis

### Residents and general visitors

Residents need fast access to parks, recreation registration, current projects, board information, public notices, financial information, maintenance reporting, and contact details. The homepage provides quick links, but several important journeys leave the site quickly through ActiveNet, NextRequest, Dude Solutions, or maps. The redesign should make these exits explicit and reassuring.

Current issues:

- The top-level Recreation menu link points to a moved/404-style page.
- Public Information contains high-value civic content, but labels and archives are document-heavy.
- Some page groups rely on long PDF lists, which creates search and accessibility friction.

### Parents and guardians

Parents likely start from Youth Sports, Camps, Youth Activities, Specialized Recreation, or the homepage registration button. They need age ranges, registration windows, fees, schedules, locations, cancellation/refund rules, waivers, emergency contact information, and financial assistance.

Current issues:

- Registration happens in ActiveNet; youth sports schedules happen in TeamSideline; coach forms happen in Jotform; handbooks are PDFs.
- The site provides useful explanatory content, but the journey crosses several platforms.
- The redesign should use program pages that include "what this is", "who it is for", "when registration opens", "where to register", "what happens after registration", and "where schedules live".

### Program participants

Participants need a clear path from program discovery to registration, schedule, location, preparation details, and support contacts. Recreation pages already group programs by category, but some content is block-heavy and manually curated.

Redesign opportunity:

- Add structured program cards or program landing pages with filters by age, season, location, category, and registration status.
- Store ActiveNet URLs and TeamSideline URLs as fields, not hand-edited links embedded across pages.

### Park visitors

Park visitors need find-a-park, amenities, maps/directions, rules, closures, accessibility, hours, parking, restrooms, water access, dog rules, and related maintenance/reporting paths. The parks page and park detail pages are strong foundations.

Redesign opportunity:

- Use a Park content type with amenity fields, geolocation, accessibility features, images, rules, alerts, related projects, and maintenance request CTA.
- Add filters for activities and amenities.
- Add consistent map/directions modules.

### Facility renters

Renters need venue comparison, photos, capacities, rates, availability, policies, application deadlines, insurance/deposit rules, and payment path. Current rental journeys use pages, PDFs, ActiveNet reservation links, Jotform applications, and rental payment links.

Redesign opportunity:

- Build Facility and Rental content types.
- Standardize facility pages with capacity, rate ranges, amenities, documents, booking CTA, application forms, and FAQ content.
- Add a "compare rental spaces" landing page.

### Sports users

Sports users need registration, seasons, rules, coach information, schedules, field/court reservations, handbooks, concussion information, and facility links. Current evidence confirms ActiveNet for registration, TeamSideline for schedules, and Jotform for coach/application forms.

Redesign opportunity:

- Make external platform transitions clear: "Register in ActiveNet", "View schedules in TeamSideline", "Apply to coach in Jotform".
- Store season and platform links as managed fields.

### Volunteers, sponsors, and partners

These users need simple forms, expectations, staff contacts, eligibility, benefits, and follow-up timing. Current navigation includes Become an Instructor, Sponsorship and Ways to Give, Volunteer for PenMet Parks, and volunteer coaches.

Redesign opportunity:

- Separate "volunteer", "coach", "instructor", "vendor", and "sponsor" journeys with clear calls to action and form ownership.
- Track external form links centrally.

### Board meeting and civic users

These users need agendas, minutes, meeting dates, meeting location, public attendance instructions, comment instructions, board members, policies, resolutions, financials, RFPs, and public records requests.

Current evidence:

- Board Meetings page embeds Municode meeting records.
- Public Records Request links to NextRequest.
- Policies, resolutions, financial reports, and RFPs are PDF-heavy.

Redesign opportunity:

- Build a civic information hub with document types, date filters, search, accessible summaries, and clear third-party embed fallback links.
- Maintain a reliable HTML path to critical public documents, not only PDFs.

### Public records users

The current site sends public records users to NextRequest. This is appropriate if NextRequest is the district's system of record, but the website should explain what happens next, where the request portal opens, and who to contact for help.

### Staff editors

The current site appears to rely heavily on pages, posts, block editor layouts, PDF lists, and repeated sidebar widgets. Staff editors likely need simpler editing forms, reusable templates, document metadata, publishing workflows, scheduled archives, and fewer manually maintained links.

Redesign opportunity:

- Give staff structured editing screens by content type.
- Use reusable blocks and restricted fields for high-risk public-sector content.
- Add review dates, archive dates, ownership, and broken-link reporting.

## Integrations Analysis

### Confirmed external systems

| System | Evidence | Role in current journey |
| --- | --- | --- |
| ActiveNet / Active Communities | `anc.apm.activecommunities.com/penmetparks` links across homepage, recreation, rentals, sports, and sidebar | Registration, activity search, memberships, reservations, booking, rental payments |
| TeamSideline | Youth Sports page link to `teamsideline.com/sites/penmetparks/schedules` | Youth sports game and practice schedules |
| Municode meetings | Board Meetings page iframe from `meetings.municode.com/PublishPage?cid=PENMETWA...` | Board meeting agendas/minutes embed |
| NextRequest | `penmetparkswa.nextrequest.com` in Public Information navigation | Public records request portal |
| Dude Solutions / Asset Essentials Gov | `citizenportal.dudesolutions.com/PenMetParks` plus Dude Solutions help documentation | Park maintenance request system |
| Jotform | Multiple `form.jotform.com` links on sports, camps, rentals, and events pages | Applications, interest forms, vendor forms, field/court use forms |
| Constant Contact | Newsletter link and `static.ctctcdn.com` script | E-newsletter signup and embedded signup tooling |
| Google Analytics / Tag Manager | GA4 ID `G-TKNNCJNP8Z` through MonsterInsights | Analytics |
| Google Fonts | `fonts.googleapis.com` and `fonts.gstatic.com` | Outfit webfont |
| Font Awesome | `kit.fontawesome.com` and Font Awesome Pro webfonts | Icons |
| Google Maps / Bing Maps | Map links on address/location pages | Directions/location |
| RunSignup | Special Events page race link | Event/race registration |
| ePACT | Camps page link | Camp emergency/medical information support |
| MRSC Rosters | RFP page link | Public procurement/project detail reference |

### Likely inferences

- The board meeting platform appears to be a Municode/CivicClerk-style records system, but exact contract/vendor scope was not verified beyond the public embed host.
- Dude Solutions maintenance requests likely run through Asset Essentials Gov based on public help URLs, but internal integration and account configuration were not reviewed.
- ActiveNet likely remains the authoritative source for real-time registration, availability, memberships, and payments. A redesign should not promise to replace it unless PenMet explicitly requests that scope and provides vendor/API access.

### Integration strategy for proposal

The proposal should distinguish three levels of integration:

1. Public link integration: safe, predictable, lower cost. Store platform URLs in structured CMS fields and make external transitions clear.
2. Embed integration: useful for meeting records or calendars, but requires accessibility fallback links and monitoring.
3. API/data integration: higher cost and higher risk. Requires vendor documentation, credentials, API terms, security review, and maintenance budget.

## Accessibility Findings

### Measured findings

Lighthouse audits were run on the homepage in mobile and desktop navigation mode:

- Accessibility: 100 on mobile and desktop.
- SEO: 92 on mobile and desktop.
- Best Practices: 77 on mobile and desktop.
- Agentic Browsing: 100 on mobile and desktop.

Homepage Lighthouse passed checks for document title, meta description, valid robots, descriptive link text, image alt attributes, heading order, and color contrast.

### Positive accessibility evidence

- The site includes a "Skip to content" link.
- The main layout exposes banner, navigation, main, complementary/sidebar, and footer regions in rendered output.
- The WordPress search form includes a visible label and a search button with an accessible label.
- Most sampled images included an `alt` attribute.
- Homepage Lighthouse did not identify color contrast failures.
- The site appears to use an accessibility checker plugin, which suggests some awareness of accessibility remediation.

### Accessibility concerns

The following concerns are based on sampled page HTML and Lighthouse output:

- PDF risk is high. In 20 sampled pages, 173 unique PDF links were observed. Policies, resolutions, RFPs, and financial reports are especially PDF-heavy. PDF accessibility and document remediation should be treated as a real project workstream.
- Some sampled pages include empty headings generated by layout/widgets. Examples were common in the sidebar/footer area.
- The maintenance request page has three H1 headings, which weakens heading structure.
- Top-level dropdown menu items such as Recreation Center, Parks, About Us, and Get Involved render as anchor elements without `href`. Lighthouse flags these as non-crawlable links; from an accessibility perspective they should be implemented as buttons or real links with proper menu behavior.
- Several sampled pages include empty `alt` values. Empty alt can be correct for decorative images, but this needs template-level review because some images function as cards or content imagery.
- Third-party journeys are outside full website control. ActiveNet, TeamSideline, NextRequest, Municode, Dude Solutions, Jotform, Constant Contact, and reCAPTCHA should be checked through vendor accessibility statements and targeted manual testing.
- The Board Meetings page relies on an iframe for public meeting records. It needs a robust accessible fallback link and clear context for assistive technology users.
- Public information is document-heavy. WCAG 2.1 AA compliance should cover both HTML templates and documents that remain public and current.

### Recommended accessibility approach

For the proposal, Velvet Dinosaur should commit to:

- WCAG 2.1 AA as the delivery baseline, with a path to 2.2 AA where practical.
- Template-level automated testing using Lighthouse and axe.
- Manual keyboard testing of navigation, search, dropdown menus, forms, modals/accordions, embeds, and key journeys.
- Screen reader spot checks for homepage, parks, programs, rentals, board meetings, public records, search, and document-heavy pages.
- Color contrast review against the new design system.
- Accessible component patterns for menus, filters, accordions, cards, alerts, forms, and search.
- PDF inventory, triage, remediation recommendations, and an agreed remediation budget.
- Accessibility statement and final compliance documentation.
- Vendor accessibility review for third-party systems, with clear caveats for externally controlled experiences.

## Performance and Technical Quality Findings

### Measured homepage performance

A Chrome DevTools performance trace on the homepage reported:

- Lab LCP: 1,076 ms.
- Field LCP from CrUX: 995 ms for the URL.
- Field INP from CrUX: 19 ms.
- CLS: 0.00.
- Document request total duration: about 845 ms.
- Document TTFB in the lab trace: about 834 ms.
- Initial document response was the main failed performance insight; compression was applied and there was no redirect.

### Asset and network observations

- Homepage loaded 53 observed network requests in the browser sample.
- Homepage HTML response body was about 120 KB.
- Sampled page HTML sizes ranged from about 59 KB to 126 KB.
- Static images and many assets have long cache lifetimes.
- HTML is dynamic behind Cloudflare and WordPress cache headers.
- Render-blocking requests included Font Awesome kit, jQuery, jQuery Migrate, Jetpack carousel CSS, Google Fonts CSS, theme CSS, and plugin CSS.
- Third-party scripts included WordPress.com CDN assets, Constant Contact, Font Awesome, Google Analytics/Tag Manager, Google APIs, and Cloudflare email decoding.
- Constant Contact and Font Awesome had relatively short cache lifetimes in the trace.

### Technical risks and opportunities

- Improve initial server response and cache strategy for anonymous public traffic.
- Reduce render-blocking assets, especially global plugin CSS/JS that is not needed on every page.
- Reassess Font Awesome usage. A rebuild can use a smaller local icon strategy or inline SVG components.
- Avoid loading Jetpack carousel or newsletter scripts globally unless needed.
- Optimize images for LCP and responsive delivery.
- Preserve strong caching for media while improving HTML caching rules and invalidation.
- Keep the CMS simpler than the current plugin mix where possible.
- Treat third-party embeds as performance budgets, not free additions.

## SEO and Content Structure Findings

### Positive SEO evidence

- Yoast SEO is active and generating schema, canonical URLs, Open Graph tags, Twitter card tags, breadcrumbs, and XML sitemaps.
- `robots.txt` is valid and points to the sitemap index.
- Public pages are indexable by default.
- Homepage has a meta description and organization schema.
- The site exposes page and post sitemaps.
- Internal search exists.

### SEO and content concerns

- Lighthouse SEO score was 92 on the homepage due to non-crawlable menu anchors.
- The visible navigation contains a top-level Recreation link that leads to a moved/404-style page.
- Public Information includes a visible `__trashed/` URL for Planning and Reports in the menu. This is a content governance and trust issue.
- Some important content is locked in PDFs rather than structured HTML, reducing accessibility, search quality, and reuse.
- Some pages have sparse or missing meta descriptions.
- The `news-announcments` slug appears misspelled and should be redirected if renamed.
- Event content appears split across special event pages, posts, PDFs, race registration, and external links. This weakens event search and archive quality.
- Public documents lack obvious structured metadata on the public pages, such as adoption date, effective date, document type, topic, department, meeting date, or superseded status.

### SEO recommendations

- Replace non-clickable parent anchors with real landing pages or accessible button controls.
- Fix the Recreation parent URL and remove `__trashed/` from public navigation.
- Build structured content types for parks, facilities, programs, events, documents, news, board meetings, and alerts.
- Create clean HTML summaries for document-heavy public information pages, with PDFs as downloads rather than the only content.
- Add metadata-driven document listings with filters by year, type, topic, and status.
- Improve event schema and local business/place schema where useful.
- Implement redirects for renamed slugs and legacy URLs.
- Preserve sitemap coverage and Yoast configuration during migration.

## CMS and Staff Workflow Implications

PenMet likely needs a CMS that supports the following content types and workflows:

| Content type | Recommended fields and workflow |
| --- | --- |
| Parks | Name, address, map coordinates, hours, amenities, accessibility features, activities, rules, closures, maintenance CTA, images, related projects, related rentals |
| Facilities | Facility type, capacity, amenities, room/field/court details, rates, photos, booking CTA, policies, availability guidance, related documents |
| Rentals | Rental category, application deadline, fees, insurance/deposit notes, ActiveNet booking URL, Jotform URL, facility guide, FAQ |
| Programs | Category, audience, ages, season, location, registration window, ActiveNet URL, schedule source, financial assistance, cancellation policy |
| Events | Date/time, location, recurrence, registration URL, vendor forms, sponsor info, cancellation/alert status, related parks/facilities |
| News | Category, publish date, expiration/archive date, related pages, alert flag |
| Alerts | Severity, affected park/program/facility, start/end date, homepage visibility, archive rules |
| Board meetings | Meeting date, agenda, minutes, packet, video/audio, Municode ID/embed URL, public comment instructions, location |
| Public notices | Notice type, date, expiration/archive date, document links, legal/public meeting context |
| RFPs | Title, type, number, issue date, due date, status, addenda, PDF/documents, contact, archive year |
| Policies | Policy number, title, category, adopted/revised dates, status, PDF, HTML summary |
| Resolutions | Resolution number, year, title, adoption date, PDF, related meeting |
| Reports | Type, year/month, period, file, summary, department/owner |
| Staff pages | Staff member, department, role, phone/email, display order |
| Homepage features | Hero, quick links, featured programs, featured parks, alerts, news, upcoming meetings/events |
| External system links | System name, purpose, URL, owner, last reviewed date, accessibility note |

Recommended staff roles:

- Administrator: full CMS and system access.
- Site manager: publishing, menus, homepage, redirects, global settings.
- Department editor: create/edit assigned content.
- Public information publisher: RFPs, board, policies, reports, public notices.
- Recreation editor: programs, events, ActiveNet links, schedules.
- Parks/facilities editor: park pages, facilities, rentals, closures.
- Reviewer/approver: editorial review without full admin access.
- Document manager: PDF uploads, document metadata, archive status.

Recommended workflow features:

- Draft, review, scheduled publish, scheduled expiration, archive status.
- Required fields for high-risk content.
- Last-reviewed dates for external links and public documents.
- Document library metadata.
- Broken link monitoring.
- Redirect management.
- Reusable blocks and locked templates for non-technical editors.
- Training docs and short video walkthroughs for staff.

## WordPress Rebuild Recommendation

### Route A: Custom accessible WordPress rebuild

This is the recommended route.

Benefits:

- Lowest adoption risk because PenMet already uses WordPress.
- Strong fit for non-technical staff editing.
- Mature roles, permissions, scheduling, media, redirects, SEO, and workflow tools.
- Easier supplier handover to another WordPress-capable vendor.
- Lower hosting and maintenance complexity than a decoupled stack.
- Strong support for structured content through custom post types, fields, reusable blocks, and locked templates.
- Better alignment with the RFP's CMS, content migration, training, hosting, support, and compliance requirements.

Risks:

- Plugin sprawl can hurt performance and maintenance if not governed.
- PDF remediation can be large if all historical documents are in scope.
- WordPress security requires disciplined updates, backups, least-privilege roles, WAF, monitoring, and patch process.
- Complex third-party integrations still depend on vendor access and capabilities.

Cost and support implications:

- Lower initial and ongoing cost than headless.
- One primary hosting environment plus staging.
- Easier support staffing and escalation.
- Easier long-term handover.

Recommended architecture:

- WordPress with a custom accessible theme.
- Structured content types and custom fields.
- Block editor with locked patterns for page sections.
- Yoast or equivalent SEO.
- Accessibility checker and automated/manual testing.
- Managed hosting with Cloudflare/WAF, backups, monitoring, and staging.
- A documented deployment and maintenance process.

### Route B: Headless WordPress with Next.js frontend

This route is possible but not recommended as the primary proposal route unless PenMet explicitly prioritizes a decoupled frontend.

Benefits:

- Strong frontend performance control.
- More app-like interface possibilities.
- Clean separation between content API and presentation.
- Potentially strong developer workflow for complex frontend features.

Risks:

- Higher build cost and ongoing maintenance.
- Two systems to host, monitor, deploy, secure, and hand over.
- Preview, search, menus, forms, redirects, media, authentication, and publishing workflows become more complex.
- Editors may experience a less natural WordPress preview/publishing workflow.
- Supplier handover is harder because the next vendor needs both WordPress and Next.js expertise.
- API-level dependencies become more important.

Cost and support implications:

- Higher upfront implementation cost.
- Higher support burden.
- More release coordination.
- More custom code surface area.

Recommended position:

Do not lead with headless. Offer it as an optional future path only if PenMet wants a separate frontend application, very high scale, or a specific API-driven product roadmap.

## Proposal Recommendations

### Recommended CMS route

Velvet Dinosaur should propose a custom accessible WordPress rebuild. The proposal should state that this route preserves PenMet's current CMS familiarity while modernizing design, accessibility, information architecture, structured content, workflow, hosting, and support.

### Accessibility approach

Propose accessibility as a process, not a final checkbox:

- Accessibility discovery and content risk review.
- Accessible design system.
- WCAG 2.1 AA template acceptance criteria.
- Automated Lighthouse and axe testing.
- Manual keyboard testing.
- Screen reader spot checks.
- Third-party accessibility review and documented caveats.
- PDF inventory and remediation plan.
- Accessibility statement and compliance documentation.
- Post-launch accessibility warranty window for template defects.

### Hosting approach

Recommend managed WordPress hosting with:

- Production and staging environments.
- Cloudflare/WAF or equivalent edge protection.
- Daily backups with tested restore process.
- Security updates and plugin update cadence.
- Uptime monitoring.
- Error monitoring.
- TLS, secure headers, and least-privilege access.
- Deployment process with rollback.
- Monthly maintenance report.

### Migration plan

Use a phased migration:

1. Content inventory and owner mapping.
2. Redirect plan and URL preservation strategy.
3. Content model mapping for pages, posts, parks, facilities, programs, events, documents, board records, and public information.
4. PDF inventory and accessibility triage.
5. Content cleanup and rewrite priorities.
6. Automated migration where safe.
7. Manual migration for high-value pages and complex documents.
8. QA review, link checking, redirects, search/sitemap validation.
9. Staff content freeze window and launch checklist.

### Training plan

Include:

- Role-based live training for administrators, public information staff, recreation staff, parks/facilities staff, and general editors.
- Editor handbook.
- Short screen-recorded walkthroughs.
- Training sandbox/staging environment.
- Office-hours support after launch.
- Documentation for recurring tasks: add a park alert, post a meeting, upload an RFP, archive a program, update a rental page, add a news post, update homepage features, and manage documents.

### Support model

Propose a clear support model:

- Critical outage or security incident: 1 business-hour response target, immediate escalation.
- High priority user-impacting issue: 4 business-hour response target.
- Normal content/CMS support: 1 to 2 business-day response target.
- Change requests: estimated and scheduled through a monthly support budget or separate statement of work.
- Escalation path: support desk to technical lead to account lead.
- Monthly maintenance report: updates applied, backups, uptime, issues, recommendations.
- Quarterly review for analytics, accessibility, content governance, and roadmap.

### 1-year, 3-year, and 5-year agreement structure

Do not lead with a single fixed number before scoping content migration and PDF remediation. Structure pricing as:

- One-time redesign/build/migration implementation fee.
- Annual managed hosting, maintenance, support, and accessibility monitoring fee.
- Optional content migration and PDF remediation allowances.
- Optional enhancement bank.

Suggested structure:

- 1-year agreement: full implementation plus one year hosting/support. Highest annual support rate, best for initial compliance and launch certainty.
- 3-year agreement: implementation plus three years hosting/support with annual review, modest annual discount, price predictability, and planned accessibility/content governance checkups.
- 5-year agreement: implementation plus five years hosting/support with the strongest annual discount, lifecycle planning, periodic accessibility reassessment, and a planned design/system refresh allowance.

### Public sector procurement risks

- Scope ambiguity around "integration" versus "public links" versus API synchronization.
- Unknown content volume and PDF remediation burden.
- Third-party system access and vendor cooperation.
- Records retention and public records obligations.
- Open public meeting requirements.
- ADA/WCAG compliance expectations for third-party systems and PDFs.
- Procurement rules around addenda, Q&A, and contract exceptions.
- Hosting/security requirements not visible from public RFP summary.
- Staff availability for content review and migration approval.
- Launch timing around registration seasons, board meetings, and public notices.

### Areas to avoid overpromising

- Do not guarantee full accessibility compliance of ActiveNet, TeamSideline, NextRequest, Municode, Dude Solutions, Jotform, Constant Contact, or reCAPTCHA.
- Do not promise full historical PDF remediation without an inventory and agreed scope.
- Do not promise API integrations without vendor documentation, credentials, and contract permission.
- Do not promise automated migration of all block-editor content without manual QA.
- Do not promise perfect search results without content cleanup and metadata.
- Do not promise unlimited support or unlimited content entry inside a fixed maintenance plan.
- Do not remove current public records or meeting content from accessible public paths during migration.

## Clarification Risks for PenMet

Ask these questions during procurement or discovery:

- What CMS pain points do staff have today?
- How many staff users need access and what roles do they need?
- Which content must be migrated, rewritten, archived, or deleted?
- How many PDFs must remain public and current?
- Which PDFs must be remediated before launch?
- Which third-party systems are under active contract?
- Are API integrations expected, or are managed links/embeds acceptable?
- Who owns ActiveNet, TeamSideline, Municode, NextRequest, Dude Solutions, Jotform, and Constant Contact administration?
- Are there brand guidelines or accessibility standards beyond WCAG 2.1 AA?
- Is there a required hosting environment or security questionnaire?
- Are there records retention policies for web content and documents?
- What are the launch blackout dates around registration, camps, budget, board meetings, or public notices?
- What service level targets are expected for support?
- Should old URLs be preserved exactly, or can redirects be used?

## Appendix: Commands Run and Limitations

### Representative commands and tools

- Downloaded public homepage HTML and headers with a normal browser user agent:
  - `curl -L -A "Mozilla/5.0 ..." https://penmetparks.org/`
- Downloaded public RFP PDF headers and asset:
  - `curl -L -A "Mozilla/5.0 ..." https://penmetparks.org/wp-content/uploads/2026/06/20260603-RFP-Website-CMS-date-updated.pdf`
- Read public `robots.txt`:
  - `curl -L https://penmetparks.org/robots.txt`
- Read public WordPress REST root:
  - `curl -L -H "Accept: application/json" https://penmetparks.org/wp-json/`
- Read Yoast sitemap index and child sitemaps:
  - `curl -L https://penmetparks.org/sitemap_index.xml`
  - `curl -L https://penmetparks.org/page-sitemap.xml`
  - `curl -L https://penmetparks.org/post-sitemap.xml`
- Rendered the homepage in a browser context and captured network requests.
- Ran Chrome DevTools Lighthouse audits on homepage, mobile and desktop navigation mode.
- Ran a Chrome DevTools performance trace on homepage.
- Fetched 20 representative public pages with modest pacing:
  - Site credits
  - Recreation
  - Youth Sports
  - Adult Sports
  - Camps
  - Special Events
  - Youth Activities
  - Specialized Recreation
  - Parks
  - DeMolay Sandspit Park
  - Rentals
  - Community Venues
  - Ballfields
  - Board Meetings
  - Public Information
  - RFPs
  - Financial Reports
  - Policies
  - Resolutions
  - Maintenance Request System
- Parsed downloaded HTML locally for titles, headings, links, PDFs, iframes, forms, image alt attributes, and external domains.

### Limitations

- This was not a vulnerability assessment or penetration test.
- No login-protected CMS/admin pages were inspected.
- No forms were submitted.
- No third-party systems were logged into.
- No aggressive crawler was used.
- Lighthouse was run on the homepage only.
- Accessibility findings are not a full WCAG audit.
- Performance findings are representative, not a full site-wide benchmark.
- PDF text extraction tools were not installed in the local environment, so the RFP PDF was verified as a public PDF asset but not fully extracted locally.
- Third-party platform accessibility and security were not independently audited.

