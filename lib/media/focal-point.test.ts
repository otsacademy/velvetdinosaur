import { describe, expect, it } from 'bun:test';
import { buildFocalAwareAssetUrl, clamp01, focalToObjectPosition, parseFocalFromUrl, toFocalQuery } from './focal-point';

describe('focal point helpers', () => {
  it('clamps and rounds values to 4 decimals', () => {
    expect(clamp01(-0.12345)).toBe(0);
    expect(clamp01(1.23456)).toBe(1);
    expect(clamp01(0.3333333)).toBe(0.3333);
  });

  it('builds object-position with fallback center', () => {
    expect(focalToObjectPosition({ focalX: 0.2, focalY: 0.8 })).toBe('20.0000% 80.0000%');
    expect(focalToObjectPosition({}, { focalX: 0.25 })).toBe('25.0000% 50.0000%');
    expect(focalToObjectPosition({}, {})).toBe('50.0000% 50.0000%');
  });

  it('reads focal values from URL search params', () => {
    const focal = parseFocalFromUrl('/api/assets/file?key=uploads%2Fone.jpg&focalX=0.77&focalY=0.11');
    expect(focal).toEqual({ focalX: 0.77, focalY: 0.11 });
  });

  it('adds focal query params to asset URL', () => {
    expect(buildFocalAwareAssetUrl('/api/assets/file?key=assets%2Ftwo.jpg', { focalX: 0.4, focalY: 0.6 })).toBe(
      '/api/assets/file?key=assets%2Ftwo.jpg&focalX=0.4&focalY=0.6'
    );
    expect(toFocalQuery({})).toBeNull();
  });
});
