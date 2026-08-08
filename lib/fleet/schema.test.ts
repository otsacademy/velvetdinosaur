import { describe, expect, test } from 'bun:test';
import { fleetStatusFixture } from '@/tests/fixtures/fleet-status';
import { dashboardViewSchema } from './schema';

describe('dashboardViewSchema', () => {
  test('accepts the supported read-only contract', () => {
    expect(dashboardViewSchema.parse(fleetStatusFixture)).toEqual(fleetStatusFixture);
  });

  test('rejects a response that claims to authorize an action', () => {
    const unsafe = structuredClone(fleetStatusFixture) as Record<string, unknown>;
    unsafe.authorizesAction = true;
    expect(dashboardViewSchema.safeParse(unsafe).success).toBe(false);
  });

  test('rejects presentation dimensions that do not cover fields in order', () => {
    const incomplete = structuredClone(fleetStatusFixture);
    incomplete.presentation.dimensions.pop();
    expect(dashboardViewSchema.safeParse(incomplete).success).toBe(false);

    const reordered = structuredClone(fleetStatusFixture);
    reordered.presentation.dimensions.reverse();
    expect(dashboardViewSchema.safeParse(reordered).success).toBe(false);
  });
});
