import { afterEach, describe, expect, test } from 'bun:test';
import { isInstallerAdmin } from './admin';

const originalInstallerAdmins = process.env.VD_INSTALLER_ADMINS;
const originalFallbackAdmins = process.env.VD_COMPONENT_STORE_ADMINS;

afterEach(() => {
  process.env.VD_INSTALLER_ADMINS = originalInstallerAdmins;
  process.env.VD_COMPONENT_STORE_ADMINS = originalFallbackAdmins;
});

describe('isInstallerAdmin', () => {
  test('uses the explicit installer allowlist case-insensitively', () => {
    process.env.VD_INSTALLER_ADMINS = 'Operator@Example.com, second@example.com';
    process.env.VD_COMPONENT_STORE_ADMINS = 'fallback@example.com';
    expect(isInstallerAdmin(' operator@example.com ')).toBe(true);
    expect(isInstallerAdmin('fallback@example.com')).toBe(false);
  });

  test('falls back only when the installer allowlist is absent', () => {
    delete process.env.VD_INSTALLER_ADMINS;
    process.env.VD_COMPONENT_STORE_ADMINS = 'fallback@example.com';
    expect(isInstallerAdmin('fallback@example.com')).toBe(true);
    expect(isInstallerAdmin(null)).toBe(false);
  });
});
