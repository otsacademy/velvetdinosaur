import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ThemeStatePayload } from 'tweakcn-ui';
import { normalizeThemeStylesToOklch } from '../lib/theme-normalize';

type PresetRecord = Record<
  string,
  {
    label?: string;
    createdAt?: string;
    styles?: {
      light?: Record<string, string>;
      dark?: Record<string, string>;
    };
  }
>;

const inputPath = process.argv[2] || 'components/admin/theme/theme-presets.json';
const resolved = resolve(process.cwd(), inputPath);

const raw = JSON.parse(await readFile(resolved, 'utf8')) as PresetRecord;
const normalized: PresetRecord = {};

for (const [id, preset] of Object.entries(raw)) {
  const styles = normalizeThemeStylesToOklch(
    {
      light: preset.styles?.light ?? {},
      dark: preset.styles?.dark ?? {}
    } as Partial<ThemeStatePayload['styles']>,
    { strict: true }
  );

  normalized[id] = {
    ...preset,
    styles: {
      light: styles.light as Record<string, string>,
      dark: styles.dark as Record<string, string>
    }
  };
}

await writeFile(resolved, JSON.stringify(normalized), 'utf8');
console.log(`Normalized presets to OKLCH: ${resolved}`);
