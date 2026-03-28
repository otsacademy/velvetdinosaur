'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AssetPickerField } from '@/components/puck/fields/asset-picker-field';
import { ImageListField } from '@/components/puck/fields/image-list-field';
import { slugify } from '@/components/edit/dialog-utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { DemoTravelRoute, DemoTravelStay } from '@/lib/demo-travel-seed';
import { formatTravelMoney } from '@/components/demo/travel/demo-travel-ui';
import { cn } from '@/lib/utils';

type DemoStayEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stay: DemoTravelStay | null;
  routes: DemoTravelRoute[];
  onSave: (stay: DemoTravelStay) => void;
  onDelete?: (slug: string) => void;
};

function emptyStay(): DemoTravelStay {
  return {
    slug: '',
    name: '',
    region: '',
    status: 'draft',
    location: '',
    type: '',
    summary: '',
    description: '',
    heroImage: '',
    gallery: [],
    price: 0,
    currency: 'GBP',
    isStartingFrom: true,
    badges: [],
    amenities: [],
    policies: [],
    details: { guests: 4, bedrooms: 2, bathrooms: 2, size: '140 sqm' },
    linkedRouteSlugs: [],
  };
}

export function DemoStayEditorDialog({
  open,
  onOpenChange,
  stay,
  routes,
  onSave,
  onDelete,
}: DemoStayEditorDialogProps) {
  const [draft, setDraft] = useState<DemoTravelStay>(stay ?? emptyStay());

  useEffect(() => {
    if (!open) return;
    setDraft(stay ?? emptyStay());
  }, [open, stay]);

  function toggleRoute(routeSlug: string) {
    setDraft((current) => ({
      ...current,
      linkedRouteSlugs: current.linkedRouteSlugs.includes(routeSlug)
        ? current.linkedRouteSlugs.filter((item) => item !== routeSlug)
        : [...current.linkedRouteSlugs, routeSlug],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSlug = slugify(draft.slug || draft.name);
    if (!nextSlug || !draft.name.trim()) {
      return toast.error('Add a stay name before saving the demo record.');
    }
    onSave({
      ...draft,
      slug: nextSlug,
      name: draft.name.trim(),
      region: draft.region.trim(),
      location: draft.location?.trim(),
      type: draft.type?.trim(),
      summary: draft.summary?.trim(),
      description: draft.description?.trim(),
      gallery: (draft.gallery || []).filter(Boolean),
      details: {
        guests: Number(draft.details?.guests || 0) || undefined,
        bedrooms: Number(draft.details?.bedrooms || 0) || undefined,
        bathrooms: Number(draft.details?.bathrooms || 0) || undefined,
        size: draft.details?.size?.trim() || undefined,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>{stay ? `Edit ${stay.name}` : 'Add demo stay'}</DialogTitle>
            <DialogDescription>
              This form mirrors a stay-management workflow, but everything saves only inside the sandbox session.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="stay-name">Stay name</Label>
                  <Input
                    id="stay-name"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Tide House"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-region">Region</Label>
                  <Input
                    id="stay-region"
                    value={draft.region}
                    onChange={(event) => setDraft((current) => ({ ...current, region: event.target.value }))}
                    placeholder="North Cornwall"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-location">Location</Label>
                  <Input
                    id="stay-location"
                    value={draft.location || ''}
                    onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Port Quin, North Cornwall"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-type">Stay type</Label>
                  <Input
                    id="stay-type"
                    value={draft.type || ''}
                    onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
                    placeholder="Sea-view townhouse"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(value) =>
                      setDraft((current) => ({ ...current, status: value as DemoTravelStay['status'] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="stay-summary">Summary</Label>
                  <Textarea
                    id="stay-summary"
                    rows={3}
                    value={draft.summary || ''}
                    onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Short front-of-house summary"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="stay-description">Description</Label>
                  <Textarea
                    id="stay-description"
                    rows={5}
                    value={draft.description || ''}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Internal overview for the fictional demo inventory"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stay-price">Nightly rate</Label>
                  <Input
                    id="stay-price"
                    type="number"
                    value={draft.price || 0}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, price: Number(event.target.value || 0) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-guests">Guests</Label>
                  <Input
                    id="stay-guests"
                    type="number"
                    value={draft.details?.guests || 0}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        details: { ...current.details, guests: Number(event.target.value || 0) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-bedrooms">Bedrooms</Label>
                  <Input
                    id="stay-bedrooms"
                    type="number"
                    value={draft.details?.bedrooms || 0}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        details: { ...current.details, bedrooms: Number(event.target.value || 0) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-bathrooms">Bathrooms</Label>
                  <Input
                    id="stay-bathrooms"
                    type="number"
                    value={draft.details?.bathrooms || 0}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        details: { ...current.details, bathrooms: Number(event.target.value || 0) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="stay-size">Size label</Label>
                  <Input
                    id="stay-size"
                    value={draft.details?.size || ''}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        details: { ...current.details, size: event.target.value },
                      }))
                    }
                    placeholder="180 sqm"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-[var(--vd-border)] bg-[var(--vd-muted)]/25 p-3 text-sm text-[var(--vd-muted-fg)]">
                Demo pricing preview: <span className="font-medium text-[var(--vd-fg)]">{formatTravelMoney(draft.price, draft.currency, draft.isStartingFrom)}</span>
              </div>
            </section>
          </div>

          <section className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
            <div className="space-y-2">
              <Label>Hero image</Label>
              <AssetPickerField
                value={draft.heroImage || ''}
                onChange={(value) => setDraft((current) => ({ ...current, heroImage: value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gallery</Label>
              <ImageListField
                value={draft.gallery || []}
                onChange={(value) => setDraft((current) => ({ ...current, gallery: value }))}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--vd-fg)]">Linked routes</p>
              <p className="text-sm text-[var(--vd-muted-fg)]">Tie the stay to one or more fictional travel routes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {routes.map((route) => {
                const active = draft.linkedRouteSlugs.includes(route.slug);
                return (
                  <button
                    key={route.slug}
                    type="button"
                    onClick={() => toggleRoute(route.slug)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-sm transition-colors',
                      active
                        ? 'border-[var(--vd-primary)] bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-card))] text-[var(--vd-primary)]'
                        : 'border-[var(--vd-border)] bg-[var(--vd-bg)] text-[var(--vd-fg)] hover:bg-[var(--vd-muted)]'
                    )}
                  >
                    {route.name}
                  </button>
                );
              })}
            </div>
          </section>

          <DialogFooter className="flex items-center justify-between gap-3">
            <div>
              {stay && onDelete ? (
                <Button type="button" variant="outline" onClick={() => onDelete(stay.slug)}>
                  Remove stay
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save demo stay</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
