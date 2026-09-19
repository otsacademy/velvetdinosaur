# Quality-port collision

Marthas Coffee failed before browser assertions because port43000 could not bind. `ss -tanp` then showed an outbound IPv6 HTTPS connection in TIME-WAIT using that local port. The previous listener-only check missed it.

The host ephemeral range is32768–60999. Reserve the existing Playwright ports43000–43001 from automatic allocation using the dedicated sysctl file recorded in port-reservation.json. No application, baseline, threshold, service, or unrelated network setting changed. Both explicit IPv4/IPv6 binds passed. The unchanged candidate must pass all gates again.

[Linux kernel documentation](https://docs.kernel.org/networking/ip-sysctl.html#ip-variables) documents that reserved ports are excluded from automatic allocation while explicit bind behavior is unchanged. The original empty list, file checksum, exact mutation, and rollback constraints are retained in port-reservation.json.
