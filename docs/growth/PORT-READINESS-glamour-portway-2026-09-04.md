# Port status — Glamour and Glow + Portway Dental Care (2026-09-04)

Both comps are pulled and both packages are authored. Glamour and Glow is installed and waiting
on one Lighthouse re-run before release; Portway Dental Care is authored and waiting for the
box. Neither is live to a prospect yet, and **neither link should be sent**.

## 1. The blocker that held this up, and how it cleared

Reading a Claude Design project needs the `user:design:read` scope, which the normal claude.ai
login does not carry. The design MCP server, the `DesignSync` tool, a direct API call and a plain
web fetch all returned 403 `needs_design_scopes`. Only `/design-login` grants it, and no agent can
run it. Once Ian ran it, everything unblocked.

Two things worth keeping for next time:

- **`/design-login` writes a SEPARATE credential.** It lands under `designOauth` in
  `~/.claude/.credentials.json`, with scopes `user:design:read`/`user:design:write`. The main
  `claudeAiOauth` entry is untouched, so a direct API call still 403s unless it uses the design
  token. Diagnose in one call by curling `https://api.anthropic.com/v1/design/mcp` with each.
- **The MCP `read_file` refuses binary**, so design images cannot be pulled that way, and relaying
  base64 through the model corrupts it. `render_preview` returns a short-lived project-scoped
  `serve_url`; fetching each asset relative to that URL downloads bytes straight to disk. All 47
  assets across both projects came down that way, byte-exact, including the transparent RGBA
  cut-outs. The helper is `scratchpad/dsassets.py`.

## 2. What was built

| | Glamour and Glow | Portway Dental Care |
|---|---|---|
| Slug | `glamour-and-glow` | `portway-dental` |
| Design scope | `.gg` | `.pw` |
| Puck blocks | 12 | 13 |
| Seeded pages | 4 + chrome | 6 + chrome |
| Design assets used | 18 | 27 |
| State | installed, gate re-run pending | authored, build pending |

Both packages follow the fleet rules by construction: chrome-host `display: contents` on the
header block, `overflow-x: clip` on the scope, transform-only scroll-driven reveals with a
`prefers-reduced-motion` block, no `.scope a { color: inherit }`, every image through the
`optimized` prop on both branches, and no file over 600 lines.

## 3. Fact-checking — what the comps got right, and the three things they did not

Prices and people check out completely:

- **All 72 of Glamour's prices** match the salon's published list exactly, diffed row by row.
- **All 14 of Portway's team members** — names, roles, qualifications and GDC numbers — match the
  practice's own team page exactly.

Three corrections were needed, all made against the evidence rather than taste:

- **Portway advertises late opening on Wednesdays that the practice does not offer.** The comp's
  utility bar and stats strip both say "Tues & Wed ... until 8pm". The practice's own visible
  hours close Wednesday at 18:00; only its schema.org JSON-LD says 20:00, which is the likely
  source of the comp's wording. The demo advertises Tuesday only.
- **Glamour's marquee advertises a "self-employed hairdresser"** that appears nowhere on the
  salon's site or anywhere in the evidence pack. Replaced with a service the price list carries.
- **Glamour's five-star runs assert a rating the salon never publishes.** The three reviews are
  genuine, but the salon attaches no stars and publishes no aggregate score, so the star runs are
  dropped and the hero badge reworded.

**The evidence pack itself was wrong about the reviews, and this is the trap worth remembering.**
The pack recorded "no testimonials published", taken from a raw `curl` of the home page. The
salon does publish three, under the heading "Find out what our clients are saying!" — the GoDaddy
builder renders them client-side, so they exist only in a JavaScript-executed capture. The
Playwright harvest had them all along. Each quote in the demo is a verbatim SUBSTRING of the
published text, trimmed to avoid reproducing two typos the salon's own copy contains ("say say",
"defiantly"); the evidence audit matches claims by containment, so a substring is valid where a
silently corrected quote would not be. `docs/mocks/glamour-and-glow/facts.json` is corrected.

## 4. The Glamour stamp failed, and why

The stamp aborted. **The domain answers 200 but serves the installer default — it is not
released, and the link must not be sent.**

- **The FAILED line names the wrong stage.** `new-demo.sh` never updates `STAGE` for the
  `quality: site` stage, so it printed `FAILED during: seed + media + integrity` — a stage that
  had actually succeeded (18 of 18 media assets imported). Read the `-- gate: X --` markers.
- **Run one died on the documented Chrome interstitial**, on run 2 of 3 on `/about`, while an
  unrelated `scholardemia` eslint held ~154% CPU. Contention, not the package.
- **Run two failed a real assertion**: best-practices 0.96 on both URLs, `image-size-responsive`
  on the header logo. The logo is sized by CSS height with `width: auto`, and I passed that
  height as `sizes`, so next/image served a 96px file into a slot that paints ~65px wide and
  needs ~131px at DPR2. Fixed by giving `sizes` the real rendered width in both packages, plus a
  Lanczos upscale of both small logos for headroom. Note the served URL is
  `/_next/image?url=/api/assets/file?key=…`, the media-library copy, so replacing the file on
  disk after a media import changes nothing — only `sizes` moves that audit.

A peer session porting The Academy Partnership flagged a further defect that was live in both
packages and invisible to every gate: a bare scope reset outranks block classes. `.gg p
{ margin: 0 }` is (0,1,1) and beat `.gg-hero-lede` (0,1,0), collapsing the hero lede's margin, and
`.gg h1,h2,h3,h4 { font-weight: 400 }` forced display headings to 400 where the comp specifies
300. Both resets are now wrapped in `:where()`, which contributes zero specificity.

## 5. What remains

Stamps are serialised on `/opt/vdplatform/workspaces/.stamp-claim`. The peer holds it for
academy-partnership; my queue polls and takes over only if the holder pid is dead and the claim is
over 10 minutes old, then waits for real utilisation under 35%.

1. Glamour: rebuild with the fixes, re-run the Lighthouse gate, release. Queued and armed.
2. Portway: install deps, typecheck, lint, build, local preview, then a full stamp.
3. Both: post-stamp checklist, then hand Ian the tracked links. **Never email the prospect.**

**Never `exec` from a claim-holding launcher.** `exec` replaces the shell and discards its EXIT
trap, so the claim outlives the run and every later launcher sees `CLAIM HELD` by a dead pid.
That cost a recovery cycle here.

## 6. Still Ian's call: is Portway a fit?

Portway Dental Care is a trading name of Portman Healthcare Limited and part of the Portman Dental
Care group — confirmed by the sitewide footer, the `/legal` page, and dentist Adrian Walley's own
bio describing the practice's integration into the group in 2018. Ledger row 4 treats it as a
local independent. A group-run site is unlikely to be a local practice manager's to buy or
replace. The port is built either way; whether it ships is a business decision.
