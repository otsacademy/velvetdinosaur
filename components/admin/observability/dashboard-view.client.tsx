"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatMetricValue } from '@/lib/observability/format';
import type { MetricUnit } from '@/lib/observability/types';
import { AreaChartCard } from '@/components/admin/observability/area-chart-card';

type DashboardMeta = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
};

type StatRow = {
  id: string;
  label: string;
  unit?: MetricUnit;
  value: number | null;
  error?: string;
};

type SeriesData = { name: string; data: { ts: number; value: number }[] };

type ChartRow = {
  id: string;
  title: string;
  unit?: MetricUnit;
  series: SeriesData[];
  error?: string | null;
};

type DashboardResponse = {
  dashboard: DashboardMeta;
  range: { start: number; end: number; step: number };
  stats: StatRow[];
  charts: ChartRow[];
};

const RANGE_OPTIONS = ['1h', '6h', '24h', '7d'] as const;

type Props = {
  dashboard: DashboardMeta;
};

export function DashboardView({ dashboard }: Props) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>('6h');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/metrics/dashboards/${dashboard.slug}?range=${encodeURIComponent(range)}`)
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled) return;
        if (payload?.error) {
          setError(payload.error);
          setData(null);
        } else {
          setData(payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
        setData(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dashboard.slug, range]);

  const rangeSeconds = useMemo(() => {
    if (data?.range?.start && data?.range?.end) {
      return Math.max(0, data.range.end - data.range.start);
    }
    return 6 * 60 * 60;
  }, [data]);

  const handleRangeChange = (option: (typeof RANGE_OPTIONS)[number]) => {
    if (option === range) return;
    setLoading(true);
    setError(null);
    setRange(option);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/observability">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboards
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              {dashboard.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{dashboard.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option}
              variant={range === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRangeChange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {dashboard.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading dashboard data…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {data.stats.map((stat) => (
              <Card key={stat.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatMetricValue(stat.value, stat.unit)}
                  </p>
                  {stat.error ? (
                    <p className="mt-2 text-xs text-destructive">{stat.error}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {data.charts.map((chart) => (
              <AreaChartCard
                key={chart.id}
                title={chart.title}
                unit={chart.unit}
                series={chart.series}
                rangeSeconds={rangeSeconds}
                error={chart.error}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
