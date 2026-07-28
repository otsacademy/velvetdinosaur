import { NextResponse } from 'next/server';

import { requireInstallerAdmin } from '@/lib/admin';
import {
  extractInstantValue,
  extractSeriesValues,
  getPrometheusBaseUrl,
  parseRangeSeconds,
  queryInstant,
  queryRange,
  toNumber,
  type PrometheusQueryResponse
} from '@/lib/observability/prometheus';

type SeriesPoint = { ts: number; value: number };

function extractSeries(payload: PrometheusQueryResponse): SeriesPoint[] {
  return extractSeriesValues(payload.data?.result?.[0]?.values ?? []);
}

export async function GET(request: Request) {
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range');
  const stepParam = searchParams.get('step');
  const rangeSeconds = parseRangeSeconds(rangeParam);
  const end = Math.floor(Date.now() / 1000);
  const start = end - rangeSeconds;
  const step = Math.max(15, toNumber(stepParam) || Math.ceil(rangeSeconds / 120));

  const baseUrl = getPrometheusBaseUrl();

  try {
    const [uptimeRes, responseRes, totalRes, upRes] = await Promise.all([
      queryRange(
        baseUrl,
        'avg(probe_success{job="blackbox-http"})',
        start,
        end,
        step
      ),
      queryRange(
        baseUrl,
        'avg(probe_duration_seconds{job="blackbox-http"})',
        start,
        end,
        step
      ),
      queryInstant(baseUrl, 'count(probe_success{job="blackbox-http"})'),
      queryInstant(baseUrl, 'sum(probe_success{job="blackbox-http"})')
    ]);

    return NextResponse.json({
      range: { start, end, step },
      series: {
        uptime: extractSeries(uptimeRes),
        response: extractSeries(responseRes)
      },
      targets: {
        total: extractInstantValue(totalRes),
        up: extractInstantValue(upRes)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Prometheus unavailable';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
