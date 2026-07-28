import { describe, expect, test } from 'bun:test';
import { resolveSafeAuthDestination } from '@/lib/auth-redirect';

describe('resolveSafeAuthDestination', () => {
  test('keeps same-site paths', () => {
    expect(resolveSafeAuthDestination('/admin/observability?range=24h')).toBe(
      '/admin/observability?range=24h'
    );
  });

  test('rejects absolute and protocol-relative destinations', () => {
    expect(resolveSafeAuthDestination('https://example.com/phish')).toBe('/edit');
    expect(resolveSafeAuthDestination('//example.com/phish')).toBe('/edit');
  });

  test('uses the supplied fallback for empty values', () => {
    expect(resolveSafeAuthDestination(null, '/admin')).toBe('/admin');
  });
});
