const DEFAULT_PROM_URL = 'http://127.0.0.1:9090';

export type PrometheusSample = [number | string, string];
export type PrometheusMetric = Record<string, string>;

export type PrometheusResult = {
  metric?: PrometheusMetric;
  values?: PrometheusSample[];
  value?: PrometheusSample;
};

export type PrometheusQueryResponse = {
  data?: {
    result?: PrometheusResult[];
  };
};

export function getPrometheusBaseUrl() {
  return process.env.PROMETHEUS_URL || DEFAULT_PROM_URL;
}

export function parseRangeSeconds(value?: string | null) {
  if (!value) return 6 * 60 * 60;
  const match = value.trim().match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return 6 * 60 * 60;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount)) return 6 * 60 * 60;
  if (unit === 's') return amount;
  if (unit === 'm') return amount * 60;
  if (unit === 'h') return amount * 60 * 60;
  if (unit === 'd') return amount * 24 * 60 * 60;
  return 6 * 60 * 60;
}

export function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function queryRange(
  baseUrl: string,
  query: string,
  start: number,
  end: number,
  step: number
): Promise<PrometheusQueryResponse> {
  const url = new URL('/api/v1/query_range', baseUrl);
  url.searchParams.set('query', query);
  url.searchParams.set('start', String(start));
  url.searchParams.set('end', String(end));
  url.searchParams.set('step', String(step));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Prometheus query_range failed (${res.status})`);
  return (await res.json()) as PrometheusQueryResponse;
}

export async function queryInstant(baseUrl: string, query: string): Promise<PrometheusQueryResponse> {
  const url = new URL('/api/v1/query', baseUrl);
  url.searchParams.set('query', query);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Prometheus query failed (${res.status})`);
  return (await res.json()) as PrometheusQueryResponse;
}

export function extractSeriesValues(values: PrometheusSample[]) {
  return values.map((entry) => ({
    ts: toNumber(entry[0]),
    value: toNumber(entry[1])
  }));
}

export function extractInstantValue(payload: PrometheusQueryResponse | null | undefined) {
  const value = payload?.data?.result?.[0]?.value?.[1];
  return toNumber(value);
}
