'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { slugify } from '@/components/edit/dialog-utils';
import { AssetPickerField } from '@/components/puck/fields/asset-picker-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { DemoTravelRoute, DemoTravelStay } from '@/lib/demo-travel-seed';
import { cn } from '@/lib/utils';

type DemoRouteEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: DemoTravelRoute | null;
  stays: DemoTravelStay[];
  onSave: (route: DemoTravelRoute) => void;
  onDelete?: (slug: string) => void;
};

function emptyRoute(): DemoTravelRoute {
  return {
    slug: '',
    name: '',
    region: '',
    durationDays: 3,
    durationNights: 2,
    season: '',
    summary: '',
    status: 'draft',
    heroImage: '',
    staySlugs: [],
    itinerary: [],
    seats: 8,
    price: 0,
    currency: 'GBP',
    isStartingFrom: true,
  };
}

export function DemoRouteEditorDialog({
  open,
  onOpenChange,
  route,
  stays,
  onSave,
  onDelete,
}: DemoRouteEditorDialogProps) {
  const [draft, setDraft] = useState<DemoTravelRoute>(route ?? emptyRoute());
  const [itineraryText, setItineraryText] = useState('');

  useEffect(() => {
    if (!open) return;
    const next = route ?? emptyRoute();
    setDraft(next);
    setItineraryText(next.itinerary.join('\n'));
  }, [open, route]);

  function toggleStay(staySlug: string) {
    setDraft((current) => ({
      ...current,
      staySlugs: current.staySlugs.includes(staySlug)
        ? current.staySlugs.filter((item) => item !== staySlug)
        : [...current.staySlugs, staySlug],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSlug = slugify(draft.slug || draft.name);
    if (!nextSlug || !draft.name.trim()) {
      return toast.error('Add a route name before saving the demo record.');
    }
    onSave({
      ...draft,
      slug: nextSlug,
      name: draft.name.trim(),
      region: draft.region.trim(),
      season: draft.season.trim(),
      summary: draft.summary.trim(),
      itinerary: itineraryText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>{route ? `Edit ${route.name}` : 'Add demo route'}</DialogTitle>
            <DialogDescription>
              This route planner is seeded with fictional content and linked back to the stays and booking demos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="route-name">Route name</Label>
                  <Input
                    id="route-name"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Coastal Foraging Loop"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-region">Region</Label>
                  <Input
                    id="route-region"
                    value={draft.region}
                    onChange={(event) => setDraft((current) => ({ ...current, region: event.target.value }))}
                    placeholder="North Cornwall"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(value) =>
                      setDraft((current) => ({ ...current, status: value as DemoTravelRoute['status'] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-days">Days</Label>
                  <Input
                    id="route-days"
                    type="number"
                    value={draft.durationDays}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, durationDays: Number(event.target.value || 0) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-nights">Nights</Label>
                  <Input
                    id="route-nights"
                    type="number"
                    value={draft.durationNights}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, durationNights: Number(event.target.value || 0) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-season">Season</Label>
                  <Input
                    id="route-season"
                    value={draft.season}
                    onChange={(event) => setDraft((current) => ({ ...current, season: event.target.value }))}
                    placeholder="April to September"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-seats">Seats</Label>
                  <Input
                    id="route-seats"
                    type="number"
                    value={draft.seats}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, seats: Number(event.target.value || 0) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-price">Price</Label>
                  <Input
                    id="route-price"
                    type="number"
                    value={draft.price}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, price: Number(event.target.value || 0) }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="route-summary">Summary</Label>
                  <Textarea
                    id="route-summary"
                    rows={4}
                    value={draft.summary}
                    onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Short route summary"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
              <div className="space-y-2">
                <Label>Hero image</Label>
                <AssetPickerField
                  value={draft.heroImage}
                  onChange={(value) => setDraft((current) => ({ ...current, heroImage: value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="route-itinerary">Itinerary steps</Label>
                <Textarea
                  id="route-itinerary"
                  rows={9}
                  value={itineraryText}
                  onChange={(event) => setItineraryText(event.target.value)}
                  placeholder={'Arrival and kitchen setup\nGuided walk and lunch\nFinal supper and departure'}
                />
              </div>
            </section>
          </div>

          <section className="space-y-3 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--vd-fg)]">Linked stays</p>
              <p className="text-sm text-[var(--vd-muted-fg)]">Mix route data with one or more stay records.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stays.map((stay) => {
                const active = draft.staySlugs.includes(stay.slug);
                return (
                  <button
                    key={stay.slug}
                    type="button"
                    onClick={() => toggleStay(stay.slug)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-sm transition-colors',
                      active
                        ? 'border-[var(--vd-secondary)] bg-[color-mix(in_oklch,var(--vd-secondary)_16%,var(--vd-card))] text-[var(--vd-secondary-fg)]'
                        : 'border-[var(--vd-border)] bg-[var(--vd-bg)] text-[var(--vd-fg)] hover:bg-[var(--vd-muted)]'
                    )}
                  >
                    {stay.name}
                  </button>
                );
              })}
            </div>
          </section>

          <DialogFooter className="flex items-center justify-between gap-3">
            <div>
              {route && onDelete ? (
                <Button type="button" variant="outline" onClick={() => onDelete(route.slug)}>
                  Remove route
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save demo route</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
