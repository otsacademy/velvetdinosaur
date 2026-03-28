'use client';

import { Fragment, useMemo, useState } from 'react';
import { Archive, CheckCircle2, Eye, EyeOff, Filter, MoreHorizontal, Search } from 'lucide-react';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_OPTIONS, BOOKING_TYPE_LABELS, BOOKING_TYPE_OPTIONS, formatDateLabel, formatRelativeTime } from '@/components/demo/travel/demo-bookings-utils';
import { InventoryKindBadge } from '@/components/demo/travel/demo-travel-ui';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import type { DemoTravelBooking, DemoTravelInventoryItem } from '@/lib/demo-travel-seed';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

type DemoBookingsPipelineTabProps = {
  bookings: DemoTravelBooking[];
  inventoryBySlug: Map<string, DemoTravelInventoryItem>;
  onSaveBooking: (bookingId: string, input: { status: DemoTravelBooking['status']; providerRef?: string }) => void;
};

export function DemoBookingsPipelineTab({
  bookings,
  inventoryBySlug,
  onSaveBooking,
}: DemoBookingsPipelineTabProps) {
  const [bookingTypeFilter, setBookingTypeFilter] = useState<'all' | DemoTravelBooking['type']>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | DemoTravelBooking['status']>('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [bookingStatusDrafts, setBookingStatusDrafts] = useState<Record<string, DemoTravelBooking['status']>>({});
  const [bookingProviderRefDrafts, setBookingProviderRefDrafts] = useState<Record<string, string>>({});

  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (bookingTypeFilter !== 'all' && booking.type !== bookingTypeFilter) return false;
      if (bookingStatusFilter !== 'all' && booking.status !== bookingStatusFilter) return false;
      if (!query) return true;
      const inventory = inventoryBySlug.get(booking.productSlug || '');
      return [booking.guest.name, booking.guest.email, inventory?.name || '', booking.source || '']
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [bookingSearch, bookingStatusFilter, bookingTypeFilter, bookings, inventoryBySlug]);

  return (
    <TabsContent value="pipeline" className="space-y-4">
      <div className="grid gap-3 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-3 md:grid-cols-[minmax(260px,1fr)_200px_200px]">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--vd-muted-fg)]">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--vd-muted-fg)]" />
            <Input className="pl-8" placeholder="Guest or inventory item" value={bookingSearch} onChange={(event) => setBookingSearch(event.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="inline-flex items-center gap-1.5 text-xs text-[var(--vd-muted-fg)]">
            <Filter className="h-3.5 w-3.5" />
            Type
          </Label>
          <Select value={bookingTypeFilter} onValueChange={(value) => setBookingTypeFilter(value as typeof bookingTypeFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOKING_TYPE_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === 'all' ? 'All types' : BOOKING_TYPE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[var(--vd-muted-fg)]">Status</Label>
          <Select value={bookingStatusFilter} onValueChange={(value) => setBookingStatusFilter(value as typeof bookingStatusFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BOOKING_STATUS_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {BOOKING_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Inventory</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBookings.map((booking) => {
            const id = booking.id || '';
            const inventory = inventoryBySlug.get(booking.productSlug || '');
            const selectedStatus = bookingStatusDrafts[id] || booking.status;
            const selectedProviderRef = bookingProviderRefDrafts[id] ?? booking.providerRef ?? '';
            const isExpanded = expandedBookingId === id;

            return (
              <Fragment key={id}>
                <TableRow className="hover:bg-[color-mix(in_oklch,var(--vd-primary)_8%,transparent)]">
                  <TableCell>
                    <p className="font-medium text-[var(--vd-fg)]">{booking.guest.name}</p>
                    <p className="text-xs text-[var(--vd-muted-fg)]">{booking.guest.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className="border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-card))] text-[var(--vd-primary)]">
                      {BOOKING_TYPE_LABELS[booking.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--vd-fg)]">{inventory?.name || booking.productSlug || 'n/a'}</p>
                      {inventory ? <InventoryKindBadge kind={inventory.kind} /> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--vd-muted-fg)]">
                    <DemoHelpTooltip content={`Opened ${formatDateLabel(booking.createdAt)}.`}>
                      <button type="button" className="underline-offset-2 hover:underline" title={formatDateLabel(booking.createdAt)}>
                        {formatRelativeTime(booking.createdAt)}
                      </button>
                    </DemoHelpTooltip>
                  </TableCell>
                  <TableCell>
                    <Badge className="border-transparent bg-[color-mix(in_oklch,var(--vd-secondary)_32%,var(--vd-card))] text-[var(--vd-secondary-fg)]">
                      {BOOKING_STATUS_LABELS[selectedStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DemoHelpTooltip content="Open the booking shortcuts for viewing details, marking the request handled, or archiving it.">
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </DemoHelpTooltip>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setExpandedBookingId(isExpanded ? null : id)}>
                          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {isExpanded ? 'Hide details' : 'View details'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onSaveBooking(id, { status: 'completed', providerRef: selectedProviderRef })}>
                          <CheckCircle2 className="h-4 w-4" />
                          Mark handled
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onSaveBooking(id, { status: 'cancelled', providerRef: selectedProviderRef })}>
                          <Archive className="h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {isExpanded ? (
                  <TableRow className="bg-[color-mix(in_oklch,var(--vd-muted)_40%,transparent)]">
                    <TableCell colSpan={6}>
                      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                        <div className="space-y-2">
                          <Label className="text-xs text-[var(--vd-muted-fg)]">Provider reference</Label>
                          <Input value={selectedProviderRef} onChange={(event) => setBookingProviderRefDrafts((current) => ({ ...current, [id]: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-[var(--vd-muted-fg)]">Status</Label>
                          <Select value={selectedStatus} onValueChange={(value) => setBookingStatusDrafts((current) => ({ ...current, [id]: value as DemoTravelBooking['status'] }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BOOKING_STATUS_OPTIONS.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {BOOKING_STATUS_LABELS[value]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <DemoHelpTooltip content="Apply the updated provider reference or booking status to this demo record only.">
                            <Button type="button" onClick={() => onSaveBooking(id, { status: selectedStatus, providerRef: selectedProviderRef })}>
                              Save demo change
                            </Button>
                          </DemoHelpTooltip>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TabsContent>
  );
}
