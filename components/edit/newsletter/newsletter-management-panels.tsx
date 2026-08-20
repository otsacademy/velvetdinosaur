import { NewsletterDeliveryLog } from '@/components/edit/newsletter/newsletter-delivery-log';
import { NewsletterSubscriberTable } from '@/components/edit/newsletter/newsletter-subscriber-table';
import {
  type CampaignItem,
  type DeliveryItem,
  type DeliveryStatus,
  type NewsletterStatus,
  type PreferenceItem
} from '@/components/edit/newsletter/newsletter-workspace.shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SubscriberPanelProps = {
  subscriberQuery: string;
  onSubscriberQueryChange: (value: string) => void;
  subscriberStatus: 'all' | NewsletterStatus;
  onSubscriberStatusChange: (value: 'all' | NewsletterStatus) => void;
  subscribers: PreferenceItem[];
  pendingSubscriberId: string;
  onToggleSubscriber: (item: PreferenceItem, subscribed: boolean) => void;
};

export function NewsletterSubscriberPanel({
  subscriberQuery,
  onSubscriberQueryChange,
  subscriberStatus,
  onSubscriberStatusChange,
  subscribers,
  pendingSubscriberId,
  onToggleSubscriber
}: SubscriberPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Subscriber Consent</CardTitle>
          <CardDescription>Newsletter campaigns are delivered only to confirmed subscribed recipients.</CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            value={subscriberQuery}
            onChange={(event) => onSubscriberQueryChange(event.target.value)}
            placeholder="Search email or name"
            className="md:w-[220px]"
          />
          <Select value={subscriberStatus} onValueChange={(value) => onSubscriberStatusChange(value as 'all' | NewsletterStatus)}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="subscribed">Subscribed</SelectItem>
              <SelectItem value="pending">Pending confirmation</SelectItem>
              <SelectItem value="not_consented">No consent</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <NewsletterSubscriberTable
          items={subscribers}
          pendingSubscriberId={pendingSubscriberId}
          onToggle={(item, checked) => onToggleSubscriber(item, checked)}
        />
      </CardContent>
    </Card>
  );
}

type DeliveryPanelProps = {
  deliveryQuery: string;
  onDeliveryQueryChange: (value: string) => void;
  deliveryStatus: 'all' | DeliveryStatus;
  onDeliveryStatusChange: (value: 'all' | DeliveryStatus) => void;
  deliveries: DeliveryItem[];
  campaigns: CampaignItem[];
  loading: boolean;
};

export function NewsletterDeliveryPanel({
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
          <CardDescription>Recent sends and skips for the selected campaign.</CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            value={deliveryQuery}
            onChange={(event) => onDeliveryQueryChange(event.target.value)}
            placeholder="Search delivery email"
            className="md:w-[220px]"
          />
          <Select value={deliveryStatus} onValueChange={(value) => onDeliveryStatusChange(value as 'all' | DeliveryStatus)}>
            <SelectTrigger className="md:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped_no_consent">Skipped: No consent</SelectItem>
              <SelectItem value="skipped_unsubscribed">Skipped: Unsubscribed</SelectItem>
              <SelectItem value="skipped_suppressed">Skipped: Suppressed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <NewsletterDeliveryLog items={deliveries} campaigns={campaigns} loading={loading} />
      </CardContent>
    </Card>
  );
}
