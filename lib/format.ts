export type FormatNumberOptions = Intl.NumberFormatOptions & {
  locale?: string;
};

export function formatNumber(value: number, options: FormatNumberOptions = {}) {
  const { locale, ...intlOptions } = options;
  const n = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(locale ?? 'en-US', {
    maximumFractionDigits: 0,
    ...intlOptions,
  }).format(n);
}

