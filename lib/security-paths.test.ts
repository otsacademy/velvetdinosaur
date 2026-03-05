import { describe, expect, it } from 'bun:test';
import { isBlockedPath } from './security-paths';

describe('isBlockedPath', () => {
  it('blocks traversal and sensitive paths', () => {
    expect(isBlockedPath('/.env')).toBe(true);
    expect(isBlockedPath('/.env.production')).toBe(true);
    expect(isBlockedPath('/.git/config')).toBe(true);
    expect(isBlockedPath('/package.json')).toBe(true);
    expect(isBlockedPath('/foo/../bar')).toBe(true);
  });

  it('allows well-known paths', () => {
    expect(isBlockedPath('/.well-known/acme-challenge/token')).toBe(false);
  });

  it('allows normal content paths', () => {
    expect(isBlockedPath('/admin/sites')).toBe(false);
    expect(isBlockedPath('/assets/logo.png')).toBe(false);
  });
});
