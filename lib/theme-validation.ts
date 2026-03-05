import type { ThemeStatePayload } from 'tweakcn-ui';
import { parseThemePayload } from 'tweakcn-ui/server';
import { DEFAULT_THEME_PAYLOAD } from '@/lib/theme-default';

export type ThemePayload = ThemeStatePayload;

export type ThemeValidationResult =
  | { ok: true; payload: ThemePayload }
  | { ok: false; errors: string[] };

function extractZodErrors(error: unknown) {
  if (!error || typeof error !== 'object') return null;
  const issues = (error as { issues?: Array<{ path?: Array<string | number>; message?: string }> }).issues;
  if (!Array.isArray(issues)) return null;
  return issues.map((issue) => {
    const path = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join('.') : 'payload';
    return `${path}: ${issue.message || 'Invalid value'}`;
  });
}

function listKeys(value: unknown) {
  if (!value || typeof value !== 'object') return [];
  return Object.keys(value as Record<string, unknown>);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function coerceThemeCandidate(payload: unknown) {
  const baseline = DEFAULT_THEME_PAYLOAD;
  const allowedKeys = new Set(listKeys(baseline?.styles?.light));

  const input = isRecord(payload) ? payload : {};
  const inputStyles = isRecord(input.styles) ? (input.styles as Record<string, unknown>) : {};
  const inputLight = isRecord(inputStyles.light) ? (inputStyles.light as Record<string, unknown>) : {};
  const inputDark = isRecord(inputStyles.dark) ? (inputStyles.dark as Record<string, unknown>) : {};

  const nextLight: Record<string, string> = { ...(baseline.styles?.light ?? {}) };
  const nextDark: Record<string, string> = { ...(baseline.styles?.dark ?? {}) };

  for (const [key, value] of Object.entries(inputLight)) {
    if (!allowedKeys.has(key)) continue;
    if (typeof value === 'string') nextLight[key] = value;
  }
  for (const [key, value] of Object.entries(inputDark)) {
    if (!allowedKeys.has(key)) continue;
    if (typeof value === 'string') nextDark[key] = value;
  }

  return {
    ...baseline,
    ...(typeof input.currentMode === 'string' ? { currentMode: input.currentMode } : {}),
    ...(isRecord(input.hslAdjustments) ? { hslAdjustments: input.hslAdjustments } : {}),
    ...(typeof input.preset === 'string' ? { preset: input.preset } : {}),
    styles: {
      light: nextLight,
      dark: nextDark
    }
  } as unknown;
}

export function validateTheme(payload: unknown): ThemeValidationResult {
  try {
    const candidate = coerceThemeCandidate(payload);
    const parsed = parseThemePayload(JSON.stringify(candidate));
    return { ok: true, payload: parsed };
  } catch (error) {
    const zodErrors = extractZodErrors(error);
    if (zodErrors && zodErrors.length > 0) {
      return { ok: false, errors: zodErrors };
    }
    return { ok: false, errors: ['Theme payload is invalid.'] };
  }
}
