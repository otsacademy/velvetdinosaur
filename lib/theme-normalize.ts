import type { ThemeStatePayload } from 'tweakcn-ui';

type NormalizeOptions = {
  strict?: boolean;
};

type Rgba = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const COLOR_KEYS = new Set([
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'shadow-color'
]);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function isColorKey(key: string) {
  if (COLOR_KEYS.has(key)) return true;
  return key.startsWith('chart-');
}

function isOklch(value: string) {
  return value.trim().toLowerCase().startsWith('oklch(');
}

function parseHexColor(input: string): Rgba | null {
  const hex = input.slice(1).trim();
  if (![3, 4, 6, 8].includes(hex.length)) return null;

  const expand = (value: string) => parseInt(value + value, 16);
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 255;

  if (hex.length <= 4) {
    r = expand(hex[0]);
    g = expand(hex[1]);
    b = expand(hex[2]);
    if (hex.length === 4) a = expand(hex[3]);
  } else {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16);
  }

  return { r, g, b, a: a / 255 };
}

function parseAlpha(value?: string) {
  if (!value) return 1;
  const trimmed = value.trim();
  if (!trimmed) return 1;
  if (trimmed.endsWith('%')) {
    const percent = parseFloat(trimmed.slice(0, -1));
    if (Number.isNaN(percent)) return null;
    return clamp(percent / 100);
  }
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return null;
  return clamp(num);
}

function parseRgbChannel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith('%')) {
    const percent = parseFloat(trimmed.slice(0, -1));
    if (Number.isNaN(percent)) return null;
    return clamp(percent / 100) * 255;
  }
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return null;
  return clamp(num / 255) * 255;
}

function parseRgbColor(input: string): Rgba | null {
  const start = input.indexOf('(');
  const end = input.lastIndexOf(')');
  if (start === -1 || end === -1) return null;
  const inner = input.slice(start + 1, end);
  const [colorPart, alphaPart] = inner.split('/');
  const values = colorPart.split(/[\s,]+/).filter(Boolean);
  if (values.length < 3) return null;
  const r = parseRgbChannel(values[0]);
  const g = parseRgbChannel(values[1]);
  const b = parseRgbChannel(values[2]);
  if (r === null || g === null || b === null) return null;
  const alpha = parseAlpha(alphaPart);
  if (alpha === null) return null;
  return { r, g, b, a: alpha };
}

function parseHslChannel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith('%')) {
    const percent = parseFloat(trimmed.slice(0, -1));
    if (Number.isNaN(percent)) return null;
    return clamp(percent / 100);
  }
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return null;
  return num > 1 ? clamp(num / 100) : clamp(num);
}

function parseHue(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const numeric = parseFloat(trimmed.replace(/deg$/, ''));
  if (Number.isNaN(numeric)) return null;
  return ((numeric % 360) + 360) % 360;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const gray = l * 255;
    return { r: gray, g: gray, b: gray };
  }
  const hue = h / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hueToRgb = (t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };
  return {
    r: hueToRgb(hue + 1 / 3) * 255,
    g: hueToRgb(hue) * 255,
    b: hueToRgb(hue - 1 / 3) * 255
  };
}

function parseHslColor(input: string): Rgba | null {
  const start = input.indexOf('(');
  const end = input.lastIndexOf(')');
  if (start === -1 || end === -1) return null;
  const inner = input.slice(start + 1, end);
  const [colorPart, alphaPart] = inner.split('/');
  const values = colorPart.split(/[\s,]+/).filter(Boolean);
  if (values.length < 3) return null;
  const h = parseHue(values[0]);
  const s = parseHslChannel(values[1]);
  const l = parseHslChannel(values[2]);
  if (h === null || s === null || l === null) return null;
  const rgb = hslToRgb(h, s, l);
  const alpha = parseAlpha(alphaPart);
  if (alpha === null) return null;
  return { ...rgb, a: alpha };
}

function parseColor(input: string): Rgba | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (trimmed.startsWith('#')) return parseHexColor(trimmed);
  if (trimmed.startsWith('rgb')) return parseRgbColor(trimmed);
  if (trimmed.startsWith('hsl')) return parseHslColor(trimmed);
  return null;
}

function srgbToLinear(value: number) {
  const channel = value / 255;
  if (channel <= 0.04045) return channel / 12.92;
  return Math.pow((channel + 0.055) / 1.055, 2.4);
}

function rgbToOklch({ r, g, b, a }: Rgba) {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const L = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const A = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const B = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

  const C = Math.sqrt(A * A + B * B);
  const H = C < 1e-8 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;

  return { L, C, H, a: clamp(a) };
}

function formatNumber(value: number, digits: number) {
  const fixed = value.toFixed(digits);
  return fixed.replace(/\.?0+$/, '');
}

function formatOklch({ L, C, H, a }: { L: number; C: number; H: number; a: number }) {
  const lPercent = formatNumber(clamp(L) * 100, 2);
  const chroma = formatNumber(Math.max(0, C), 3);
  const hue = formatNumber(H, 1);
  const alpha = a < 1 ? ` / ${formatNumber(a, 3)}` : '';
  return `oklch(${lPercent}% ${chroma} ${hue}${alpha})`;
}

function normalizeColorToOklch(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false as const };
  if (trimmed.toLowerCase().startsWith('var(')) return { ok: false as const };
  if (isOklch(trimmed)) return { ok: true as const, value: trimmed };
  const parsed = parseColor(trimmed);
  if (!parsed) return { ok: false as const };
  return { ok: true as const, value: formatOklch(rgbToOklch(parsed)) };
}

export function normalizeThemeStylesToOklch(
  styles: Partial<ThemeStatePayload['styles']> | ThemeStatePayload['styles'] | null | undefined,
  options: NormalizeOptions = {}
): ThemeStatePayload['styles'] {
  const strict = options.strict ?? false;
  const errors: string[] = [];

  const normalizeMode = (mode: Record<string, unknown> | undefined, modeLabel: string) => {
    const next: Record<string, unknown> = { ...(mode ?? {}) };
    Object.entries(mode ?? {}).forEach(([key, value]) => {
      if (!isColorKey(key) || typeof value !== 'string') return;
      const result = normalizeColorToOklch(value);
      if (result.ok) {
        next[key] = result.value;
        return;
      }
      if (strict) {
        errors.push(`${modeLabel}.${key}`);
      }
    });
    return next;
  };

  const next = {
    light: normalizeMode(styles?.light as Record<string, unknown> | undefined, 'light'),
    dark: normalizeMode(styles?.dark as Record<string, unknown> | undefined, 'dark')
  } as ThemeStatePayload['styles'];

  if (strict && errors.length > 0) {
    throw new Error(`Theme colors must be OKLCH. Invalid keys: ${errors.join(', ')}`);
  }

  return next;
}

export function normalizeThemePayloadToOklch(
  payload: ThemeStatePayload | null | undefined,
  options: NormalizeOptions = {}
): ThemeStatePayload | null | undefined {
  if (!payload) return payload;
  return {
    ...payload,
    styles: normalizeThemeStylesToOklch(payload.styles, options)
  };
}
