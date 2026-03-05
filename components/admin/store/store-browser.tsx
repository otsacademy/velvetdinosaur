'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BlocksList } from './blocks-list';
import { ComponentsList } from './components-list';
import type { StoreItem } from './store-types';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(haystack: string[], query: string) {
  if (!query) return true;
  return haystack.some((value) => normalize(value).includes(query));
}

type InstalledBlock = {
  id: string;
  name: string;
  key: string;
  version: string;
  installedAt: string;
};

type InstallPayload = {
  installed: InstalledBlock[];
  writeEnabled: boolean;
  adminAllowed: boolean;
};

export function StoreBrowser() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<StoreItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [installPayload, setInstallPayload] = useState<InstallPayload | null>(null);
  const [installMessage, setInstallMessage] = useState<string>('');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [rebuild, setRebuild] = useState<boolean>(true);
  const normalizedQuery = normalize(query);

  const filteredComponents = useMemo(() => {
    const source = (items || []).filter((item) => item.type === 'primitive');
    return source.filter((item) =>
      matchesQuery(
        [item.name, item.description || '', ...(item.tags || []), ...(item.categories || [])],
        normalizedQuery
      )
    );
  }, [items, normalizedQuery]);

  const filteredBlocks = useMemo(() => {
    const source = (items || []).filter((item) => item.type === 'block');
    return source.filter((item) =>
      matchesQuery(
        [item.name, item.description || '', ...(item.tags || []), ...(item.categories || [])],
        normalizedQuery
      )
    );
  }, [items, normalizedQuery]);

  const componentCount = filteredComponents.length;
  const blockCount = filteredBlocks.length;

  const installedIds = useMemo(() => {
    const map = new Set<string>();
    installPayload?.installed.forEach((item) => map.add(item.id));
    return map;
  }, [installPayload]);

  const canInstall = Boolean(installPayload?.writeEnabled && installPayload?.adminAllowed);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [storeRes, installRes] = await Promise.all([
          fetch('/api/store/index'),
          fetch('/api/components/list')
        ]);
        if (storeRes.ok) {
          const data = await storeRes.json();
          if (active) {
            setItems(data?.items || []);
          }
        }
        if (installRes.ok) {
          const data = await installRes.json();
          if (active) {
            setInstallPayload({
              installed: data?.installed || [],
              writeEnabled: Boolean(data?.writeEnabled),
              adminAllowed: Boolean(data?.adminAllowed)
            });
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const handleInstall = async (item: StoreItem, options?: { openPuck?: boolean }) => {
    if (!canInstall) {
      setInstallMessage('Installs are disabled for your account.');
      return;
    }
    setInstallingId(item.id);
    setInstallMessage('');
    const res = await fetch('/api/components/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, rebuild })
    });
    const data = await res.json();
    if (!res.ok) {
      setInstallMessage(data?.error || 'Install failed.');
      setInstallingId(null);
      return;
    }
    setInstallMessage(
      data?.buildResult?.restarted
        ? `Installed and restarted ${data.buildResult.name}.`
        : 'Installed. Run `bun run build` and restart PM2 to activate.'
    );
    const refreshed = await fetch('/api/components/list').then((response) =>
      response.ok ? response.json() : null
    );
    if (refreshed) {
      setInstallPayload({
        installed: refreshed?.installed || [],
        writeEnabled: Boolean(refreshed?.writeEnabled),
        adminAllowed: Boolean(refreshed?.adminAllowed)
      });
    }
    setInstallingId(null);
    if (options?.openPuck) {
      router.push('/edit');
    }
  };

  const handleUse = async (item: StoreItem) => {
    if (installedIds.has(item.id)) {
      router.push('/edit');
      return;
    }
    await handleInstall(item, { openPuck: true });
  };

  return (
    <div className="bg-[var(--vd-bg)]">
      <section className="relative overflow-hidden border-b border-[var(--vd-border)] bg-gradient-to-b from-white via-white to-[var(--vd-muted)]/30">
        <div className="absolute -top-24 left-1/2 h-56 w-[560px] -translate-x-1/2 rounded-full bg-[var(--vd-primary)]/20 blur-3xl" />
        <div className="container relative py-16">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-transparent bg-[var(--vd-primary)] text-[var(--vd-primary-fg)]">
                Admin Store
              </Badge>
              <Badge>Puck-compatible</Badge>
              <Badge>shadcn/ui</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold md:text-5xl">Component Storefront</h1>
              <p className="max-w-2xl text-base text-[var(--vd-muted-fg)] md:text-lg">
                Browse Puck-ready shadcn primitives and block collections. Every entry is wrapped for
                editor safety and ready to drop into pages.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="w-full md:max-w-md">
                <Input
                  placeholder="Search components and blocks"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setQuery('')} disabled={!query}>
                Clear search
              </Button>
              <Button asChild>
                <Link href="/edit">Open Puck Editor</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--vd-muted-fg)]">
              {installPayload ? (
                <>
                  <Badge>Installs {canInstall ? 'enabled' : 'disabled'}</Badge>
                  <Badge>Admin {installPayload.adminAllowed ? 'allowed' : 'blocked'}</Badge>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rebuild}
                      onChange={(event) => setRebuild(event.target.checked)}
                    />
                    <span>Rebuild after install</span>
                  </label>
                  {installMessage ? <span className="text-[var(--vd-fg)]">{installMessage}</span> : null}
                </>
              ) : (
                <span>Checking install permissions…</span>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Card className="bg-white/70">
                <CardHeader>
                  <CardTitle>{componentCount} components</CardTitle>
                  <CardDescription>Primitives wrapped for Puck.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-white/70">
                <CardHeader>
                  <CardTitle>{blockCount} block collections</CardTitle>
                  <CardDescription>All shadcn blocks, grouped by use case.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-white/70">
                <CardHeader>
                  <CardTitle>Editor-safe</CardTitle>
                  <CardDescription>Validated schemas and predictable props.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container space-y-6 py-12" id="components">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold">Components</h2>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            Here you can find all the components available in the library. We are working on adding
            more components.
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--vd-muted-fg)]">Loading components…</p>
        ) : (
          <ComponentsList
            items={filteredComponents}
            installedIds={installedIds}
            installingId={installingId}
            canInstall={canInstall}
            onUse={handleUse}
          />
        )}
        <p className="text-sm text-[var(--vd-muted-fg)]">
          Can&apos;t find what you need? Try the{' '}
          <a
            className="text-[var(--vd-primary)] underline-offset-4 hover:underline"
            href="https://ui.shadcn.com/docs/directory"
            rel="noreferrer"
            target="_blank"
          >
            registry directory
          </a>{' '}
          for community-maintained components.
        </p>
      </section>

      <section className="container space-y-6 py-12" id="blocks">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold">Blocks</h2>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            Every shadcn/ui block is available here with Puck-ready schemas and safe defaults.
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--vd-muted-fg)]">Loading blocks…</p>
        ) : (
          <BlocksList
            items={filteredBlocks}
            installedIds={installedIds}
            installingId={installingId}
            canInstall={canInstall}
            onUse={handleUse}
          />
        )}
        <p className="text-sm text-[var(--vd-muted-fg)]">
          Want the original source blocks?{' '}
          <a
            className="text-[var(--vd-primary)] underline-offset-4 hover:underline"
            href="https://ui.shadcn.com/blocks"
            rel="noreferrer"
            target="_blank"
          >
            Browse shadcn/ui blocks
          </a>
          .
        </p>
      </section>

      <section className="container pb-16">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Need something custom?</CardTitle>
            <CardDescription>
              Build a new block, register it in the component store, and it will appear here with
              the same Puck-safe wrappers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <Button asChild variant="outline">
              <Link href="/admin/store#component-store">Open Component Store</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/theme">Theme Editor</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
