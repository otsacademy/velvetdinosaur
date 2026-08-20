'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type StoreBlock = {
  id: string;
  name: string;
  key?: string;
  version: string;
  description?: string;
};

type StoreIndex = {
  version?: string;
  blocks: StoreBlock[];
};

type InstalledBlock = {
  id: string;
  name: string;
  key: string;
  version: string;
  installedAt: string;
};

type StorePayload = {
  activationCommand: string;
  activationMode: 'release' | 'restart';
  installBlockedReason: string | null;
  store: StoreIndex;
  installed: InstalledBlock[];
  rebuildAllowed: boolean;
  runtimeInstallAllowed: boolean;
  storePath: string;
  writeEnabled: boolean;
  adminAllowed: boolean;
};

export function ComponentStoreClient() {
  const [payload, setPayload] = useState<StorePayload | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [rebuild, setRebuild] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetch('/api/components/list')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPayload(data);
        }
      })
      .catch(() => null);
  }, []);

  const installedMap = useMemo(() => {
    const map = new Map<string, InstalledBlock>();
    payload?.installed.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [payload]);

  const canInstall = Boolean(payload?.writeEnabled && payload?.adminAllowed && payload?.runtimeInstallAllowed);

  const handleInstall = async (id: string) => {
    if (!canInstall) {
      setMessage(payload?.installBlockedReason || 'Installs are disabled for your account.');
      return;
    }

    setLoadingId(id);
    setMessage('');
    const res = await fetch('/api/components/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, rebuild })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.error || 'Install failed');
      setLoadingId(null);
      return;
    }

    setMessage(
      data?.buildResult?.restarted
        ? `Installed and restarted ${data.buildResult.name}.`
        : data?.buildResult?.message || `Installed. Run \`${payload?.activationCommand || 'bun run build'}\` to activate.`
    );

    const refreshed = await fetch('/api/components/list').then((r) => (r.ok ? r.json() : null));
    if (refreshed) {
      setPayload(refreshed);
    }
    setLoadingId(null);
  };

  if (!payload) {
    return <p className="text-sm text-[var(--vd-muted-fg)]">Loading store…</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Store status</CardTitle>
          <CardDescription>Install controls and synchronization status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--vd-muted-fg)]">
          <p>Store version: {payload.store.version || 'unversioned'}</p>
          <p>
            Installs: {payload.writeEnabled ? 'enabled' : 'disabled'}
          </p>
          <p>
            Access level: {payload.adminAllowed ? 'admin-enabled' : 'restricted'}
          </p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rebuild}
              disabled={!payload.rebuildAllowed}
              onChange={(event) => setRebuild(event.target.checked)}
            />
            <span>{payload.rebuildAllowed ? 'Rebuild + restart after install' : 'Runtime rebuilds disabled here'}</span>
          </label>
          {payload.installBlockedReason ? <p>{payload.installBlockedReason}</p> : null}
          {message ? <p className="text-sm text-[var(--vd-fg)]">{message}</p> : null}
          <Button type="button" variant="ghost" size="sm" className="px-0" onClick={() => setShowAdvanced((prev) => !prev)}>
            {showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
          </Button>
          {showAdvanced ? (
            <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/25 p-3 text-xs">
              <p>Store path: {payload.storePath}</p>
              <p className="mt-1">
                Install writes: {payload.writeEnabled ? 'enabled' : 'disabled (configure in environment)'}
              </p>
              <p className="mt-1">
                Admin allowlist: {payload.adminAllowed ? 'configured' : 'not configured'}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {payload.store.blocks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No components found</CardTitle>
            <CardDescription>
              Add blocks to your component store and refresh.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {payload.store.blocks.map((block) => {
            const installed = installedMap.get(block.id);
            const previewHref = `/admin/store/preview?id=${encodeURIComponent(block.id)}`;
            return (
              <Card key={block.id}>
                <div className="border-b border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-3">
                  <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-white">
                    <iframe
                      title={`${block.name} preview`}
                      src={previewHref}
                      loading="lazy"
                      className="h-36 w-full"
                    />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>{block.name}</CardTitle>
                  <CardDescription>
                    {block.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    Version: <span className="text-[var(--vd-muted-fg)]">{block.version}</span>
                  </p>
                  {installed ? (
                    <p className="text-[var(--vd-muted-fg)]">
                      Installed v{installed.version} on {new Date(installed.installedAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-[var(--vd-muted-fg)]">Not installed</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={!canInstall || Boolean(installed) || loadingId === block.id}
                      onClick={() => handleInstall(block.id)}
                    >
                      {loadingId === block.id ? 'Installing…' : installed ? 'Installed' : 'Install'}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={previewHref} target="_blank" rel="noreferrer">
                        <LayoutTemplate className="h-4 w-4" />
                        Preview
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
