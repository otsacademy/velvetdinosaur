'use client';

import { useMemo } from 'react';
import { CalendarClock, CalendarDays, CalendarPlus2, CheckCircle2 } from 'lucide-react';
import { addDays, formatRelativeTime, parseDateLines, toIsoDate } from '@/components/demo/travel/demo-bookings-utils';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import type { DemoTravelAvailabilitySlot, DemoTravelInventoryItem } from '@/lib/demo-travel-seed';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

type DemoBookingsAvailabilityTabProps = {
  inventory: DemoTravelInventoryItem[];
  availabilityInventorySlug: string;
  availabilityFrom: string;
  availabilityTo: string;
  availabilityRows: DemoTravelAvailabilitySlot[];
  availabilitySavedAt: string | null;
  upsertStatus: DemoTravelAvailabilitySlot['status'];
  upsertRemaining: string;
  upsertPrice: string;
  upsertDates: string;
  onInventorySlugChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onLoadAvailability: () => void;
  onUpsertStatusChange: (value: DemoTravelAvailabilitySlot['status']) => void;
  onUpsertRemainingChange: (value: string) => void;
  onUpsertPriceChange: (value: string) => void;
  onUpsertDatesChange: (value: string) => void;
  onSaveAvailability: () => void;
};

function enumerateDatesInRange(from: string, to: string) {
  if (!from || !to) return [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const cursor = new Date(start);
  const values: string[] = [];
  while (cursor <= end) {
    values.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return values;
}

export function DemoBookingsAvailabilityTab(props: DemoBookingsAvailabilityTabProps) {
  const selectedDates = useMemo(() => parseDateLines(props.upsertDates), [props.upsertDates]);
  const selectedDateObjects = useMemo(() => selectedDates.map((date) => new Date(`${date}T00:00:00`)), [selectedDates]);
  const selectableRangeDates = useMemo(() => enumerateDatesInRange(props.availabilityFrom, props.availabilityTo), [props.availabilityFrom, props.availabilityTo]);

  return (
    <TabsContent value="availability" className="space-y-4">
      <section className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
        <div>
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--vd-fg)]">
            <CalendarDays className="h-4 w-4 text-[var(--vd-primary)]" />
            View availability
          </h3>
          <p className="text-xs text-[var(--vd-muted-fg)]">Load fictional capacity data for a stay or route product.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Inventory item</Label>
            <Select value={props.availabilityInventorySlug} onValueChange={props.onInventorySlugChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {props.inventory.map((item) => (
                  <SelectItem key={item.slug} value={item.slug}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={props.availabilityFrom} onChange={(event) => props.onFromChange(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={props.availabilityTo} onChange={(event) => props.onToChange(event.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <DemoHelpTooltip content="Pull the seeded capacity and price rows for the selected item and date range into the table below.">
            <Button type="button" onClick={props.onLoadAvailability}>
              <CalendarClock className="h-4 w-4" />
              Load availability
            </Button>
          </DemoHelpTooltip>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.availabilityRows.map((slot) => (
              <TableRow key={`${slot.date}-${slot.status}`}>
                <TableCell>{slot.date}</TableCell>
                <TableCell>
                  <Badge className="border-transparent bg-[color-mix(in_oklch,var(--vd-secondary)_32%,var(--vd-card))] text-[var(--vd-secondary-fg)]">
                    {slot.status}
                  </Badge>
                </TableCell>
                <TableCell>{typeof slot.remaining === 'number' ? slot.remaining : '—'}</TableCell>
                <TableCell>{typeof slot.price === 'number' ? slot.price : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--vd-fg)]">
              <CalendarPlus2 className="h-4 w-4 text-[var(--vd-primary)]" />
              Update availability
            </h3>
            <p className="text-xs text-[var(--vd-muted-fg)]">Set capacity and pricing for one or more fictional dates.</p>
          </div>
          {props.availabilitySavedAt ? (
            <Badge className="border-transparent bg-[color-mix(in_oklch,var(--vd-accent)_30%,var(--vd-card))] text-[var(--vd-accent-fg)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved {formatRelativeTime(props.availabilitySavedAt)}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={props.upsertStatus} onValueChange={(value) => props.onUpsertStatusChange(value as DemoTravelAvailabilitySlot['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Remaining</Label>
            <Input value={props.upsertRemaining} onChange={(event) => props.onUpsertRemainingChange(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Price</Label>
            <Input value={props.upsertPrice} onChange={(event) => props.onUpsertPriceChange(event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dates</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <DemoHelpTooltip content="Pick one or more dates from the visible range and drop them into the update form.">
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline">
                    <CalendarDays className="h-4 w-4" />
                    Select dates
                  </Button>
                </PopoverTrigger>
              </DemoHelpTooltip>
              <PopoverContent align="start" className="w-auto p-2">
                <Calendar
                  mode="multiple"
                  selected={selectedDateObjects}
                  onSelect={(value) =>
                    props.onUpsertDatesChange((value || []).map((date) => toIsoDate(date)).sort().join('\n'))
                  }
                  disabled={(date) => !selectableRangeDates.includes(toIsoDate(date))}
                  defaultMonth={new Date(`${props.availabilityFrom || toIsoDate(addDays(new Date(), 1))}T00:00:00`)}
                />
              </PopoverContent>
            </Popover>
            <DemoHelpTooltip content="Fill the date list with the first three available days so you can demonstrate a quick batch update.">
              <Button type="button" variant="outline" onClick={() => props.onUpsertDatesChange(selectableRangeDates.slice(0, 3).join('\n'))}>
                First 3 dates
              </Button>
            </DemoHelpTooltip>
            <span className="text-sm text-[var(--vd-muted-fg)]">
              {selectedDates.length} date{selectedDates.length === 1 ? '' : 's'} selected
            </span>
          </div>
          <Input value={props.upsertDates} onChange={(event) => props.onUpsertDatesChange(event.target.value)} placeholder="2026-05-14" />
        </div>

        <div className="flex justify-end">
          <DemoHelpTooltip content="Write the updated capacity or price rows into this sandbox so the availability table refreshes immediately.">
            <Button type="button" onClick={props.onSaveAvailability}>
              Save demo availability
            </Button>
          </DemoHelpTooltip>
        </div>
      </section>
    </TabsContent>
  );
}
