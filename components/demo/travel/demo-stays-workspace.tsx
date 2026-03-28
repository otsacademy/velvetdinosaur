'use client';

import { useMemo, useState } from 'react';
import { Plus, PencilLine, Route as RouteIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DemoStayEditorDialog } from '@/components/demo/travel/demo-stay-editor-dialog';
import { DemoTravelStatCard, DemoTravelWorkspaceIntro, formatTravelMoney } from '@/components/demo/travel/demo-travel-ui';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createDemoTravelSeed, type DemoTravelStay } from '@/lib/demo-travel-seed';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

export function DemoStaysWorkspace() {
  const seed = useMemo(() => createDemoTravelSeed(), []);
  const [stays, setStays] = useState(seed.stays);
  const [editingSlug, setEditingSlug] = useState<string | null>('tide-house');
  const [dialogOpen, setDialogOpen] = useState(false);

  const linkedRouteCount = stays.reduce((total, stay) => total + stay.linkedRouteSlugs.length, 0);
  const averageRate = Math.round(
    stays.reduce((total, stay) => total + (stay.price || 0), 0) / Math.max(stays.length, 1)
  );
  const draftCount = stays.filter((stay) => stay.status === 'draft').length;
  const activeStay = editingSlug ? stays.find((stay) => stay.slug === editingSlug) ?? null : null;

  function openEditor(stay: DemoTravelStay | null) {
    setEditingSlug(stay?.slug ?? null);
    setDialogOpen(true);
  }

  function handleSave(nextStay: DemoTravelStay) {
    setStays((current) => {
      const exists = current.some((stay) => stay.slug === nextStay.slug);
      return exists
        ? current.map((stay) => (stay.slug === nextStay.slug ? nextStay : stay))
        : [nextStay, ...current];
    });
    setDialogOpen(false);
    toast.success('Stay details updated inside the demo only.');
  }

  function handleDelete(slug: string) {
    setStays((current) => current.filter((stay) => stay.slug !== slug));
    setDialogOpen(false);
    toast.success('The stay was removed from this demo session.');
  }

  return (
    <div className="space-y-6 py-2">
      <DemoTravelWorkspaceIntro
        eyebrow="Travel inventory"
        title="Sandboxed stays manager"
        description="Manage a fictional stay portfolio with pricing, capacity, route links, and media. The records are mixed with the routes and booking demos, but none of this touches a live database."
        imageSrc="/assets/demo-media/travel/stays/tide-house-lounge.svg"
        imageAlt="Fictional Tide House stay artwork"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <DemoTravelStatCard label="Stay records" value={String(stays.length)} detail="Fictional property entries" />
          <DemoTravelStatCard label="Linked routes" value={String(linkedRouteCount)} detail="Cross-references to route plans" />
          <DemoTravelStatCard
            label="Average rate"
            value={formatTravelMoney(averageRate, 'GBP', false)}
            detail={`${draftCount} draft ${draftCount === 1 ? 'entry' : 'entries'}`}
          />
        </div>
      </DemoTravelWorkspaceIntro>

      <section className="rounded-[1.75rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--vd-fg)]">Stays</h3>
            <p className="text-sm text-[var(--vd-muted-fg)]">Edit a record to change imagery, pricing, or route links.</p>
          </div>
          <DemoHelpTooltip content="Create a fresh fictional stay record and link it into the wider travel demo.">
            <Button type="button" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" />
              Add stay
            </Button>
          </DemoHelpTooltip>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stay</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Linked routes</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stays.map((stay) => (
              <TableRow key={stay.slug} className="hover:bg-[color-mix(in_oklch,var(--vd-primary)_8%,transparent)]">
                <TableCell>
                  <p className="font-medium text-[var(--vd-fg)]">{stay.name}</p>
                  <p className="text-xs text-[var(--vd-muted-fg)]">{stay.location}</p>
                </TableCell>
                <TableCell className="text-sm text-[var(--vd-muted-fg)]">{stay.region}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {stay.linkedRouteSlugs.map((routeSlug) => {
                      const route = seed.routes.find((item) => item.slug === routeSlug);
                      return (
                        <Badge key={routeSlug} className="border-transparent bg-[color-mix(in_oklch,var(--vd-secondary)_24%,var(--vd-card))] text-[var(--vd-secondary-fg)]">
                          <RouteIcon className="mr-1 h-3.5 w-3.5" />
                          {route?.name || routeSlug}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-[var(--vd-fg)]">
                  {formatTravelMoney(stay.price, stay.currency, stay.isStartingFrom)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      stay.status === 'live'
                        ? 'border-transparent bg-[color-mix(in_oklch,var(--vd-accent)_28%,var(--vd-card))] text-[var(--vd-accent-fg)]'
                        : 'border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-card))] text-[var(--vd-primary)]'
                    }
                  >
                    {stay.status === 'live' ? 'Live' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DemoHelpTooltip content="Open the full stay editor to adjust pricing, linked routes, imagery, and status for this demo record.">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEditor(stay)}>
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </Button>
                  </DemoHelpTooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <DemoStayEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stay={activeStay}
        routes={seed.routes}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
