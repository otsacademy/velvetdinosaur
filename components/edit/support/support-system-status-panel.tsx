'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { readJson, type SupportSystemStatusPayload } from '@/components/edit/support/support-workspace.shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EMPTY_STATUS: SupportSystemStatusPayload = {
  configured: false,
  source: 'unavailable',
  fetchedAt: null,
  summary: {
    totalChecks: 0,
    operational: 0,
    degraded: 0,
    outage: 0,
    unknown: 0,
    incidents: 0
  },
  checks: [],
  incidents: []
};

function statusVariant(status: SupportSystemStatusPayload['checks'][number]['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'operational') return 'secondary';
  if (status === 'degraded') return 'outline';
  if (status === 'outage') return 'destructive';
  return 'default';
}

export function SupportSystemStatusPanel() {
  const [payload, setPayload] = useState<SupportSystemStatusPayload>(EMPTY_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/support/system-status', { cache: 'no-store', credentials: 'include' });
      const data = (await readJson(response)) as SupportSystemStatusPayload & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to load system status');
      setPayload({ ...EMPTY_STATUS, ...data });
    } catch (error) {
      setPayload({
        ...EMPTY_STATUS,
        error: error instanceof Error ? error.message : 'Unable to load system status'
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
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Source: {payload.source} {payload.fetchedAt ? `· Updated ${new Date(payload.fetchedAt).toLocaleString()}` : ''}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Stat label="Checks" value={payload.summary.totalChecks} />
            <Stat label="Operational" value={payload.summary.operational} />
            <Stat label="Degraded" value={payload.summary.degraded} />
            <Stat label="Outage" value={payload.summary.outage} />
            <Stat label="Unknown" value={payload.summary.unknown} />
            <Stat label="Incidents" value={payload.summary.incidents} />
          </div>
          {payload.error ? <p className="text-sm text-destructive">{payload.error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checks</CardTitle>
          <CardDescription>Latest health checks from the status source.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Service</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {payload.checks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-7 text-center text-muted-foreground">
                      {isLoading ? 'Loading checks...' : 'No status checks available.'}
                    </td>
                  </tr>
                ) : (
                  payload.checks.map((check) => (
                    <tr key={check.key} className="border-t">
                      <td className="px-3 py-2 font-medium">{check.label}</td>
                      <td className="px-3 py-2">
                        <Badge variant={statusVariant(check.status)}>{check.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{check.detail || '—'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {check.updatedAt ? new Date(check.updatedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incidents</CardTitle>
          <CardDescription>Active and recently resolved incidents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {payload.incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incidents reported.</p>
          ) : (
            payload.incidents.map((incident) => (
              <div key={incident.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{incident.title}</p>
                  <Badge variant="outline">{incident.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{incident.detail || 'No incident details.'}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Started: {incident.startedAt ? new Date(incident.startedAt).toLocaleString() : '—'} · Resolved:{' '}
                  {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : '—'}
                </p>
              </div>
            ))
          )}
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
