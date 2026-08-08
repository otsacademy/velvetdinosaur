# Phase 0a remediation register

Status: W1 EXECUTED for the deployed VD family (2026-08-08 evening); remaining tail below. Originally: draft worklist derived from fleet-upgrade-plan rev 3 §Phase 0a, grounded in a
source-tree scan of the host on 2026-08-08. Runtime attestation (W0) still pending —
source scan is necessary but not sufficient per plan conclusion 13.

Patched lines (plan): Next.js ≥ 16.2.11 (16.x) / ≥ 15.5.21 (15.x); Better Auth ≥ 1.6.22.

## Verified source-tree inventory (2026-08-08)

| Tree | next | better-auth | Notes |
|---|---|---|---|
| /opt/vdplatform/template | 16.1.1 | 1.4.10 | canonical template |
| /opt/vdplatform/theme-editor | 16.1.1 | — | JWT secret consumer (§3.4) |
| /srv/apps/asap | 16.1.1 | 1.4.10 | releasable (proved today) |
| /srv/apps/velvetdinosaur | 16.1.1 | 1.4.10 | releasable (main, in-place) |
| /srv/apps/vd-email-studio | 16.1.1 | 1.4.10 | clean main; deploy model unverified |
| /srv/apps/vd-social-api | 16.1.1 | 1.4.10 | plan: prove BA unused → remove |
| /srv/apps/booking-api | 16.1.1 | 1.4.10 | runtime mapping needed |
| /srv/apps/thebrave (+release copy) | 16.1.1 | 1.4.10 | blocked: prod on codex branch |
| /srv/apps/ra | 16.1.1 | 1.4.10 | blocked: dirty tree, feature branch |
| /srv/apps/pyanal | 16.1.1 | 1.4.10 | blocked: dirty tree, feature branch |
| /srv/apps/ots-sauro-poc (+slots) | 16.1.1 | 1.4.10 | POC; live site is legacy tree below |
| /srv/apps/scholardemia | — | **1.6.23 ✓** | BA already patched; different next story |
| /var/www/ontourism.academy | **^15.1.4** | — | PUBLIC, currently HTTP 500 |
| /var/www/jots_template | 16.0.10 | — | confirm not running |
| /var/www/thenewbrave.before_restore_* | ^16.1.1 | — | backup dir; confirm not running |
| /var/www/velvetdinosaur.retired | 16.0.10 | — | retired; confirm not running |

Registry secret exposure (§3.4): `/var/lib/vd-platform/registry.json` mode 664
root:developers + **92** `registry.json.bak.*` copies.

## Worklist

### W0 — Runtime-first inventory (plan step 1) — first, read-only
Enumerate every running systemd service and enabled nginx route; map each to
source tree/SHA, installed (not declared) versions, exposure, owner, runbook.
Known so far: vd-asap-{blue,green}, vd-velvetdinosaur-blue, vd-thebrave-{blue,green},
vd-ots-production (legacy tree), Scholardemia unit(s), GitHub runner.

### W1 — Dependency wave on releasable VD-family sites (steps 3–4, 9)
One reviewed recipe: next → 16.2.11 exact, better-auth → 1.6.23 exact (already
proven on this host by scholardemia), aligned react pins; lockfile committed;
full local gates; release; post-release runtime re-probe.
Order: template → asap → velvetdinosaur → vd-email-studio → vd-social-api
(prove BA unused, remove instead) → booking-api → theme-editor.
Do the better-auth 1.4→1.6 breaking-change review once, first.

### W2 — Blocked checkouts (prerequisite: owner decision)
thebrave / ra / pyanal share the `codex/ops-path-cleanup-20260419` situation
(dirty trees / prod-from-feature-branch). Decision needed per repo: finish and
merge the cleanup, or revert it. Until then these carry time-boxed exceptions
(step 10), not silence. Same decision unblocks the held vocabulary deploys.

### W3 — Legacy/non-Git workloads (steps 3, 7)
- **ontourism.academy**: public, oldest Next (15.1.4), and serving HTTP 500 now.
  Owner decision: repair + patch to 15.5.21, or contain/retire. Most urgent
  single item — it is broken *and* unpatched *and* public.
- Confirm jots_template / thenewbrave.before_restore / velvetdinosaur.retired are
  not running (W0), then archive or delete; capture any running non-Git tree in
  an authoritative recovery commit first (step 7).
- Scholardemia/Scholmock/space service: map in W0, then patch in place or adapter.

### W4 — Secrets & registry hygiene (step 8 + Phase 0 retention item)
1. Rotate theme-editor JWT via §3.4 ordered runbook (consumers → rotation → verify).
2. Scrub the old secret from installer state and all 92 backups; define backup
   retention and prune.
3. Tighten `/var/lib/vd-platform/registry.json` permissions.

### W5 — Exceptions register (steps 2, 5, 10)
Every deferred item gets owner + deadline + compensating controls; critical
exceptions reported as unresolved risk, not green.

## Known platform conditions (verify during W1)

- **/admin PPR resume mismatch under DB-less runtime** (all template-family sites
  presumed; verified on velvetdinosaur): when built with `.env.production` but run
  without `MONGODB_URI`, every `/admin` request logs "Couldn't find all resumable
  slots…" and React re-renders client-side, wiping interaction state. Prod
  (single env for build+run) unaffected. Bisected: predates 2026-08-08 work.
  Re-verify after Next 16.2.11; if fixed, drop the settle/retry shims in
  `tests/visual/admin-fleet.spec.ts`.


## W1 execution record (2026-08-08 evening)

Deployed on next 16.2.12 + better-auth 1.6.26: **template** (shadow git), **asap**,
**velvetdinosaur**, **pyanal**, **ra**, **thebrave**. Checkout reconciliation (W2)
completed the same evening: ops-path-cleanup finished and merged on pyanal/ra/thebrave;
codex branches folded into develop/main; editor vocabulary now live fleet-wide.

Migration facts for the remaining tail (vd-email-studio, vd-social-api, booking-api,
theme-editor, scholardemia-next):
- better-auth 1.6 makes Auth<> exact-generic: widen at the cache assignment
  (`auth as unknown as ReturnType<typeof betterAuth>`).
- emailOTP gained a 'change-email' type: widen mailer unions.
- **next 16.2 caps proxied request bodies at 10MB (silent truncation)** — set
  `experimental.proxyClientMaxBodySize: '64mb'` (match nginx) or uploads break;
  this bit a real ASAP editor before it was caught.
- Clear .next*/types caches after the bump (stale PrefetchForTypeCheckInternal).
- ontourism.academy retired (archived, not deleted); otsjournal.org serves via the
  Scholardemia engine — do not park the domain.
- pyanal blue slot moved to port 3009 (3007 belongs to vd-email-studio).


## W1 tail + attestation record (2026-08-08 night)

Patched, restarted, probed healthy: **vd-email-studio** (16.2.12 + BA 1.6.26),
**vd-social-api** (16.2.12; better-auth REMOVED — zero imports),
**booking-api** (16.2.12 + BA 1.6.26; git recovery baseline created — was non-git),
**theme-editor** (16.2.12; pre-change tar in backups). Runtime attestation:
9 processes on next 16.2.12.

Registry backup sprawl pruned 92 → 10 (retention: newest 10).

**Open exceptions (W5):**
1. `vd-scholmock.service` — next 16.0.10 at /srv/apps/scholmock/current. Different
   deploy system (current-tree artifact); needs Scholardemia-adapter decision.
2. `vd-space-scholardemia.service` — next 16.2.6, **running from a DELETED
   directory** — do NOT restart until its deploy tree is re-established; a restart
   will fail to start. Needs owner attention first.
3. Theme-editor JWT rotation (W4 §3.4) still pending — ordered runbook
   (consumers → rotate → verify); registry.json remains group-readable until then.
4. scholardemia main app: better-auth already 1.6.23 (OK); its next version needs
   the W0 runtime inventory to attest (monorepo, no top-level next).
