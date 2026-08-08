import { describe, expect, test } from 'bun:test';
import { fleetStatusFixture } from '@/tests/fixtures/fleet-status';
import { buildFleetPresentation, normalizeFleetQuery } from './presentation';

describe('fleet presentation', () => {
  test('decorates every field without dropping or reordering data', () => {
    const presented = buildFleetPresentation(fleetStatusFixture);
    const fields = [
      ...presented.repositories.flatMap((item) => item.fields),
      ...presented.deployments.flatMap((item) => item.fields),
      ...presented.unmatchedWorkloads.flatMap((item) => item.fields)
    ];

    expect(fields.map((item) => item.key)).toEqual(
      fleetStatusFixture.presentation.dimensions.map((item) => item.key)
    );
    expect(fields.map((item) => item.badgeClass)).toEqual(
      fleetStatusFixture.presentation.dimensions.map((item) => item.badgeClass)
    );
  });

  test('filters subjects and secondary findings across human and evidence fields', () => {
    expect(buildFleetPresentation(fleetStatusFixture, 'orphan').unmatchedWorkloads).toHaveLength(1);
    expect(buildFleetPresentation(fleetStatusFixture, 'orphan').repositories).toHaveLength(0);
    expect(buildFleetPresentation(fleetStatusFixture, 'EX-2026-08').openExceptions).toHaveLength(1);
    expect(buildFleetPresentation(fleetStatusFixture, 'not-present').blockers).toHaveLength(0);
  });

  test('normalizes a bounded first query value', () => {
    expect(normalizeFleetQuery(['  workload  ', 'ignored'])).toBe('workload');
    expect(normalizeFleetQuery('x'.repeat(150))).toHaveLength(100);
  });
});
