'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StoreItem } from './store-types';

const toneClasses: string[] = [
  'bg-gradient-to-br from-amber-100 via-white to-orange-100',
  'bg-gradient-to-br from-sky-100 via-white to-indigo-100',
  'bg-gradient-to-br from-lime-100 via-white to-amber-100',
  'bg-gradient-to-br from-purple-100 via-white to-indigo-100',
  'bg-gradient-to-br from-rose-100 via-white to-pink-100',
  'bg-gradient-to-br from-slate-100 via-white to-zinc-100',
  'bg-gradient-to-br from-emerald-100 via-white to-teal-100',
  'bg-gradient-to-br from-orange-100 via-white to-rose-100'
];

type BlocksListProps = {
  items: StoreItem[];
  installedIds?: Set<string>;
  installingId?: string | null;
  canInstall?: boolean;
  onUse?: (item: StoreItem) => void;
};

export function BlocksList({
  items,
  installedIds,
  installingId,
  canInstall = false,
  onUse
}: BlocksListProps) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-white/40 text-center">
        <CardHeader>
          <CardTitle>No blocks found</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--vd-muted-fg)]">
          Try adjusting your search or filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((collection, index) => {
        const installed = installedIds?.has(collection.id) ?? false;
        const isInstalling = installingId === collection.id;
        return (
        <Card key={collection.id} className="flex h-full flex-col">
          <div
            className={cn(
              'h-28 w-full rounded-[var(--vd-radius)] border border-[var(--vd-border)]',
              toneClasses[index % toneClasses.length]
            )}
          />
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{collection.name}</CardTitle>
              <Badge className="border-transparent bg-[var(--vd-primary)]/10 text-[var(--vd-primary)]">
                Puck-ready
              </Badge>
            </div>
            <p className="text-sm text-[var(--vd-muted-fg)]">
              {collection.description || 'Puck-ready shadcn block.'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {((collection.tags && collection.tags.length > 0)
                ? collection.tags
                : collection.categories || []
              ).map((tag) => (
                <Badge key={`${collection.id}-${tag}`} className="bg-white text-[var(--vd-muted-fg)]">
                  {tag}
                </Badge>
              ))}
              {installed ? (
                <Badge className="border-transparent bg-emerald-100 text-emerald-900">
                  Installed
                </Badge>
              ) : null}
            </div>
            <p className="mt-4 text-xs text-[var(--vd-muted-fg)]">Version {collection.version}</p>
          </CardContent>
          <CardFooter className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/store/preview?id=${encodeURIComponent(collection.id)}`} prefetch={false}>
                View collection
              </Link>
            </Button>
            <Button
              size="sm"
              disabled={(!installed && !canInstall) || isInstalling}
              onClick={() => onUse?.(collection)}
            >
              {isInstalling ? 'Installing…' : installed ? 'Open in Puck' : 'Install & open Puck'}
            </Button>
          </CardFooter>
        </Card>
        );
      })}
    </div>
  );
}
