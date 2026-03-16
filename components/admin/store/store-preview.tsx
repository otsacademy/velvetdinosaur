'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { previewRegistry } from '@/components/admin/store/preview-registry';
import type { StoreItem } from './store-types';

type InstalledBlock = {
  id: string;
  name: string;
  key: string;
  version: string;
  installedAt: string;
};

type InstallPayload = {
  activationCommand: string;
  activationMode: 'release' | 'restart';
  installBlockedReason: string | null;
  installed: InstalledBlock[];
  rebuildAllowed: boolean;
  runtimeInstallAllowed: boolean;
  writeEnabled: boolean;
  adminAllowed: boolean;
};

type StoreIndexPayload = {
  items: StoreItem[];
};

function toPascalCase(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('');
}

type PreviewComponent = React.ComponentType<Record<string, unknown>>;

async function resolvePreviewComponent(item: StoreItem): Promise<PreviewComponent> {
  if (Object.keys(previewRegistry).length === 0) {
    throw new Error('Store previews are disabled for this build.');
  }
  const entry = previewRegistry[item.id];
  if (!entry) {
    throw new Error('Preview is only available for shadcn items right now.');
  }

  const slug = item.id.replace(/^shadcn-(ui|block)-/, '');
  const mod = (await entry.importModule()) as Record<string, unknown>;
  const exportName = toPascalCase(slug);
  const resolved =
    (mod as { default?: unknown })?.default ||
    (exportName && mod[exportName]) ||
    Object.values(mod).find((value) => typeof value === 'function');
  if (!resolved || typeof resolved !== 'function') {
    throw new Error('Preview component export not found.');
  }
  const ResolvedComponent = resolved as PreviewComponent;
  if (item.type === 'primitive') {
    return function PrimitivePreview(props: Record<string, unknown>) {
      const children = (props as Record<string, unknown>)['children'];
      return (
        <ResolvedComponent {...props}>
          {children === undefined || children === null ? item.name : children}
        </ResolvedComponent>
      );
    };
  }
  return function BlockPreview(props: Record<string, unknown>) {
    return <ResolvedComponent {...props} />;
  };
}

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Preview failed to render. {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export function StorePreview({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<StoreItem | null>(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [previewComponent, setPreviewComponent] = useState<PreviewComponent | null>(null);
  const [previewError, setPreviewError] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [installPayload, setInstallPayload] = useState<InstallPayload | null>(null);
  const [installMessage, setInstallMessage] = useState('');
  const [installing, setInstalling] = useState(false);
  const [rebuild, setRebuild] = useState(true);

  const installedIds = useMemo(() => {
    const set = new Set<string>();
    installPayload?.installed?.forEach((entry) => set.add(entry.id));
    return set;
  }, [installPayload]);

  const canInstall = Boolean(installPayload?.writeEnabled && installPayload?.adminAllowed && installPayload?.runtimeInstallAllowed);
  const installed = item ? installedIds.has(item.id) : false;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingItem(true);
      try {
        const [storeRes, installRes] = await Promise.all([
          fetch('/api/store/index'),
          fetch('/api/components/list')
        ]);
        if (storeRes.ok) {
          const data = (await storeRes.json()) as StoreIndexPayload;
          const found = data?.items?.find((entry) => entry.id === id) || null;
          if (active) setItem(found);
        }
        if (installRes.ok) {
          const data = await installRes.json();
          if (active) {
            setInstallPayload({
              activationCommand: data?.activationCommand || 'bun run build',
              activationMode: data?.activationMode === 'release' ? 'release' : 'restart',
              installBlockedReason: data?.installBlockedReason || null,
              installed: data?.installed || [],
              rebuildAllowed: Boolean(data?.rebuildAllowed),
              runtimeInstallAllowed: Boolean(data?.runtimeInstallAllowed),
              writeEnabled: Boolean(data?.writeEnabled),
              adminAllowed: Boolean(data?.adminAllowed)
            });
          }
        }
      } finally {
        if (active) setLoadingItem(false);
      }
    };

    if (id) {
      void load();
    } else {
      setLoadingItem(false);
      setItem(null);
    }

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    const loadPreview = async () => {
      if (!item) return;
      setPreviewComponent(null);
      setLoadingPreview(true);
      setPreviewError('');
      try {
        const component = await resolvePreviewComponent(item);
        if (active) {
          setPreviewComponent(() => component);
        }
      } catch (error) {
        if (active) {
          setPreviewError(error instanceof Error ? error.message : 'Preview not available.');
        }
      } finally {
        if (active) {
          setLoadingPreview(false);
        }
      }
    };

    void loadPreview();

    return () => {
      active = false;
    };
  }, [item]);

  const handleUse = async () => {
    if (!item) return;
    if (installed) {
      router.push('/edit');
      return;
    }
    if (!canInstall) {
      setInstallMessage(installPayload?.installBlockedReason || 'Installs are disabled for your account.');
      return;
    }
    setInstalling(true);
    setInstallMessage('');
    const res = await fetch('/api/components/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, rebuild })
    });
    const data = await res.json();
    if (!res.ok) {
      setInstallMessage(data?.error || 'Install failed.');
      setInstalling(false);
      return;
    }
    setInstallMessage(
      data?.buildResult?.restarted
        ? `Installed and restarted ${data.buildResult.name}.`
        : data?.buildResult?.message ||
            `Installed. Run \`${installPayload?.activationCommand || 'bun run build'}\` to activate.`
    );
    const refreshed = await fetch('/api/components/list').then((response) =>
      response.ok ? response.json() : null
    );
    if (refreshed) {
      setInstallPayload({
        activationCommand: refreshed?.activationCommand || 'bun run build',
        activationMode: refreshed?.activationMode === 'release' ? 'release' : 'restart',
        installBlockedReason: refreshed?.installBlockedReason || null,
        installed: refreshed?.installed || [],
        rebuildAllowed: Boolean(refreshed?.rebuildAllowed),
        runtimeInstallAllowed: Boolean(refreshed?.runtimeInstallAllowed),
        writeEnabled: Boolean(refreshed?.writeEnabled),
        adminAllowed: Boolean(refreshed?.adminAllowed)
      });
    }
    setInstalling(false);
    if (data?.buildResult?.restarted) {
      router.push('/edit');
    }
  };

  if (!id) {
    return (
      <section className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle>No item selected</CardTitle>
            <CardDescription>Select a component from the store to preview it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/store">Back to store</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="container space-y-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge className="border-transparent bg-[var(--vd-primary)]/10 text-[var(--vd-primary)]">
            Store preview
          </Badge>
          <h1 className="text-3xl font-semibold">{item?.name || 'Loading preview…'}</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            {item?.description || 'Previewing a Puck-ready component.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/store">Back to store</Link>
          </Button>
          <Button onClick={handleUse} disabled={installing || (!installed && !canInstall)}>
            {installing ? 'Installing…' : installed ? 'Open in Puck' : 'Install & open Puck'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Live preview</CardTitle>
          <CardDescription>
            Some primitives require configuration; this preview renders with minimal defaults.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingItem ? (
            <p className="text-sm text-[var(--vd-muted-fg)]">Loading item…</p>
          ) : item ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs text-[var(--vd-muted-fg)]">
                <Badge>{item.type}</Badge>
                {item.source ? <Badge>{item.source}</Badge> : null}
                {item.categories?.map((category) => (
                  <Badge key={`${item.id}-${category}`}>{category}</Badge>
                ))}
              </div>
              <div className="rounded-2xl border border-[var(--vd-border)] bg-white p-6">
                {loadingPreview ? (
                  <p className="text-sm text-[var(--vd-muted-fg)]">Rendering preview…</p>
                ) : previewError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                    {previewError}
                  </div>
                ) : previewComponent ? (
                  <PreviewErrorBoundary>
                    {React.createElement(previewComponent)}
                  </PreviewErrorBoundary>
                ) : (
                  <p className="text-sm text-[var(--vd-muted-fg)]">Preview not available.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--vd-muted-fg)]">Item not found in store.</p>
          )}
          {installPayload ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--vd-muted-fg)]">
              <Badge>Installs {canInstall ? 'enabled' : 'disabled'}</Badge>
              <Badge>Admin {installPayload.adminAllowed ? 'allowed' : 'blocked'}</Badge>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rebuild}
                  disabled={!installPayload.rebuildAllowed}
                  onChange={(event) => setRebuild(event.target.checked)}
                />
                <span>{installPayload.rebuildAllowed ? 'Rebuild after install' : 'Runtime rebuilds disabled here'}</span>
              </label>
              {installPayload.installBlockedReason ? <span>{installPayload.installBlockedReason}</span> : null}
              {installMessage ? <span className="text-[var(--vd-fg)]">{installMessage}</span> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
