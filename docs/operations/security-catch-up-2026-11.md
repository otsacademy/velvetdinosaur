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

## Still to do

Part two brings over the rest of ASAP's work:

- the other September repairs: uploaded active content, event campaign
  duplicates, webhook suppression, confirmation links opened by mail scanners,
  sign-up disclosure, false email success, trusting only nginx's `X-Real-IP`
  for the visitor address, and editor HTML parsing (Plate 53);
- the stricter request filter in `proxy.ts` (cross-site request checks; the
  security headers are prepared, see
  [Security response headers](#security-response-headers));
- ASAP's `overrides` for packages whose parents pin affected versions, the
  ESLint and Lighthouse tooling upgrades, and `bun audit` as a release gate.
