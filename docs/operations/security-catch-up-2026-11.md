# November 2026 security catch-up, part one

Academics Stand Against Poverty (ASAP) received ten bug and security repairs in
September 2026 and dependency updates in September and November 2026. This
site, Rising Dust Adventures, The Brave and the shared template run the same
code and did not receive them. This note records the urgent part for
velvetdinosaur.com, prepared on 17 November 2026.
[Still to do](#still-to-do) lists the rest.

## What changed

1. **Draft pages need a sign-in.** `/api/puck/load` returned the editor's
   saved copy of any page, including changes not yet published, to anyone who
   asked. It now answers 401 without a session. The editor smoke-test header
   is honoured only where `VD_EDITOR_SMOKE_TOKEN` is set, and production
   ignores that unless `VD_ALLOW_EDITOR_SMOKE_IN_PRODUCTION=true`. This site
   sets neither.
2. **The site listens on the loopback address only.** `bun run start` now
   runs `next start --hostname 127.0.0.1`, so nginx is the only way in. Before,
   the slot ports listened on every interface and relied on the firewall.
3. **Libraries with published advisories are upgraded:**

   | Package | Before | After |
   | --- | --- | --- |
   | `next` | 16.2.12 | 16.4.5 |
   | `react`, `react-dom` | 19.2.3 | 19.2.4 |
   | `better-auth` (and its `@better-auth/*` packages) | 1.6.26 | 1.7.15 |
   | `mongoose` | 8.21.0 | 8.24.10 |
   | `sharp` | 0.34.5 | 0.35.5 |
   | `zod` | 4.3.6 | 4.6.7 |
   | `@aws-sdk/client-s3` | 3.965.0 | 3.1141.0 |
   | `@aws-sdk/s3-request-presigner` | 3.964.0 | 3.1141.0 |

   The AWS upgrade removes `fast-xml-parser` from the lockfile. Every other
   lockfile change belongs to one of these packages or its own dependencies.

`bun audit` reported 253 advisories before (10 critical, 109 high) and 217
after (2 critical, 96 high), counting each package and advisory once. Next.js,
Better Auth, Mongoose, Sharp and `fast-xml-parser` no longer appear. The site's
own copy of Zod is fixed; older copies remain inside `tweakcn-ui`, the shadcn
command-line tool and an ESLint plugin. The two remaining critical advisories
are in tools, not in the running site: `basic-ftp` under Lighthouse CI, and
`proxy-addr` under Lighthouse CI and the shadcn command-line tool.

## Code changes the upgrades needed

- **Better Auth 1.7** records how an account was created. Invite acceptance
  now passes `{ method: 'email-password' }` to `createUser`, as ASAP does.
  This site signs in by email and password only, so 1.7's changes to linked
  accounts and email-code sign-in do not apply.
- **Next.js 16.4** rejects `export const runtime` in the share-image routes
  when `cacheComponents` is on. `app/opengraph-image.tsx` and
  `app/twitter-image.tsx` no longer set it; Node.js is the default runtime.
- **Next.js 16.4** types `import.meta.env` with boolean flags, which Bun adds
  to the type of `Bun.env`. `scripts/lib/gws-mail.ts` narrows it before passing
  the environment to a child process.
- The build adds one generated import to `next-env.d.ts`.

The build now prints one warning, for `lib/theme-store.ts`: "Dynamic filesystem
access causes tracing of the whole project". The tracing is not new. The live
slot's previous build already held 42 MB of trace lists, and Next.js 16.4 now
reports it. Only packaged (standalone) deployments use those lists, and this
site runs `next start` from the release slot. The file is identical on every
site, so the one-line fix belongs with the shared files in part two.

## Checks before release

- Better Auth's pre-upgrade check passed on the production database: one
  account, provider `credential`, no duplicate `(providerId, accountId)` pairs
  and no issuer field. Upgrading from 1.6 straight to 1.7.3 or later needs no
  schema change.
- A sign-in rehearsal ran the new build against a throwaway local copy of the
  account data, with outgoing email switched off. A session issued by 1.6.26
  was still accepted. An invitation, email verification, sign-in, password
  reset, sign-out and the sign-in limit (five a minute) all worked. Draft
  pages were refused without a sign-in and loaded with one.
- All quality gates passed. Sharp 0.35.5 changed no pixel in the visual
  baselines, and every Lighthouse run scored 100 in every category.

## Security response headers

Prepared on 20 November 2026, with the template's `lib/security-headers.ts`
and `/api/csp-report`. Only header logic was added to this site's
`proxy.ts`: its routing (NFC redirects, the demo host, blocked paths, the
sign-up origin check) moved unchanged into `routeRequest()`, and `proxy()`
adds the headers to whatever that returns without replacing a value already
set for the path (the file sandbox, `no-referrer` on emailed links). nginx
sends none of these headers for velvetdinosaur.com.

- **Enforced:** `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy` (camera,
  microphone, geolocation, payment and usb off),
  `X-Permitted-Cross-Domain-Policies: none`, `Cross-Origin-Opener-Policy:
  same-origin`, and `Content-Security-Policy: frame-ancestors 'self'
  https://theme.velvetdinosaur.com`: the theme editor's live preview still
  shows the site; other sites, which can frame it today, no longer can. No
  `X-Frame-Options`, which cannot name the editor. In production
  `Strict-Transport-Security: max-age=31536000`, for velvetdinosaur.com only.
- **Report-only:** the template's policy with the GA4 and Clarity script
  hosts (both ids are set in production); the Google map on /contact is
  allowed by `frame-src https:`. Reports go to `/api/csp-report`, which
  counts them per day, directive and blocked host in `csp_report_counts`
  (nothing about the page or visitor; read with
  `db.csp_report_counts.find().sort({ day: -1, count: -1 })`).
- Measured on 20 November 2026 in Chromium, with the policy added to the
  live pages by the browser: 29 pages (the sitemap's 18, the pages they link
  to, the NFC card, sign-in and sign-up, the three emailed-link pages and an
  unknown address), with analytics loaded: no report.

Owner decisions: `includeSubDomains` or `preload` on HSTS (they would cover
every `*.velvetdinosaur.com` host and are slow to undo), and when to enforce
the policy (the same policy plus `frame-ancestors` as
`Content-Security-Policy` in `lib/security-headers.ts`), once the counts stay
empty for public pages, the editor and the admin screens.

## Event campaign sends

Prepared on 20 November 2026: ASAP's September repair 3, "event campaign
duplicates" (ASAP commit c5fe5af), as the template received it in dbb839d
(not landed yet), so that each person registered for an event receives a
campaign email once. The code is ASAP's, file for file, and the same as the
template's; only the tests marked "Not in ASAP" are the template's own.

- **What could go wrong before.** Two Dispatch presses at once (two people,
  or one person twice) could send the same campaign twice. Queueing a
  queued campaign again reset every delivery, those already sent included,
  so everyone received it again. An edit to a queued campaign, or to the
  event, changed emails already on their way. A cancel made during a send
  was overwritten when the send finished, and an email whose outcome was
  unclear (Postmark did not answer) counted as failed, so it could be sent
  again.
- **Now.** Each Dispatch takes a one-hour lease on a campaign and claims a
  recipient before sending to them; a second Dispatch finds nothing to do.
  Queueing copies the event's title, date, place and joining instructions
  into the campaign, and only a draft can be edited or queued, once. Queue
  and Unschedule are single transactions, and Unschedule works only before
  the first send. A cancel stops the send before the next recipient. An
  unclear outcome, or a claim left by a send that stopped half way, becomes
  "Needs review" and pauses that campaign: nothing is sent again by itself.
- **What staff see.** A queued campaign can no longer be edited: Unschedule
  it (back to draft), edit, and queue it again. Unschedule is offered for
  queued campaigns only, not for one that is sending. The campaign list
  shows "Needs review: n" and the last error; the delivery log marks rows
  "Sending" or "Needs review", and its filter offers both. The "Email
  delivery follow-up" panel (on the Newsletter and Event Outreach admin
  pages) now also lists event campaign deliveries that need review. "Mark
  accepted" needs Postmark's message ID; "Verified not sent — retry" needs
  a note of the Postmark check and puts the email back in the queue, and it
  goes out at the next Dispatch. Recipients see no change, except that an
  event edited after queueing is shown as it was when queued.
- **Who starts a send.** Still the Dispatch button only. ASAP has an
  internal cron route for event campaigns that nothing calls; it is not
  added here, so a scheduled campaign still waits for a Dispatch after its
  time, as before. This site's five-minute cron sends queued newsletters and retries
  confirmation emails; it does not touch event campaigns.
- **Records already stored.** No migration: the new fields (lease, review
  count, frozen event details, claim and review notes) are read as empty
  when missing. A draft that already has delivery rows (possible after the
  old Unschedule of a campaign that had started sending) can no longer be
  queued again; a new campaign is needed.
- **Campaigns on this site now.** Not known: the database was not read.
  The admin endpoints refuse a request without sign-in, and the web
  server's access log for 6 to 20 November has no request to the Event
  Outreach page or its endpoints, so nothing was queued, edited or sent in
  that time.

**The release handoff is not part of the deploy script.** ASAP's release
closes the event send routes in nginx during the switch, stops the old slot
at once, marks any delivery the old code may have been sending as "Needs
review", and reopens the routes. Here that would change how the site deploys
in two ways: its nginx would need a new include, and the old slot, which
`scripts/deploy-blue-green.ts` keeps running for five minutes so that a
rollback is instant, would have to stop at the switch. Doing the review
marking without stopping the old slot first is not safe: the old code writes
a delivery's outcome without checking its state, and would mark the campaign
completed while rows wait for review. What protects campaigns without it:
once both slots run this code (every release after the one that brings it),
the leases and claims above mean a send that a release stops half way leaves
a claimed row, which the next Dispatch after the one-hour lease marks "Needs
review" instead of sending again. For the release that brings this repair,
the old slot has no claims: release when no event campaign is "Sending" on
the Event Outreach page, and do not press Dispatch from the start of the
release until five minutes after the switch, when the old slot stops.

Tests: ASAP's event campaign tests in `tests/security/mail-integration.test.ts`
(`test:security:integration`, a throwaway one-member replica set), without
its release-handoff test, and the template's additions: an event edited after
queueing does not change the email; a review through the panel's endpoint
needs the Postmark check, and the email is then sent once; the first campaign
queued after a release creates its delivery collection inside its
transaction; and, in `test:security`, `tests/security/event-campaigns.test.tsx`
(the statuses and what the admin lists show).

## Editor HTML parsing (Plate 53)

Prepared on 20 November 2026: ASAP's September repair 10, "Editor HTML
parsing" (ASAP commit c5fe5af), so that a file or a paste cannot run code in
an editor. The editor files are ASAP's, file for file; the exceptions are
listed under [Files](#files-for-the-plate-53-repair).

- **What could go wrong before.** The news editor's Import document button
  handed an HTML file, or the HTML the editor makes from a Word file, to
  Plate 52, which parsed it into the editor's own page. An image in the file
  with an error handler ran that code there, with the rights of whoever was
  signed in (advisory GHSA-qrfj-mgw8-j9c6). Pasted HTML was parsed safely
  but not cleaned: the text of a script or a style became article text, and
  a frame's address, `javascript:` ones included, was stored as a media
  embed.
- **Now.** Plate is 53.3.14, whose parser reads markup into a detached copy
  where nothing runs; every Plate package has ASAP's version, and the
  lockfile resolves them, and Slate, as ASAP's does. Before Plate sees
  imported or pasted HTML, DOMPurify 3.4.17 removes scripts, styles, frames,
  objects, forms, buttons and inputs, event-handler attributes, `srcdoc` and
  `formaction`, and `javascript:` addresses
  (`components/edit/news-editor/safe-html.ts`). Headings, bold and italic,
  lists, tables, links and pictures are kept. Word files are cleaned after
  their conversion to HTML. `bun audit` no longer lists GHSA-qrfj-mgw8-j9c6,
  nor a ReDoS advisory in `js-video-url-parser`, which Plate 53 no longer
  uses; it lists nothing new.
- **Where.** The news editor, the work article editor (a copy of the unused
  second news editor; it gets the same two lines ASAP gave that one), and
  the demo editor on the demo site, which uses the news editor's plugins.
  The email template editor is left as on ASAP: Plate 53's parser and
  Plate's own link check apply to it, but its pastes are not cleaned first.
- **Typing shortcuts.** Plate 53's autoformat plugin does nothing (and Plate
  refuses an editor that has it beside the new rules), so the shortcuts now
  come from Plate 53's input rules: ASAP's
  `components/edit/news-editor/news-input-rules.ts` and
  `news-text-substitutions.ts`, which the registry's
  `plugins/autoformat-kit.tsx` (used by the work editor) now uses too. The
  same 206 key sequences typed into both versions give the same document in
  192 cases in the news editor and 195 in the work editor.
- **What staff see.** In the news editor and the work editor:
  - new shortcuts: `####` to `######` headings, `_italic_`, `^raised^`,
    `~lowered~`, `[] ` and `[x] ` checklists, and in the work editor `|||`
    for two columns;
  - `---` now makes a horizontal rule (in the news editor it used to turn
    into "—-"), but the rule keeps, hidden inside it, the "—" that `--`
    became, which no public page shows; `___ ` (with a space) makes a clean
    rule, and `___` alone no longer does;
  - a horizontal rule no longer breaks the news editor: Plate 52 drew it as
    an `<hr>` with content, which React refuses (error 137), and the whole
    editor went blank as soon as the article had one;
  - a quotation is a box that holds paragraphs: Enter inside it starts a new
    paragraph in the same quotation (it used to break the line), and Enter
    on an empty line leaves it;
  - inside a code block, the heading, list and mark shortcuts now act (`# `
    at the start of a line disappears, `**x**` turns bold); only the
    replacements of quotes, dashes and symbols stay off there. Plate 52 kept
    every shortcut off in code blocks; ASAP has the same change. A fix that
    gives each rule the code-block check ASAP gave the replacements is
    tested (typing then matches Plate 52 there and nothing else changes); it
    belongs in ASAP's file first, so that the shared file stays one file;
  - in the work editor, `***bold italic***`, `__*underlined italic*__` and
    `___***all three***___` no longer format: Plate 53's combination rules
    lose to the plain bold and italic ones, and trying them first turns
    `**bold**` bold and italic, so there is no simple fix. The news editor
    never had these;
  - a numbered list that goes on after indented bullet points goes on
    counting (it used to start again at 1);
  - an article whose last block is a picture, file or table gets its
    trailing empty line when editing starts, not as soon as it opens;
  - exported news files (Markdown, and the HTML, PDF and Word exports made
    from it) no longer repeat a picture's caption as its title, write a link
    whose text is its address without angle brackets, and keep a line break
    inside a quotation;
  - nothing in an imported or pasted document runs, and hidden scripts or
    styles no longer turn into article text.
- **What visitors see.** Nothing changes. Work pages (`/work/<slug>`: the
  summary at the top, the opening paragraph, the body and the page
  description) and the article summaries in newsletter emails come from the
  site's own transform (`lib/news-plate-transform.ts`), which no Plate code
  reaches. It gives the same text for every document compared below, before
  and after the new editor normalizes them, and for new quotations and rules
  too (next point). The demo editor and the demo article on the demo site
  use the news editor's plugins, but they do not load on the base commit
  either ("This page couldn't load"): the demo article's cover picture keeps
  its caption as plain text, and Plate's caption component, which expects
  editor nodes, fails on it. Screenshots of those pages are pixel-identical
  before and after this change. The fault predates this change and does not
  depend on settings, so it probably shows on the live demo site too (not
  checked there); it is left for its own fix.
- **Article text.** The site's own transform (`lib/news-plate-transform.ts`,
  changed in a second commit) reads what Plate 53 stores differently as it
  read Plate 52's. A quotation now holds a paragraph per line: its lines
  read with a space between them, as Plate 52's line breaks did, while text
  and links within a line join as before. A horizontal rule gives no text,
  though Plate 53 keeps in a rule typed as `---` the "—" that `--` became.
  Without this, the sections and the plain text of new articles (the summary
  when none is typed, the reading time, the text a search description is
  written from) ran a quotation's lines together ("QuoteNext line") and
  showed a rule as a "—" paragraph. `lib/news-plate-transform.test.ts`
  (`test:unit`, which runs every test in `lib`) checks both, a link inside a
  quoted paragraph, and a Plate 52 quotation, which reads as before.
- **Stored documents.** No migration, and nothing in the database is
  rewritten. 254 stored-document-shaped values were rendered with the base
  commit and with this change: this site's seeds, fixtures and tests, ASAP's
  test documents, the registry's example documents, and the documents that
  typing every shortcut produced on Plate 52. The site's own transform
  (`lib/news-plate-transform.ts`) gives the same sections and plain text for
  all of them, also after the new editor has normalized them, with and
  without the second commit. Plate's own rendering (the editor, and its
  static renderer) differs only in markup that shows the same: no `start`
  number on bulleted lists (bullets never show one), block ids on nested
  blocks, React's menu ids, and the empty text Plate 52 added around a lone
  link or after a closing picture before anyone typed (Plate 53 adds it at
  the first edit). What shows differently is listed above: the horizontal
  rule, the numbered list that goes on counting, and the exports. Plate 52
  rewrote two shapes as the editor opened, which Plate 53 shows as stored
  until the first edit: the demo article's table, whose cells hold their
  text directly, and two slash-menu inputs left open in a document typed
  with `//` into the work editor (shown as empty lines). A registry example
  with paragraphs nested inside a paragraph, which Plate 52 ran together,
  now shows as separate paragraphs. When an article is changed and saved in
  the new editor, Plate 53 rewrites two things in it: a quotation's text
  moves into a paragraph inside the quotation, and bulleted items lose a
  stored `listStart` that bullets never show (numbered lists keep theirs).
  Neither changes what the site's own transform makes of the article.
- **Release.** Run `bun install --frozen-lockfile` in the release checkout
  first: the lockfile brings Plate 53 and DOMPurify. No setting, cron entry
  or data change is needed. The template's editor baseline copies
  `components/edit/**` to sites but not `package.json` or `bun.lock`: if the
  template's copy of these files reached this site before this change, the
  build would break, so the two go together.

### Files for the Plate 53 repair

Byte for byte as on ASAP (its commit c5fe5af unless noted):

- `components/edit/news-editor/safe-html.ts`, `news-input-rules.ts`,
  `news-text-substitutions.ts` and `news-editor-potion-props.ts` (new), and
  `news-editor-import-export.ts`;
- `registry/components/editor/plugins/autoformat-kit.tsx`, and
  `registry/ui/media-placeholder-node.tsx` and `registry/ui/table-node.tsx`
  (Plate 53 API changes).

Adapted:

- `components/edit/news-editor/news-editor-plugins.ts`: ASAP's change, line
  for line. The file keeps this site's two media lines; ASAP gave media
  embeds and files their own components in an earlier repair (f230852) that
  this site does not have.
- `components/edit/news-article-editor-potion.client.tsx`: ASAP's file
  without one comment line, which names a rule of ASAP's newer Next ESLint
  plugin (16.3) that this site's plugin (16.2) does not have (the lint gate
  fails on it).
- `components/edit/work-article-editor.client.tsx` (this site's own): the
  work editor is a copy of the unused second news editor and gets the same
  two lines ASAP gave that one, so its pastes are cleaned too.
- `package.json`: ASAP's Plate versions, DOMPurify 3.4.17, and the new unit
  test in `test:security` (the visual gate runs every spec in
  `tests/visual`).
- `bun.lock`: resolved so that Plate core and Slate have ASAP's versions; a
  plain install would have taken a newer Plate core (53.5.2) and a second
  copy of Slate. 50 package names change, all of them Plate's own or its
  dependencies.

Not taken:

- `registry/ui/paragraph-node-static.tsx` is not changed: this site's own
  version already renders every static paragraph as a `<div>`, so ASAP's
  later fix 6e1eaf6 for list paragraphs has nothing to do here.
- ASAP's change to `components/edit/news-article-editor.client.tsx` in
  c5fe5af: one ESLint comment line removed and one added (naming the same
  16.3 rule), for ASAP's newer lint setup.
- ASAP's later fixes to its article page renderer (3f11aaf, and the rest of
  6e1eaf6): this site has no such renderer. Their failure, a Plate editor
  rendered outside `<Plate>`, does not occur here: the only such renderings
  are the registry's AI and mention previews, which sit inside an editor, as
  on ASAP.
- `tests/visual/news-editor-media.spec.ts`: it belongs to ASAP's media
  repair (f230852); its three tests for this repair are adapted into
  `tests/visual/news-editor-html-safety.spec.ts`.

Tests:

- `tests/visual/news-editor-html-safety.spec.ts` (the visual gate, which
  runs every spec), in desktop Chromium and phone WebKit: an HTML file, an
  HTML paste and a Word file, each with formatting and with hidden scripts,
  event handlers, frames and `javascript:` links, go into the news editor.
  The formatting must arrive, no hidden code may run, no hostile markup may
  reach what Plate deserializes or be parsed into the editor's page, and
  none of it may show as text. A fourth test types headings, bold, italic,
  an arrow, lists and a quotation. The paste is built in the page, because
  the browser's own clipboard would clean it first. On the base commit
  (3e8b677) the import, paste and Word tests fail in both browsers, for the
  reasons they exist: the imported HTML file was parsed into the editor's
  own page, where its picture's error handler ran; the Word file's
  `javascript:` link was parsed there too; the original markup reached Plate
  in all three; and the script's text became article text after the HTML
  import and the paste. The typing test passes there. On Plate 53 without
  the cleaning step (tried on the template) nothing runs and nothing is
  parsed into the page, which is the parser fix, but the original markup
  still reaches Plate and the script's text still shows after the HTML
  import and the paste, so the same three tests fail.
- `tests/security/editor-shortcuts.test.ts` (`test:security`, in its own
  `bun` process): sixteen checks type the shortcuts, one key at a time, into
  the news editor's plugins. They pass on the base commit and here, and all
  sixteen fail on Plate 53 without the new input rules.
- `lib/news-plate-transform.test.ts` (`test:unit`, which runs every test in
  `lib`; second commit): seven checks of the article transform. Six fail
  without the second commit (a quotation's lines run together, a rule shows
  as "—"); a Plate 52 quotation reads the same with and without it.

## Still to do

Part two brings over the rest of ASAP's work:

- the other September repairs: uploaded active content, webhook
  suppression, confirmation links opened by mail scanners,
  sign-up disclosure, false email success, trusting only nginx's `X-Real-IP`
  for the visitor address; editor HTML parsing (Plate 53) is prepared, see
  [Editor HTML parsing](#editor-html-parsing-plate-53);
- the stricter request filter in `proxy.ts` (cross-site request checks; the
  security headers are prepared, see
  [Security response headers](#security-response-headers));
- ASAP's `overrides` for packages whose parents pin affected versions, the
  ESLint and Lighthouse tooling upgrades, and `bun audit` as a release gate.
