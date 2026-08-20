'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { readJson, type SupportDevelopmentHoursPayload } from '@/components/edit/support/support-workspace.shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EMPTY_HOURS: SupportDevelopmentHoursPayload = {
  configured: false,
  source: 'unavailable',
  fetchedAt: null,
  totals: {
    planned: 0,
    used: 0,
    remaining: 0,
    period: 'Current period'
  },
  items: []
};

function round(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

export function SupportDevelopmentSchedulePanel() {
  const [payload, setPayload] = useState<SupportDevelopmentHoursPayload>(EMPTY_HOURS);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/support/development-hours', { cache: 'no-store', credentials: 'include' });
      const data = (await readJson(response)) as SupportDevelopmentHoursPayload & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to load development hours');
      setPayload({ ...EMPTY_HOURS, ...data });
    } catch (error) {
      setPayload({
        ...EMPTY_HOURS,
        error: error instanceof Error ? error.message : 'Unable to load development hours'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Development Schedule</CardTitle>
            <CardDescription>
              Source: {payload.source} · {payload.totals.period}
              {payload.fetchedAt ? ` · Updated ${new Date(payload.fetchedAt).toLocaleString()}` : ''}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Planned" value={round(payload.totals.planned)} />
            <Stat label="Used" value={round(payload.totals.used)} />
            <Stat label="Remaining" value={round(payload.totals.remaining)} />
          </div>
          {payload.error ? <p className="mt-3 text-sm text-destructive">{payload.error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module Breakdown</CardTitle>
          <CardDescription>Planned vs used development hours by module.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Module</th>
                  <th className="px-3 py-2 font-medium">Planned</th>
                  <th className="px-3 py-2 font-medium">Used</th>
                  <th className="px-3 py-2 font-medium">Remaining</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {payload.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      {isLoading ? 'Loading schedule...' : 'No development-hour records available.'}
                    </td>
                  </tr>
                ) : (
                  payload.items.map((item, index) => (
                    <tr key={`${item.module}-${index}`} className="border-t">
                      <td className="px-3 py-2 font-medium">{item.module}</td>
                      <td className="px-3 py-2">{round(item.planned)}</td>
                      <td className="px-3 py-2">{round(item.used)}</td>
                      <td className="px-3 py-2">{round(item.remaining)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
