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
