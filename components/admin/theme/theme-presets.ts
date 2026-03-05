import type { ThemeStatePayload } from 'tweakcn-ui';
import presets from './theme-presets.json';
import { normalizeThemeStylesToOklch } from '@/lib/theme-normalize';

type ThemeStyles = ThemeStatePayload['styles'];

type PresetRecord = Record<
  string,
  {
    label?: string;
    styles?: {
      light?: Record<string, string>;
      dark?: Record<string, string>;
    };
  }
>;

export type ThemePresetOption = {
  id: string;
  label: string;
  styles: {
    light: Partial<ThemeStyles['light']>;
    dark: Partial<ThemeStyles['dark']>;
  };
};

const presetRecord = presets as PresetRecord;

export const THEME_PRESETS: ThemePresetOption[] = Object.entries(presetRecord).map(([id, preset]) => ({
  id,
  label: preset.label ?? id,
  styles: normalizeThemeStylesToOklch({
    light: preset.styles?.light ?? {},
    dark: preset.styles?.dark ?? {}
  } as Partial<ThemeStatePayload['styles']>)
}));
