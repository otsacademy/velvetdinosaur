import { fleetStatusFixture } from './fleet-status';

const portFlagIndex = Bun.argv.indexOf('--port');
const port = Number(portFlagIndex >= 0 ? Bun.argv[portFlagIndex + 1] : 43001);
const mode = process.env.VD_FLEET_FIXTURE_MODE ?? 'ok';

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('A valid --port is required');
}

Bun.serve({
  hostname: '127.0.0.1',
  port,
  fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/admin/fleet/api/status') {
      return new Response('Not found', { status: 404 });
    }
    if (mode === 'unavailable') {
      return Response.json({ ok: false }, { status: 503 });
    }
    return Response.json(fleetStatusFixture, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
});

console.log(`Fleet fixture listening on 127.0.0.1:${port}`);
