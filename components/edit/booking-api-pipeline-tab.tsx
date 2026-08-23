'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  apiSend,
  formatBookingWhen,
  STATUS_LABELS,
  type BookingItem,
  type BookingResourceItem,
  type BookingServiceItem,
  type BookingStatus
} from '@/components/edit/booking-api-shared';

const STATUS_VARIANTS: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  requested: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'outline',
  no_show: 'outline'
};

const NEXT_ACTIONS: Record<BookingStatus, { label: string; status: BookingStatus }[]> = {
  requested: [
    { label: 'Confirm', status: 'confirmed' },
    { label: 'Cancel', status: 'cancelled' }
  ],
  confirmed: [
    { label: 'Complete', status: 'completed' },
    { label: 'No-show', status: 'no_show' },
    { label: 'Cancel', status: 'cancelled' }
  ],
  cancelled: [],
  completed: [],
  no_show: []
};

type ManualForm = {
  serviceId: string;
  resourceId: string;
  startAt: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const EMPTY_MANUAL_FORM: ManualForm = {
  serviceId: '',
  resourceId: '',
  startAt: '',
  name: '',
  email: '',
  phone: '',
  notes: ''
};

export function BookingApiPipelineTab({
  bookings,
  services,
  resources,
  onChanged
}: {
  bookings: BookingItem[];
  services: BookingServiceItem[];
  resources: BookingResourceItem[];
  onChanged: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState<ManualForm>(EMPTY_MANUAL_FORM);
  const [saving, setSaving] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);

  const visible = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  async function changeStatus(booking: BookingItem, status: BookingStatus) {
    setBusyBookingId(booking.id);
    try {
      await apiSend(`/api/admin/bookings/bookings/${booking.id}`, 'PATCH', { status });
      toast.success(`Booking marked ${STATUS_LABELS[status].toLowerCase()}.`);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the booking.');
    } finally {
      setBusyBookingId(null);
    }
  }

  async function saveManualBooking() {
    setSaving(true);
    try {
      await apiSend('/api/admin/bookings/bookings', 'POST', {
        serviceId: manualForm.serviceId,
        resourceId: manualForm.resourceId || undefined,
        startAt: new Date(manualForm.startAt).toISOString(),
        name: manualForm.name,
        email: manualForm.email,
        phone: manualForm.phone || undefined,
        notes: manualForm.notes || undefined
      });
      toast.success('Booking created and confirmation email sent.');
      setManualOpen(false);
      setManualForm(EMPTY_MANUAL_FORM);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create the booking.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Bookings</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | BookingStatus)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setManualOpen(true)} disabled={services.length === 0}>
            New booking
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookings yet. They appear here when customers book through the website, or when you add one manually.
          </p>
        ) : (
          visible.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {booking.serviceName}
                    {booking.resourceName ? ` · ${booking.resourceName}` : ''}
                  </span>
                  <Badge variant={STATUS_VARIANTS[booking.status]}>{STATUS_LABELS[booking.status]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatBookingWhen(booking.startAt)} — {booking.customer.name} · {booking.customer.email}
                  {booking.customer.phone ? ` · ${booking.customer.phone}` : ''}
                </div>
                {booking.notes ? <div className="mt-1 text-xs text-muted-foreground">{booking.notes}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                {NEXT_ACTIONS[booking.status].map((action) => (
                  <Button
                    key={action.status}
                    size="sm"
                    variant={action.status === 'cancelled' ? 'destructive' : 'outline'}
                    disabled={busyBookingId === booking.id}
                    onClick={() => changeStatus(booking, action.status)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New booking</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Service</Label>
                <Select
                  value={manualForm.serviceId}
                  onValueChange={(value) => setManualForm({ ...manualForm, serviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter((service) => service.active)
                      .map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>With (optional)</Label>
                <Select
                  value={manualForm.resourceId}
                  onValueChange={(value) => setManualForm({ ...manualForm, resourceId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any / venue</SelectItem>
                    {resources
                      .filter((resource) => resource.active)
                      .map((resource) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="manual-start">Date &amp; time</Label>
              <Input
                id="manual-start"
                type="datetime-local"
                value={manualForm.startAt}
                onChange={(event) => setManualForm({ ...manualForm, startAt: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="manual-name">Customer name</Label>
                <Input
                  id="manual-name"
                  value={manualForm.name}
                  onChange={(event) => setManualForm({ ...manualForm, name: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="manual-email">Customer email</Label>
                <Input
                  id="manual-email"
                  type="email"
                  value={manualForm.email}
                  onChange={(event) => setManualForm({ ...manualForm, email: event.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="manual-phone">Phone (optional)</Label>
              <Input
                id="manual-phone"
                value={manualForm.phone}
                onChange={(event) => setManualForm({ ...manualForm, phone: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="manual-notes">Notes (optional)</Label>
              <Input
                id="manual-notes"
                value={manualForm.notes}
                onChange={(event) => setManualForm({ ...manualForm, notes: event.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={saveManualBooking}
              disabled={saving || !manualForm.serviceId || !manualForm.startAt || !manualForm.name || !manualForm.email}
            >
              {saving ? 'Creating…' : 'Create booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
