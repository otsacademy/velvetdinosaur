import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/theme-css.ts');

import type { ThemeStatePayload } from 'tweakcn-ui';
import { computeCssVarMap, sanitizeThemePayload } from 'tweakcn-ui/server';

const DEFAULT_HSL_ADJUSTMENTS = {
  hueShift: 0,
  saturationScale: 1,
  lightnessScale: 1
};

type MinimalThemeState = {
  styles: ThemeStatePayload['styles'];
  currentMode: ThemeStatePayload['currentMode'];
  hslAdjustments: ThemeStatePayload['hslAdjustments'];
  preset: string;
};

export function getThemeCssVars(payload?: ThemeStatePayload | null) {
  const sanitized = sanitizeThemePayload(payload ?? null);
  const themeState: MinimalThemeState = {
    styles: sanitized.styles,
    currentMode: sanitized.currentMode,
    hslAdjustments: sanitized.hslAdjustments ?? DEFAULT_HSL_ADJUSTMENTS,
    preset: sanitized.preset ?? 'default'
  };

  return computeCssVarMap(themeState as unknown as Parameters<typeof computeCssVarMap>[0], {
    tailwindVersion: '4'
  });
}
