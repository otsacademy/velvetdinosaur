import type { MetricUnit } from '@/lib/observability/types';

export function formatBytes(value: number) {
  if (!Number.isFinite(value)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let idx = 0;
  let num = value;
  while (num >= 1024 && idx < units.length - 1) {
    num /= 1024;
    idx += 1;
  }
  return `${num.toFixed(num >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function formatNumber(value: number, decimals = 0) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}

export function formatMetricValue(value: number | null | undefined, unit?: MetricUnit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  switch (unit) {
    case 'bytes':
      return formatBytes(value);
    case 'percent':
      return `${formatNumber(value, value >= 10 ? 0 : 1)}%`;
    case 'ms':
      return `${formatNumber(value, value >= 100 ? 0 : 1)} ms`;
    case 's':
      return `${formatNumber(value, value >= 100 ? 0 : 1)} s`;
    case 'ops':
      return `${formatNumber(value, value >= 100 ? 0 : 1)} /s`;
    case 'ratio':
      return formatNumber(value, 2);
    case 'count':
    default:
      return formatNumber(value, value >= 100 ? 0 : 1);
  }
}
