"use client";

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type JobSummary = {
  id: string;
  status: 'queued' | 'running' | 'done';
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  exitCode?: number | null;
  site: { slug: string; domain: string };
};

type LogChunk = {
  chunk: string;
  nextOffset: number;
  exists: boolean;
};

type JobLogState = {
  job: JobSummary | null;
  log: string;
  offset: number;
  exists: boolean;
};

type Listener = () => void;

type Props = {
  jobId: string;
};

const DEFAULT_STATE: JobLogState = {
  job: null,
  log: '',
  offset: 0,
  exists: false
};

class JobLogStore {
  private state: JobLogState = { ...DEFAULT_STATE };
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private refreshing = false;

  constructor(private readonly jobId: string) {}

  getSnapshot = () => this.state;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    if (!this.timer) {
      void this.refresh();
      this.timer = setInterval(() => {
        void this.refresh();
      }, 3000);
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private async refresh() {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      const nextState: JobLogState = { ...this.state };
      let changed = false;

      const jobRes = await fetch(`/api/installer/jobs/${encodeURIComponent(this.jobId)}`);
      if (jobRes.ok) {
        const data = await jobRes.json().catch(() => null);
        nextState.job = data?.job || null;
        changed = true;
      }

      const logRes = await fetch(
        `/api/installer/jobs/${encodeURIComponent(this.jobId)}/log?offset=${nextState.offset}`
      );
      if (logRes.ok) {
        const data = (await logRes.json().catch(() => null)) as LogChunk | null;
        if (data?.exists) {
          nextState.exists = true;
          if (data.chunk) {
            nextState.log = nextState.log + data.chunk;
            nextState.offset = typeof data.nextOffset === 'number' ? data.nextOffset : nextState.offset;
            changed = true;
          }
        } else if (data && nextState.exists !== data.exists) {
          nextState.exists = data.exists;
          changed = true;
        }
      }

      if (changed) {
        this.state = nextState;
        this.emit();
      }
    } finally {
      this.refreshing = false;
    }
  }
}

const stores = new Map<string, JobLogStore>();

function getStore(jobId: string) {
  const existing = stores.get(jobId);
  if (existing) return existing;
  const created = new JobLogStore(jobId);
  stores.set(jobId, created);
  return created;
}

const noopSubscribe = () => () => {};

export function JobLogViewer({ jobId }: Props) {
  const invalidJobId = !jobId || jobId === 'undefined';
  const store = useMemo(() => (invalidJobId ? null : getStore(jobId)), [invalidJobId, jobId]);
  const snapshot = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? store.getSnapshot : () => DEFAULT_STATE,
    store ? store.getSnapshot : () => DEFAULT_STATE
  );

  if (invalidJobId) {
    return (
      <p className="text-sm text-[var(--vd-muted-fg)]">
        Missing job id. Return to the installs list and open a valid job.
      </p>
    );
  }

  if (!snapshot.job) {
    return <p className="text-sm text-[var(--vd-muted-fg)]">Loading job…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Installer job</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">{snapshot.job.id}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/sites">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <Badge className="bg-white text-[var(--vd-muted-fg)]">{snapshot.job.status}</Badge>
          <span>{snapshot.job.site.slug}</span>
          <span className="text-[var(--vd-muted-fg)]">{snapshot.job.site.domain}</span>
          {snapshot.job.exitCode !== undefined ? (
            <span className="text-[var(--vd-muted-fg)]">exit {snapshot.job.exitCode}</span>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[60vh] overflow-auto rounded-md bg-[var(--vd-muted)] p-3 text-xs">
            {snapshot.log || (snapshot.exists ? 'Waiting for log output…' : 'No log yet.')}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
