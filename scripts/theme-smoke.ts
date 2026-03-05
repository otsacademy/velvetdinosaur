import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { DEFAULT_THEME_PAYLOAD } from '@/lib/theme-default';
import { normalizeThemePayloadToOklch } from '@/lib/theme-normalize';
import { validateTheme } from '@/lib/theme-validation';
import { readThemeCurrent, writeThemeCurrent, writeThemeLastGood } from '@/lib/theme-store';

async function main() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vd-theme-smoke-'));
  process.env.VD_STATE_DIR = tempDir;
  process.env.SITE_SLUG = process.env.SITE_SLUG || 'theme-smoke';

  try {
    const payload = DEFAULT_THEME_PAYLOAD;
    const normalized = normalizeThemePayloadToOklch(payload, { strict: true });
    const validation = validateTheme(normalized);
    if (!validation.ok) {
      throw new Error(`Theme smoke failed: ${validation.errors.join('; ')}`);
    }

    await writeThemeCurrent(validation.payload);
    await writeThemeLastGood(validation.payload);
    const current = await readThemeCurrent();
    if (!current) {
      throw new Error('Theme smoke failed: no payload saved.');
    }
    if (JSON.stringify(current) !== JSON.stringify(validation.payload)) {
      throw new Error('Theme smoke failed: saved payload mismatch.');
    }

    console.log('Theme smoke test passed.');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
