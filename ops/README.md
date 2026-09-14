# Velvet Dinosaur operations

The files in this directory are the versioned source for the authentication and
monitoring consolidation completed in July 2026.

## Public control surfaces

- `/edit` is the staff content entry point.
- `/admin` opens the protected operations hub.
- `/admin/fleet` is the native, read-only fleet status view. Next.js fetches its
  data server-side from the loopback-only fleet producer; browsers never reach
  port `4173`.
- `/admin/observability` opens the protected Prometheus dashboard index.
- `/admin/alertmanager/` exposes Alertmanager behind the same BetterAuth admin gate.
- `designer.velvetdinosaur.com` redirects to the matching `/edit` or `/admin` route.
- `manage.velvetdinosaur.com` redirects to `/admin/observability` or
  `/admin/alertmanager/`.

## Monitoring

`prometheus/velvetdinosaur-web.yml` replaces the Grafana-managed website,
certificate, and latency alerts. Prometheus remains the metrics and rule engine;
Alertmanager remains the notification service.

Validate before installation:

```bash
promtool check rules ops/prometheus/velvetdinosaur-web.yml
sudo nginx -t
```

Grafana data and configuration are retained on the host for rollback even when
the `grafana-server` service is disabled.

The previous nginx `/admin/fleet/` proxy and HTTP Basic challenge are rollback
artifacts only. They must not be installed while the native Next.js route owns
that path. Keep the htpasswd file during the initial rollback window, then
retire it in a separate reviewed cleanup.

See [the admin fleet runbook](../docs/operations/admin-fleet.md) for validation,
cutover, and rollback commands.

## Production runtime

`systemd/vd-velvetdinosaur-blue.service` retains the established service name
and port for compatibility, but runs directly from the canonical
`/srv/apps/velvetdinosaur` main checkout. The legacy green slot remains
disabled; releases no longer switch between copied slot directories.

## Fleet operations scripts (`ops/scripts/`)

- `nginx-media-carveout.sh [--dry-run]` — gives `/api/assets/file` its own rate-limit and
  connection zones in every vhost that has the standard `location /api/ {` block (clones that
  vhost's own proxy lines). Idempotent; backs up to `/etc/nginx/backups/media-carveout-<stamp>/`,
  runs `nginx -t`, reloads. Needs passwordless sudo.
- `r2-bucket-probe.ts` — proves a site's env can write, read and delete in its configured bucket:
  `bun --env-file=/srv/apps/<slug>-current/.env.production ops/scripts/r2-bucket-probe.ts`.
- `fleet-release-queue.sh --marker <text> <slug>...` — serial, full-gated blue/green release of
  the canonical core to installed sites (`sync:editor` → commit → `release:local` → live-slot
  marker check). Holds the stamp claim; stops on the first failure; skips sites already carrying
  the marker. Logs under `logs/fleet-release-<run>/`.
