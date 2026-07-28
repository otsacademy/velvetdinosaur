import { NextResponse } from 'next/server';
import { requireInstallerAdmin } from '@/lib/admin';
import { getDashboard } from '@/lib/observability/dashboards';
import {
  extractInstantValue,
  extractSeriesValues,
  getPrometheusBaseUrl,
  parseRangeSeconds,
  queryInstant,
  queryRange,
  toNumber,
  type PrometheusResult
} from '@/lib/observability/prometheus';
import type { SeriesQuery } from '@/lib/observability/types';

type Params = {
  params: Promise<{ slug: string }>;
};

type RangePoint = { ts: number; value: number };

type SeriesResult = {
  name: string;
  data: RangePoint[];
};

function seriesNameFromResult(result: PrometheusResult, series: SeriesQuery, index: number) {
  if (series.name) return series.name;
  if (series.nameFromLabel) {
    const label = result.metric?.[series.nameFromLabel];
    if (label) return String(label);
  }
  const metric = result.metric || {};
  if (metric.instance) return String(metric.instance);
  if (metric.job) return String(metric.job);
  return `series-${index + 1}`;
}

export async function GET(request: Request, { params }: Params) {
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });
  }

  const slug = (await params).slug;
  const dashboard = getDashboard(slug);
  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range');
  const stepParam = searchParams.get('step');
  const rangeSeconds = parseRangeSeconds(rangeParam);
  const end = Math.floor(Date.now() / 1000);
  const start = end - rangeSeconds;
  const step = Math.max(15, toNumber(stepParam) || Math.ceil(rangeSeconds / 120));

  const baseUrl = getPrometheusBaseUrl();

  const stats = await Promise.all(
    dashboard.stats.map(async (stat) => {
      try {
        const payload = await queryInstant(baseUrl, stat.query);
        return {
          id: stat.id,
          label: stat.label,
          unit: stat.unit,
          value: extractInstantValue(payload)
        };
      } catch (error) {
        return {
          id: stat.id,
          label: stat.label,
          unit: stat.unit,
          value: null,
          error: error instanceof Error ? error.message : 'Query failed'
        };
      }
    })
  );

  const charts = await Promise.all(
    dashboard.charts.map(async (chart) => {
      const seriesResults: SeriesResult[] = [];
      const errors: string[] = [];

      for (const series of chart.series) {
        try {
          const payload = await queryRange(baseUrl, series.query, start, end, step);
          const results = payload.data?.result ?? [];
          if (series.nameFromLabel) {
            results.forEach((result, index) => {
              const name = seriesNameFromResult(result, series, index);
              seriesResults.push({
                name,
                data: extractSeriesValues(result.values ?? [])
              });
            });
          } else if (results.length > 0) {
            results.forEach((result, index) => {
              const name = seriesNameFromResult(result, series, index);
              seriesResults.push({
                name,
                data: extractSeriesValues(result.values ?? [])
              });
            });
          } else {
            seriesResults.push({
              name: series.name || 'Series',
              data: []
            });
          }
        } catch (error) {
          errors.push(error instanceof Error ? error.message : 'Query failed');
          seriesResults.push({
            name: series.name || 'Series',
            data: []
          });
        }
      }

      return {
        id: chart.id,
        title: chart.title,
        unit: chart.unit,
        series: seriesResults,
        error: errors.length > 0 ? errors.join('; ') : null
      };
    })
  );

  return NextResponse.json({
    dashboard: {
      slug: dashboard.slug,
      title: dashboard.title,
      description: dashboard.description,
      tags: dashboard.tags
    },
    range: { start, end, step },
    stats,
    charts
  });
}
