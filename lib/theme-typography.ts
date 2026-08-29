import type { ThemeStatePayload } from 'tweakcn-ui';

export const VD_FONT_TOKENS = ['vd-font-sans', 'vd-font-serif', 'vd-font-mono'] as const;
export const VD_TEXT_TOKENS = ['vd-text-sm', 'vd-text-base', 'vd-text-xl', 'vd-text-2xl'] as const;
export const VD_TYPOGRAPHY_TOKENS = [...VD_FONT_TOKENS, ...VD_TEXT_TOKENS] as const;

export type VdTypographyToken = (typeof VD_TYPOGRAPHY_TOKENS)[number];

const DEFAULT_TEXT_VALUES: Record<(typeof VD_TEXT_TOKENS)[number], string> = {
  'vd-text-sm': '0.875rem',
  'vd-text-base': '1rem',
  'vd-text-xl': '1.25rem',
  'vd-text-2xl': '1.5rem'
};

const FONT_FALLBACK_KEYS: Record<(typeof VD_FONT_TOKENS)[number], 'font-sans' | 'font-serif' | 'font-mono'> =
  {
    'vd-font-sans': 'font-sans',
    'vd-font-serif': 'font-serif',
    'vd-font-mono': 'font-mono'
  };

type TypographyOverrides = {
  light?: Partial<Record<VdTypographyToken, string>>;
  dark?: Partial<Record<VdTypographyToken, string>>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeTokenValue = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const pickOverrides = (source: unknown): Partial<Record<VdTypographyToken, string>> => {
  if (!isRecord(source)) return {};
  const result: Partial<Record<VdTypographyToken, string>> = {};
  VD_TYPOGRAPHY_TOKENS.forEach((token) => {
    const value = normalizeTokenValue(source[token]);
    if (value) result[token] = value;
  });
  return result;
};

export function extractTypographyOverrides(payload: unknown): TypographyOverrides {
  if (!isRecord(payload)) return {};
  const styles = payload.styles;
  if (!isRecord(styles)) return {};
  return {
    light: pickOverrides(styles.light),
    dark: pickOverrides(styles.dark)
  };
}

const resolveFontFallback = (
  styles: ThemeStatePayload['styles'],
  token: (typeof VD_FONT_TOKENS)[number],
  mode: 'light' | 'dark'
) => {
  const fontKey = FONT_FALLBACK_KEYS[token];
  const modeValue = normalizeTokenValue((styles?.[mode] as Record<string, unknown> | undefined)?.[fontKey]);
  if (modeValue) return modeValue;
  const lightValue = normalizeTokenValue((styles?.light as Record<string, unknown> | undefined)?.[fontKey]);
  if (lightValue) return lightValue;
  const darkValue = normalizeTokenValue((styles?.dark as Record<string, unknown> | undefined)?.[fontKey]);
  if (darkValue) return darkValue;
  return null;
};

const resolveTokenValue = (
  styles: ThemeStatePayload['styles'],
  token: VdTypographyToken,
  mode: 'light' | 'dark',
  override?: string | null,
  fallback?: string | null
) => {
  const direct = override ?? normalizeTokenValue((styles?.[mode] as Record<string, unknown> | undefined)?.[token]);
  if (direct) return direct;
  if (token in DEFAULT_TEXT_VALUES) return DEFAULT_TEXT_VALUES[token as keyof typeof DEFAULT_TEXT_VALUES];
  if (token in FONT_FALLBACK_KEYS) return resolveFontFallback(styles, token as (typeof VD_FONT_TOKENS)[number], mode) ?? fallback;
  return fallback;
};

export function mergeTypographyStyles(
  styles: ThemeStatePayload['styles'],
  overrides: TypographyOverrides = {}
): ThemeStatePayload['styles'] {
  const lightBase = { ...(styles?.light ?? {}) } as Record<string, string>;
  const darkBase = { ...(styles?.dark ?? {}) } as Record<string, string>;

  VD_TYPOGRAPHY_TOKENS.forEach((token) => {
    const lightValue = resolveTokenValue(styles, token, 'light', overrides.light?.[token]);
    if (lightValue) lightBase[token] = lightValue;
    const darkValue = resolveTokenValue(styles, token, 'dark', overrides.dark?.[token], lightValue);
    if (darkValue) darkBase[token] = darkValue;
  });

  return {
    ...(styles ?? {}),
    light: lightBase,
    dark: darkBase
  } as ThemeStatePayload['styles'];
}

export function mergeTypographyTokens(
  payload: ThemeStatePayload,
  overrides: TypographyOverrides = {}
): ThemeStatePayload {
  return {
    ...payload,
    styles: mergeTypographyStyles(payload.styles, overrides)
  };
}

export function buildTypographyVarMap(
  styles: ThemeStatePayload['styles'],
  options: { mode?: 'light' | 'dark'; overrides?: TypographyOverrides } = {}
) {
  const merged = mergeTypographyStyles(styles, options.overrides);
  const mode = options.mode ?? 'light';
  const source = (mode === 'dark' ? merged.dark : merged.light) as Record<string, string>;
  const vars: Record<string, string> = {};
  VD_TYPOGRAPHY_TOKENS.forEach((token) => {
    const value = normalizeTokenValue(source[token]);
    if (value) vars[`--${token}`] = value;
  });
  return vars;
}
