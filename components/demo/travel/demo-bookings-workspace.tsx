'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DemoBookingsAvailabilityTab } from '@/components/demo/travel/demo-bookings-availability-tab';
import { DemoBookingsCatalogTab } from '@/components/demo/travel/demo-bookings-catalog-tab';
import { DemoBookingsPipelineTab } from '@/components/demo/travel/demo-bookings-pipeline-tab';
import { addDays, toIsoDate } from '@/components/demo/travel/demo-bookings-utils';
import { DemoTravelWorkspaceIntro } from '@/components/demo/travel/demo-travel-ui';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createDemoTravelSeed, type DemoTravelAvailabilitySlot, type DemoTravelProduct } from '@/lib/demo-travel-seed';

export function DemoBookingsWorkspace() {
  const seed = useMemo(() => createDemoTravelSeed(), []);
  const [inventory] = useState(seed.inventory);
  const [products, setProducts] = useState(seed.products);
  const [bookings, setBookings] = useState(seed.bookings);
  const [availabilityMap, setAvailabilityMap] = useState(seed.availability);
  const [activeTab, setActiveTab] = useState<'catalog' | 'pipeline' | 'availability'>('catalog');
  const [syncingSlug, setSyncingSlug] = useState<string | null>(null);
  const [availabilityInventorySlug, setAvailabilityInventorySlug] = useState(seed.inventory[0]?.slug || '');
  const [availabilityFrom, setAvailabilityFrom] = useState(toIsoDate(new Date('2026-04-01T00:00:00.000Z')));
  const [availabilityTo, setAvailabilityTo] = useState(toIsoDate(addDays(new Date('2026-04-01T00:00:00.000Z'), 21)));
  const [availabilityRows, setAvailabilityRows] = useState<DemoTravelAvailabilitySlot[]>([]);
  const [availabilitySavedAt, setAvailabilitySavedAt] = useState<string | null>(null);
  const [upsertStatus, setUpsertStatus] = useState<DemoTravelAvailabilitySlot['status']>('available');
  const [upsertRemaining, setUpsertRemaining] = useState('');
  const [upsertPrice, setUpsertPrice] = useState('');
  const [upsertDates, setUpsertDates] = useState('');

  const inventoryBySlug = useMemo(() => new Map(inventory.map((item) => [item.slug, item])), [inventory]);
  const productsBySlug = useMemo(() => new Map(products.map((item) => [item.slug, item])), [products]);

  function syncInventory(slug: string) {
    const item = inventoryBySlug.get(slug);
    if (!item) return;
    setSyncingSlug(slug);
    window.setTimeout(() => {
      const nextProduct: DemoTravelProduct = {
        id: productsBySlug.get(slug)?.id || `demo_${slug}`,
        slug: item.slug,
        kind: item.kind,
        name: item.name,
        status: 'active',
        currency: item.currency || 'GBP',
        priceAmount: item.price || 0,
        capacity: item.capacity || undefined,
        updatedAt: new Date().toISOString(),
      };
      setProducts((current) => {
        const exists = current.some((product) => product.slug === slug);
        return exists
          ? current.map((product) => (product.slug === slug ? nextProduct : product))
          : [nextProduct, ...current];
      });
      setSyncingSlug(null);
      toast.success(`${item.name} synced into the demo booking catalog.`);
    }, 350);
  }

  function syncAllInventory() {
    inventory.forEach((item, index) => {
      window.setTimeout(() => syncInventory(item.slug), index * 60);
    });
  }

  function saveBooking(bookingId: string, input: { status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; providerRef?: string }) {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId ? { ...booking, status: input.status, providerRef: input.providerRef } : booking
      )
    );
    const booking = bookings.find((entry) => entry.id === bookingId);
    if (booking?.productSlug && booking.requestedDates?.length && (input.status === 'confirmed' || input.status === 'completed')) {
      setAvailabilityMap((current) => {
        const existing = current[booking.productSlug || ''] || [];
        const next = booking.requestedDates!.map((date) => ({
          date,
          status: 'unavailable' as const,
          remaining: 0,
          price: existing.find((slot) => slot.date === date)?.price,
        }));
        return {
          ...current,
          [booking.productSlug!]: [...existing.filter((slot) => !booking.requestedDates!.includes(slot.date)), ...next].sort((a, b) => a.date.localeCompare(b.date)),
        };
      });
    }
    toast.success('Booking updated inside the demo only.');
  }

  function loadAvailability() {
    const rows = availabilityMap[availabilityInventorySlug] || [];
    setAvailabilityRows(
      rows.filter((row) => row.date >= availabilityFrom && row.date <= availabilityTo).sort((a, b) => a.date.localeCompare(b.date))
    );
  }

  function saveAvailability() {
    const dates = upsertDates
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!availabilityInventorySlug || !dates.length) {
      return toast.error('Choose an item and add at least one date.');
    }
    const nextSlots = dates.map((date) => ({
      date,
      status: upsertStatus,
      remaining: upsertRemaining ? Number(upsertRemaining) : undefined,
      price: upsertPrice ? Number(upsertPrice) : undefined,
    }));
    setAvailabilityMap((current) => {
      const existing = current[availabilityInventorySlug] || [];
      return {
        ...current,
        [availabilityInventorySlug]: [...existing.filter((slot) => !dates.includes(slot.date)), ...nextSlots].sort((a, b) => a.date.localeCompare(b.date)),
      };
    });
    setAvailabilitySavedAt(new Date().toISOString());
    setAvailabilityRows((current) =>
      [...current.filter((slot) => !dates.includes(slot.date)), ...nextSlots].sort((a, b) => a.date.localeCompare(b.date))
    );
    toast.success('Availability updated inside the demo only.');
  }

  return (
    <div className="space-y-6 py-2">
      <DemoTravelWorkspaceIntro
        eyebrow="Booking operations"
        title="Sandboxed Booking API board"
        description="Review fictional stay and route products, move enquiries through the pipeline, and change availability without touching a real booking backend. The inventory here is seeded from the same stay and route demo records."
        imageSrc="/assets/demo-media/travel/booking-api/pipeline-overview.svg"
        imageAlt="Fictional Booking API overview"
      />

      <section className="rounded-[1.75rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-5">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-2 bg-[var(--vd-muted)]/30 p-1 md:w-[420px]">
            <DemoHelpTooltip content="Review how stay and route inventory maps into the fictional booking catalog." triggerClassName="flex-1">
              <TabsTrigger value="catalog">Catalog</TabsTrigger>
            </DemoHelpTooltip>
            <DemoHelpTooltip content="Inspect enquiries, update statuses, and move bookings through the demo operations board." triggerClassName="flex-1">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            </DemoHelpTooltip>
            <DemoHelpTooltip content="Load and edit date-based capacity and pricing for the selected inventory item." triggerClassName="flex-1">
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </DemoHelpTooltip>
          </TabsList>

          <DemoBookingsCatalogTab inventory={inventory} productsBySlug={productsBySlug} syncingSlug={syncingSlug} onSyncInventory={syncInventory} onSyncAll={syncAllInventory} />
          <DemoBookingsPipelineTab bookings={bookings} inventoryBySlug={inventoryBySlug} onSaveBooking={saveBooking} />
          <DemoBookingsAvailabilityTab
            inventory={inventory}
            availabilityInventorySlug={availabilityInventorySlug}
            availabilityFrom={availabilityFrom}
            availabilityTo={availabilityTo}
            availabilityRows={availabilityRows}
            availabilitySavedAt={availabilitySavedAt}
            upsertStatus={upsertStatus}
            upsertRemaining={upsertRemaining}
            upsertPrice={upsertPrice}
            upsertDates={upsertDates}
            onInventorySlugChange={setAvailabilityInventorySlug}
            onFromChange={setAvailabilityFrom}
            onToChange={setAvailabilityTo}
            onLoadAvailability={loadAvailability}
            onUpsertStatusChange={setUpsertStatus}
            onUpsertRemainingChange={setUpsertRemaining}
            onUpsertPriceChange={setUpsertPrice}
            onUpsertDatesChange={setUpsertDates}
            onSaveAvailability={saveAvailability}
          />
        </Tabs>
      </section>
    </div>
  );
}
