import Link from 'next/link';
import { Inbox, Send } from 'lucide-react';
import { EventRegistrationEmptyState } from '@/components/edit/event-registration/event-registration-empty-state';
import { EventRegistrationDeliveryLog } from '@/components/edit/event-registration/event-registration-delivery-log';
import { EventRegistrationRegistrantTable } from '@/components/edit/event-registration/event-registration-registrant-table';
import {
  type CampaignItem,
  type DeliveryItem,
  type EventDeliveryStatus,
  type EventRegistrationStatus,
  type EventWorkspaceItem,
  type RegistrationItem
} from '@/components/edit/event-registration/event-registration-workspace.shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type RegistrantPanelProps = {
  selectedEvent: EventWorkspaceItem | null;
  registrantQuery: string;
  onRegistrantQueryChange: (value: string) => void;
  registrantStatus: 'all' | EventRegistrationStatus;
  onRegistrantStatusChange: (value: 'all' | EventRegistrationStatus) => void;
  registrations: RegistrationItem[];
};

export function EventRegistrationRegistrantPanel({
  selectedEvent,
  registrantQuery,
  onRegistrantQueryChange,
  registrantStatus,
  onRegistrantStatusChange,
  registrations
}: RegistrantPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Registrants</CardTitle>
          <CardDescription>Confirmed participants are the only recipients for event updates and joining details.</CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            value={registrantQuery}
            onChange={(event) => onRegistrantQueryChange(event.target.value)}
            placeholder="Search registrants"
            className="md:w-[220px]"
          />
          <Select value={registrantStatus} onValueChange={(value) => onRegistrantStatusChange(value as 'all' | EventRegistrationStatus)}>
            <SelectTrigger className="md:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending confirmation</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedEvent ? (
          <EventRegistrationEmptyState
            icon={Inbox}
            title="Choose an event first"
            description="Pick a local-registration event above to see who has requested or confirmed attendance."
            className="min-h-[180px]"
          />
        ) : registrations.length === 0 ? (
          <EventRegistrationEmptyState
            icon={Inbox}
            title="No registrations yet"
            description="Share the public event page to start collecting RSVPs, then confirmed participants will appear here for outreach."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href={`/events/${selectedEvent.slug}`}>View public event</Link>
              </Button>
            }
            className="min-h-[180px]"
          />
        ) : (
          <EventRegistrationRegistrantTable items={registrations} />
        )}
      </CardContent>
    </Card>
  );
}

type DeliveryPanelProps = {
  selectedEvent: EventWorkspaceItem | null;
  deliveryQuery: string;
  onDeliveryQueryChange: (value: string) => void;
  deliveryStatus: 'all' | EventDeliveryStatus;
  onDeliveryStatusChange: (value: 'all' | EventDeliveryStatus) => void;
  deliveries: DeliveryItem[];
  campaigns: CampaignItem[];
  loading: boolean;
};

export function EventRegistrationDeliveryPanel({
  selectedEvent,
  deliveryQuery,
  onDeliveryQueryChange,
  deliveryStatus,
  onDeliveryStatusChange,
  deliveries,
  campaigns,
  loading
}: DeliveryPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Delivery Log</CardTitle>
          <CardDescription>Recent sends and skips for the selected event campaign.</CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            value={deliveryQuery}
            onChange={(event) => onDeliveryQueryChange(event.target.value)}
            placeholder="Search delivery email"
            className="md:w-[220px]"
          />
          <Select value={deliveryStatus} onValueChange={(value) => onDeliveryStatusChange(value as 'all' | EventDeliveryStatus)}>
            <SelectTrigger className="md:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped_unconfirmed">Skipped: Unconfirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedEvent ? (
          <EventRegistrationEmptyState
            icon={Send}
            title="Choose an event first"
            description="Pick a local-registration event above to inspect recent sends, skips, and delivery failures."
            className="min-h-[180px]"
          />
        ) : !loading && deliveries.length === 0 ? (
          <EventRegistrationEmptyState
            icon={Send}
            title="No delivery rows yet"
            description="Send a test email or queue a campaign above. Delivery events for the selected event will appear here."
            className="min-h-[180px]"
          />
        ) : (
          <EventRegistrationDeliveryLog items={deliveries} campaigns={campaigns} loading={loading} />
        )}
      </CardContent>
    </Card>
  );
}
