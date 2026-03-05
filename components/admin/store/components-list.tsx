'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StoreItem } from './store-types';

const statusStyles: Record<string, string> = {
  ready: 'border-transparent bg-[var(--vd-accent)] text-[var(--vd-accent-fg)]',
  beta: 'border-transparent bg-amber-100 text-amber-900',
  experimental: 'border-transparent bg-rose-100 text-rose-900'
};

type ComponentsListProps = {
  items: StoreItem[];
  installedIds?: Set<string>;
  installingId?: string | null;
  canInstall?: boolean;
  onUse?: (item: StoreItem) => void;
};

export function ComponentsList({
  items,
  installedIds,
  installingId,
  canInstall = false,
  onUse
}: ComponentsListProps) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-white/40 text-center">
        <CardHeader>
          <CardTitle>No components found</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--vd-muted-fg)]">
          Try adjusting your search or filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const installed = installedIds?.has(item.id) ?? false;
        const isInstalling = installingId === item.id;
        return (
        <Card key={item.id} className="flex h-full flex-col">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{item.name}</CardTitle>
              <Badge className={cn('capitalize', statusStyles[item.status ?? 'ready'])}>
                {item.status ?? 'ready'}
              </Badge>
            </div>
            <p className="text-sm text-[var(--vd-muted-fg)]">
              {item.description || 'Puck-ready shadcn primitive.'}
            </p>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="flex flex-wrap gap-2">
              {(item.tags || []).map((tag) => (
                <Badge key={`${item.id}-${tag}`} className="bg-white text-[var(--vd-muted-fg)]">
                  {tag}
                </Badge>
              ))}
              {item.source ? (
                <Badge className="border-transparent bg-[var(--vd-primary)]/10 text-[var(--vd-primary)]">
                  {item.source}
                </Badge>
              ) : null}
              <Badge className="border-transparent bg-[var(--vd-accent)]/60 text-[var(--vd-accent-fg)]">
                Puck wrapper
              </Badge>
              {installed ? (
                <Badge className="border-transparent bg-emerald-100 text-emerald-900">
                  Installed
                </Badge>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-[var(--vd-muted-fg)]">Version {item.version}</p>
          </CardContent>
          <CardFooter className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/store/preview?id=${encodeURIComponent(item.id)}`} prefetch={false}>
                Preview
              </Link>
            </Button>
            <Button
              size="sm"
              disabled={(!installed && !canInstall) || isInstalling}
              onClick={() => onUse?.(item)}
            >
              {isInstalling ? 'Installing…' : installed ? 'Open in Puck' : 'Use in Puck'}
            </Button>
          </CardFooter>
        </Card>
        );
      })}
    </div>
  );
}
