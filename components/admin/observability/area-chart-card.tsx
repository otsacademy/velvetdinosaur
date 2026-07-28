"use client";

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/registry/new-york-v4/ui/chart';
import { formatMetricValue } from '@/lib/observability/format';
import type { MetricUnit } from '@/lib/observability/types';

type RangePoint = { ts: number; value: number };
type SeriesData = { name: string; data: RangePoint[] };

type Props = {
  title: string;
  unit?: MetricUnit;
  series: SeriesData[];
  rangeSeconds: number;
  error?: string | null;
};

const CHART_COLORS = [
  'var(--primary)',
  'var(--accent)',
  'var(--ring)',
  'var(--destructive)',
  'var(--muted-foreground)',
  'var(--vd-secondary-fg)'
];

export function AreaChartCard({ title, unit, series, rangeSeconds, error }: Props) {
  const mergedData = useMemo(() => {
    const map = new Map<number, Record<string, number>>();
    series.forEach((entry, idx) => {
      entry.data.forEach((point) => {
        const existing = map.get(point.ts) || { ts: point.ts };
        existing[`s${idx}`] = point.value;
        map.set(point.ts, existing as Record<string, number>);
      });
    });
    return Array.from(map.values()).sort((a, b) => (a.ts as number) - (b.ts as number));
  }, [series]);

  const config = useMemo(() => {
    return series.reduce<Record<string, { label: string; color: string }>>((acc, entry, idx) => {
      acc[`s${idx}`] = {
        label: entry.name,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      };
      return acc;
    }, {});
  }, [series]);

  const formatTick = (value: number) => {
    if (!Number.isFinite(value)) return '';
    const date = new Date(value);
    if (!isValid(date)) return '';
    if (rangeSeconds <= 24 * 60 * 60) {
      return format(date, 'HH:mm');
    }
    return format(date, 'MMM d');
  };

  return (
    <Card className="min-w-0 rounded-[var(--vd-radius)] border-[var(--vd-border)] bg-[var(--vd-card)] shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3">
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        {mergedData.length === 0 ? (
          <div className="text-xs text-muted-foreground">No data available.</div>
        ) : (
          <ChartContainer config={config} className="h-[220px] min-w-0 w-full">
            <AreaChart data={mergedData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="ts" tickLine={false} axisLine={false} tickFormatter={formatTick} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatMetricValue(Number(value), unit)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => formatTick(label as number)}
                    formatter={(value) => formatMetricValue(Number(value), unit)}
                  />
                }
              />
              {series.map((entry, idx) => (
                <Area
                  key={entry.name}
                  dataKey={`s${idx}`}
                  type="monotone"
                  stroke={`var(--color-s${idx})`}
                  fill={`var(--color-s${idx})`}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
