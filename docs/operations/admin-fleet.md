# Admin fleet status

`https://velvetdinosaur.com/admin/fleet` is a native Next.js administration
page. It is a read-only consumer of the fleet dashboard v1 JSON contract.

## Request and trust boundaries

1. Public traffic reaches the normal Velvet Dinosaur Next.js upstream through
   nginx.
2. `/admin` and `/admin/fleet` use the same `VD_INSTALLER_ADMINS` BetterAuth
   allowlist as `/admin/observability`.
3. After authorization, the server fetches
   `http://127.0.0.1:4173/admin/fleet/api/status` with an eight-second timeout,
   no credentials, no redirects, and no cache.
4. The response must be JSON, no larger than 2 MiB, schema version 1, and carry
   `authorizesAction: false` in both envelopes. Invalid responses fail closed
   into a safe unavailable state.
5. The browser receives rendered status only. It has no producer URL, API
   token, CORS access, or fleet mutation control.

`VD_FLEET_STATUS_URL` is optional and may only select the same fixed path on an
explicit `127.0.0.1` port. This override exists for isolated tests and local
topology changes; hostnames, HTTPS URLs, credentials, query strings, and other
paths are rejected.

## Operator checks

Before a site release:

```bash
sudo systemctl is-active vd-fleet-dashboard.service
curl --fail --silent --show-error http://127.0.0.1:4173/admin/fleet/healthz
curl --fail --silent --show-error \
  http://127.0.0.1:4173/admin/fleet/api/status \
  | bun -e 'const v=await Bun.stdin.json(); if(v.schemaVersion!==1||v.authorizesAction!==false||v.report?.authorizesAction!==false) process.exit(1)'
bun run typecheck
bun run test:unit
bun run build
bun run visual:test
```

Validate the versioned nginx source before installation:

```bash
sudo nginx -t
```

The active public config must not contain a `proxy_pass` to
`127.0.0.1:4173`. `/admin/fleet/api/status` must not expose the producer JSON
on the public origin.

## Expected failure behavior

- Missing session: the browser is sent to `/sign-in?next=/admin/fleet`.
- Signed-in user outside the installer-admin allowlist: redirected to `/edit`.
- Producer timeout, refusal, non-JSON, oversized, or incompatible response: a
  safe read-only unavailable page; no raw upstream body or exception text is
  rendered.
- Producer stale/unknown facts: the page remains available and preserves each
  producer freshness and provenance label. Stale state never authorizes an
  action.

The application log records only the fetch duration and a bounded outcome
code. It must not record status payloads, cookies, authorization headers, or
operator search terms.

## Rollback

The fleet producer remains an independent loopback service throughout the
presentation rollout. To roll back only the public presentation:

1. Restore the pre-cutover nginx site file from its timestamped backup under
   `/etc/nginx/rollback/` to both `sites-available` and the exact active
   `sites-enabled/velvetdinosaur.com.conf` path. Never store a backup file
   inside `sites-enabled`; nginx includes every file in that directory.
2. Run `sudo nginx -t`.
3. Reload nginx.
4. Confirm `/admin/fleet/` again presents the retained HTTP Basic challenge and
   proxies to the loopback producer.

This rollback does not require a fleet-service restart and does not alter fleet
state. Retain `/etc/nginx/.htpasswd-fleet` for the initial rollback window; its
eventual deletion is a separate destructive cleanup.

The 2026-08-02 cutover retained the effective pre-cutover config at
`/etc/nginx/rollback/velvetdinosaur.com.conf.pre-native-fleet-20260802-0809`
with owner-only mode. Its digest was recorded during cutover, and the current
versioned/available/enabled configs were verified byte-identical after reload.
