'use client';

import { CalendarClock, CalendarDays, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBookingWhen, type BookingsOverviewPayload } from '@/components/edit/booking-api-shared';

export function BookingApiOverviewCards({ overview }: { overview: BookingsOverviewPayload | null }) {
  const stats = [
    { label: "Today's bookings", value: overview?.todayCount ?? 0, icon: CalendarClock },
    { label: 'Pending requests', value: overview?.pendingCount ?? 0, icon: Inbox },
    { label: 'Next 7 days', value: overview?.weekCount ?? 0, icon: CalendarDays }
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {overview && overview.upcoming.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Next up</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {overview.upcoming.map((booking) => (
              <div key={booking.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">
                  {booking.serviceName}
                  {booking.resourceName ? ` · ${booking.resourceName}` : ''}
                </span>
                <span className="text-muted-foreground">
                  {formatBookingWhen(booking.startAt)} — {booking.customer.name}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
