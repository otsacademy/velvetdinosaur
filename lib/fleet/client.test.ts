import { describe, expect, test } from 'bun:test';
import { fleetStatusFixture } from '@/tests/fixtures/fleet-status';
import {
  fetchFleetDashboardView,
  FleetStatusError,
  MAX_FLEET_RESPONSE_BYTES,
  parseFleetDashboardView,
  resolveFleetStatusEndpoint
} from './client';

describe('fleet status client', () => {
  test('accepts only the fixed loopback status endpoint', () => {
    expect(resolveFleetStatusEndpoint('http://127.0.0.1:43001/admin/fleet/api/status')).toBe(
      'http://127.0.0.1:43001/admin/fleet/api/status'
    );
    for (const endpoint of [
      'https://127.0.0.1:43001/admin/fleet/api/status',
      'http://localhost:43001/admin/fleet/api/status',
      'http://127.0.0.1:43001/admin/fleet/api/status?token=secret',
      'http://user:pass@127.0.0.1:43001/admin/fleet/api/status',
      'http://127.0.0.1:43001/other'
    ]) {
      expect(() => resolveFleetStatusEndpoint(endpoint)).toThrow(FleetStatusError);
    }
  });

  test('fetches without forwarding credentials and validates the response', async () => {
    let receivedInit: RequestInit | undefined;
    const view = await fetchFleetDashboardView({
      endpoint: 'http://127.0.0.1:43001/admin/fleet/api/status',
      fetchImpl: async (_input, init) => {
        receivedInit = init;
        return Response.json(fleetStatusFixture);
      }
    });

    expect(view).toEqual(fleetStatusFixture);
    expect(receivedInit?.credentials).toBe('omit');
    expect(receivedInit?.cache).toBe('no-store');
    expect(receivedInit?.redirect).toBe('error');
    expect(new Headers(receivedInit?.headers).get('cookie')).toBeNull();
    expect(new Headers(receivedInit?.headers).get('authorization')).toBeNull();
  });

  test('rejects unsafe or malformed upstream responses with safe codes', async () => {
    const cases = [
      [new Response('down', { status: 503, headers: { 'content-type': 'application/json' } }), 'upstream-response'],
      [new Response('{}', { headers: { 'content-type': 'text/html' } }), 'content-type'],
      [new Response('{', { headers: { 'content-type': 'application/json' } }), 'invalid-json'],
      [new Response('{}', { headers: { 'content-type': 'application/json' } }), 'invalid-contract'],
      [new Response('', { headers: { 'content-type': 'application/json', 'content-length': String(MAX_FLEET_RESPONSE_BYTES + 1) } }), 'response-too-large'],
      [new Response('', { headers: { 'content-type': 'application/json', 'content-length': '1x' } }), 'response-too-large']
    ] as const;

    for (const [response, code] of cases) {
      await expect(fetchFleetDashboardView({
        endpoint: 'http://127.0.0.1:43001/admin/fleet/api/status',
        fetchImpl: async () => response
      })).rejects.toMatchObject({ code });
    }
  });

  test('rejects action-authorizing payloads at the parser boundary', () => {
    const unsafe = structuredClone(fleetStatusFixture) as Record<string, unknown>;
    unsafe.authorizesAction = true;
    expect(() => parseFleetDashboardView(unsafe)).toThrow(FleetStatusError);
  });
});
