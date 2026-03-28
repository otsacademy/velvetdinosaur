'use client';

import { useMemo, useState } from 'react';
import { BedDouble, PencilLine, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DemoRouteEditorDialog } from '@/components/demo/travel/demo-route-editor-dialog';
import { DemoTravelStatCard, DemoTravelWorkspaceIntro, formatTravelMoney } from '@/components/demo/travel/demo-travel-ui';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createDemoTravelSeed, type DemoTravelRoute } from '@/lib/demo-travel-seed';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

export function DemoRoutesWorkspace() {
  const seed = useMemo(() => createDemoTravelSeed(), []);
  const [routes, setRoutes] = useState(seed.routes);
  const [editingSlug, setEditingSlug] = useState<string | null>('coastal-foraging-loop');
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalSeats = routes.reduce((total, route) => total + route.seats, 0);
  const linkedStays = routes.reduce((total, route) => total + route.staySlugs.length, 0);
  const draftCount = routes.filter((route) => route.status === 'draft').length;
  const activeRoute = editingSlug ? routes.find((route) => route.slug === editingSlug) ?? null : null;

  function openEditor(route: DemoTravelRoute | null) {
    setEditingSlug(route?.slug ?? null);
    setDialogOpen(true);
  }

  function handleSave(nextRoute: DemoTravelRoute) {
    setRoutes((current) => {
      const exists = current.some((route) => route.slug === nextRoute.slug);
      return exists
        ? current.map((route) => (route.slug === nextRoute.slug ? nextRoute : route))
        : [nextRoute, ...current];
    });
    setDialogOpen(false);
    toast.success('Route details updated inside the demo only.');
  }

  function handleDelete(slug: string) {
    setRoutes((current) => current.filter((route) => route.slug !== slug));
    setDialogOpen(false);
    toast.success('The route was removed from this demo session.');
  }

  return (
    <div className="space-y-6 py-2">
      <DemoTravelWorkspaceIntro
        eyebrow="Tours and routes"
        title="Sandboxed routes planner"
        description="Edit a fictional route programme with durations, linked stays, itinerary steps, and price points. The underlying demo records intentionally mix stay inventory and route planning."
        imageSrc="/assets/demo-media/travel/routes/tramuntana-olive-road.svg"
        imageAlt="Fictional route artwork"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <DemoTravelStatCard label="Route records" value={String(routes.length)} detail="Fictional programmes" />
          <DemoTravelStatCard label="Linked stays" value={String(linkedStays)} detail="Cross-links back to the stay inventory" />
          <DemoTravelStatCard label="Available seats" value={String(totalSeats)} detail={`${draftCount} draft route plans`} />
        </div>
      </DemoTravelWorkspaceIntro>

      <section className="rounded-[1.75rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--vd-fg)]">Routes</h3>
            <p className="text-sm text-[var(--vd-muted-fg)]">Edit route summaries, capacities, and linked stays.</p>
          </div>
          <DemoHelpTooltip content="Create a new fictional route and connect it back to the seeded stay records.">
            <Button type="button" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" />
              Add route
            </Button>
          </DemoHelpTooltip>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Linked stays</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.slug} className="hover:bg-[color-mix(in_oklch,var(--vd-secondary)_8%,transparent)]">
                <TableCell>
                  <p className="font-medium text-[var(--vd-fg)]">{route.name}</p>
                  <p className="text-xs text-[var(--vd-muted-fg)]">{route.region}</p>
                </TableCell>
                <TableCell className="text-sm text-[var(--vd-muted-fg)]">
                  {route.durationDays} days / {route.durationNights} nights
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {route.staySlugs.map((staySlug) => {
                      const stay = seed.stays.find((item) => item.slug === staySlug);
                      return (
                        <Badge key={staySlug} className="border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-card))] text-[var(--vd-primary)]">
                          <BedDouble className="mr-1 h-3.5 w-3.5" />
                          {stay?.name || staySlug}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-[var(--vd-fg)]">
                  {formatTravelMoney(route.price, route.currency, route.isStartingFrom)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      route.status === 'active'
                        ? 'border-transparent bg-[color-mix(in_oklch,var(--vd-accent)_28%,var(--vd-card))] text-[var(--vd-accent-fg)]'
                        : 'border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-card))] text-[var(--vd-primary)]'
                    }
                  >
                    {route.status === 'active' ? 'Active' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DemoHelpTooltip content="Open the route editor to adjust itinerary, linked stays, seats, and pricing for this demo item.">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEditor(route)}>
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

      <DemoRouteEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        route={activeRoute}
        stays={seed.stays}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
