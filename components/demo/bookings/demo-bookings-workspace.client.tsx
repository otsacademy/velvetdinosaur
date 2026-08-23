'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingApiOverviewCards } from '@/components/edit/booking-api-overview-cards';
import {
  formatBookingWhen,
  formatPrice,
  STATUS_LABELS,
  WEEKDAY_NAMES,
  type BookingsOverviewPayload
} from '@/components/edit/booking-api-shared';
import {
  createDemoBookingsSeed,
  type DemoBooking,
  type DemoBookingStatus
} from '@/lib/demo-bookings-seed';

const STATUS_VARIANTS: Record<DemoBookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  requested: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'outline',
  no_show: 'outline'
};

const NEXT_ACTIONS: Record<DemoBookingStatus, { label: string; status: DemoBookingStatus }[]> = {
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

export function DemoBookingsWorkspace() {
  const seed = useMemo(() => createDemoBookingsSeed(), []);
  const [bookings, setBookings] = useState<DemoBooking[]>(seed.bookings);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'catalog' | 'availability'>('pipeline');

  const overview = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const isActive = (booking: DemoBooking) =>
      booking.status === 'requested' || booking.status === 'confirmed';
    const startMs = (booking: DemoBooking) => new Date(booking.startAt).getTime();
    return {
      todayCount: bookings.filter(
        (booking) => isActive(booking) && startMs(booking) >= dayStart && startMs(booking) < dayStart + 86_400_000
      ).length,
      pendingCount: bookings.filter((booking) => booking.status === 'requested').length,
      weekCount: bookings.filter(
        (booking) =>
          isActive(booking) && startMs(booking) >= dayStart && startMs(booking) < dayStart + 7 * 86_400_000
      ).length,
      upcoming: bookings
        .filter((booking) => isActive(booking) && startMs(booking) >= now.getTime())
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
        .slice(0, 5),
      services: seed.services,
      resources: seed.resources
    } as unknown as BookingsOverviewPayload;
  }, [bookings, seed]);

  function changeStatus(booking: DemoBooking, status: DemoBookingStatus) {
    setBookings((current) =>
      current.map((entry) => (entry.id === booking.id ? { ...entry, status } : entry))
    );
    toast.success(`Demo: booking marked ${STATUS_LABELS[status].toLowerCase()}.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          This is the bookings admin your customers see — services, staff availability, and the
          bookings coming in from the website. Everything here is fictional demo data.
        </p>
      </div>

      <BookingApiOverviewCards overview={overview} />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bookings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {bookings.map((booking) => (
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
                      <Badge variant={STATUS_VARIANTS[booking.status]}>
                        {STATUS_LABELS[booking.status]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatBookingWhen(booking.startAt)} — {booking.customer.name} ·{' '}
                      {booking.customer.email}
                    </div>
                    {booking.notes ? (
                      <div className="mt-1 text-xs text-muted-foreground">{booking.notes}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {NEXT_ACTIONS[booking.status].map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.status === 'cancelled' ? 'destructive' : 'outline'}
                        onClick={() => changeStatus(booking, action.status)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="pt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Services</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {seed.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{service.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {service.durationMinutes} min
                        {service.bufferMinutes ? ` + ${service.bufferMinutes} buffer` : ''}
                        {service.pricePence !== null ? ` · ${formatPrice(service.pricePence)}` : ''}
                      </span>
                    </span>
                    <Badge variant="default">Active</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Staff &amp; resources</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {seed.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{resource.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {resource.serviceIds.length === 0
                          ? 'Offers all services'
                          : `Offers ${resource.serviceIds.length} services`}
                      </span>
                    </span>
                    <Badge variant="default">Active</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="pt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Venue opening hours</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const hours = seed.venueHours.find((entry) => entry.day === day);
                  return (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{WEEKDAY_NAMES[day]}</span>
                      <span className="text-muted-foreground">
                        {hours?.open ? `${hours.start} – ${hours.end}` : 'Closed'}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exceptions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {seed.exceptions.map((exception) => (
                  <div
                    key={exception.date}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-sm font-medium">{exception.date}</span>
                    <Badge variant="secondary">{exception.note}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
