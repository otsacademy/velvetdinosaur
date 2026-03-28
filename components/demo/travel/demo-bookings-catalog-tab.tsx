'use client';

import { Boxes, Link2, RefreshCcw, Route as RouteIcon, TriangleAlert } from 'lucide-react';
import { InventoryKindBadge, formatTravelMoney } from '@/components/demo/travel/demo-travel-ui';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import type { DemoTravelInventoryItem, DemoTravelProduct } from '@/lib/demo-travel-seed';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';
import { cn } from '@/lib/utils';

type DemoBookingsCatalogTabProps = {
  inventory: DemoTravelInventoryItem[];
  productsBySlug: Map<string, DemoTravelProduct>;
  syncingSlug: string | null;
  onSyncInventory: (slug: string) => void;
  onSyncAll: () => void;
};

function StatCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warn' }) {
  return (
    <div
      className={cn(
        'rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-3',
        tone === 'warn' && 'border-[color-mix(in_oklch,var(--vd-destructive)_40%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-destructive)_8%,var(--vd-card))]'
      )}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold text-[var(--vd-fg)]', tone === 'warn' && 'text-[var(--vd-destructive)]')}>{value}</p>
    </div>
  );
}

export function DemoBookingsCatalogTab({
  inventory,
  productsBySlug,
  syncingSlug,
  onSyncInventory,
  onSyncAll,
}: DemoBookingsCatalogTabProps) {
  const matched = inventory.filter((item) => productsBySlug.has(item.slug)).length;
  const missing = inventory.length - matched;

  return (
    <TabsContent value="catalog" className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Inventory" value={inventory.length} />
        <StatCard label="Mapped" value={matched} />
        <StatCard label="Products" value={productsBySlug.size} />
        <StatCard label="Needs sync" value={missing} tone={missing > 0 ? 'warn' : 'default'} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-3">
        <p className="text-sm text-[var(--vd-muted-fg)]">
          Mix stay and route products in one fictional booking catalog.
        </p>
        <DemoHelpTooltip content="Create or refresh booking products from every seeded stay and route record in one go.">
          <Button type="button" variant="outline" onClick={onSyncAll}>
            <RefreshCcw className="h-4 w-4" />
            Sync all inventory
          </Button>
        </DemoHelpTooltip>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Inventory</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Local price</TableHead>
            <TableHead>Booking product</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => {
            const product = productsBySlug.get(item.slug);
            const syncingThis = syncingSlug === item.slug;
            return (
              <TableRow key={item.slug} className="hover:bg-[color-mix(in_oklch,var(--vd-primary)_8%,transparent)]">
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--vd-fg)]">{item.name}</p>
                      <InventoryKindBadge kind={item.kind} />
                    </div>
                    <p className="text-xs text-[var(--vd-muted-fg)]">{item.slug}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-[var(--vd-muted-fg)]">{item.region}</TableCell>
                <TableCell className="text-sm text-[var(--vd-fg)]">
                  {formatTravelMoney(item.price, item.currency || 'GBP', item.isStartingFrom)}
                </TableCell>
                <TableCell>
                  {product ? (
                    <div className="space-y-1">
                      <p className="font-medium text-[var(--vd-fg)]">{product.name}</p>
                      <p className="text-xs text-[var(--vd-muted-fg)]">{product.slug}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--vd-muted-fg)]">No product mapped yet</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      'border-transparent',
                      product
                        ? 'bg-[color-mix(in_oklch,var(--vd-accent)_28%,var(--vd-card))] text-[var(--vd-accent-fg)]'
                        : 'bg-[color-mix(in_oklch,var(--vd-destructive)_12%,var(--vd-card))] text-[var(--vd-destructive)]'
                    )}
                  >
                    {product ? (
                      <>
                        <Link2 className="mr-1 h-3.5 w-3.5" />
                        Mapped
                      </>
                    ) : (
                      <>
                        <TriangleAlert className="mr-1 h-3.5 w-3.5" />
                        Needs sync
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DemoHelpTooltip content="Turn this inventory record into a demo booking product, or refresh the existing mapping with the latest seeded details.">
                    <Button type="button" size="sm" variant={product ? 'outline' : 'default'} onClick={() => onSyncInventory(item.slug)} disabled={syncingThis}>
                      {syncingThis ? <Boxes className="h-4 w-4 animate-pulse" /> : <RouteIcon className="h-4 w-4" />}
                      {product ? 'Resync' : 'Sync'}
                    </Button>
                  </DemoHelpTooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TabsContent>
  );
}
