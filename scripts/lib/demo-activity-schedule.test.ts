import { describe, expect, test } from 'bun:test';
import { isDigestDeliveryTime } from './demo-activity-schedule';

describe('demo activity email schedule', () => {
  test('allows a final 22:00 email during British Summer Time', () => {
    expect(isDigestDeliveryTime(new Date('2026-08-28T07:59:59Z'))).toBeFalse();
    expect(isDigestDeliveryTime(new Date('2026-08-28T08:00:00Z'))).toBeTrue();
    expect(isDigestDeliveryTime(new Date('2026-08-28T21:00:00Z'))).toBeTrue();
    expect(isDigestDeliveryTime(new Date('2026-08-28T21:59:59Z'))).toBeTrue();
    expect(isDigestDeliveryTime(new Date('2026-08-28T22:00:00Z'))).toBeFalse();
  });

  test('uses UK local time after the clocks change', () => {
    expect(isDigestDeliveryTime(new Date('2026-12-01T08:59:59Z'))).toBeFalse();
    expect(isDigestDeliveryTime(new Date('2026-12-01T09:00:00Z'))).toBeTrue();
    expect(isDigestDeliveryTime(new Date('2026-12-01T22:00:00Z'))).toBeTrue();
    expect(isDigestDeliveryTime(new Date('2026-12-01T23:00:00Z'))).toBeFalse();
  });
});
