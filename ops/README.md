# Velvet Dinosaur operations

The files in this directory are the versioned source for the authentication and
monitoring consolidation completed in July 2026.

## Public control surfaces

- `/edit` is the only staff entry point.
- `/admin` opens the protected observability area.
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
