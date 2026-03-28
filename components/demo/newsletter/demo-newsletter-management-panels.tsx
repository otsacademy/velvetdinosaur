import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DeliveryStatusBadge, SubscriberStatusBadge } from '@/components/demo/newsletter/demo-newsletter-ui';
import { formatNewsletterDate, type DemoNewsletterDelivery, type DemoNewsletterSubscriber } from '@/lib/demo-newsletter-seed';

type DemoNewsletterSubscriberPanelProps = {
  subscriberQuery: string;
  onSubscriberQueryChange: (value: string) => void;
  subscriberStatus: 'all' | DemoNewsletterSubscriber['status'];
  onSubscriberStatusChange: (value: 'all' | DemoNewsletterSubscriber['status']) => void;
  subscribers: DemoNewsletterSubscriber[];
  onToggleSubscriber: (item: DemoNewsletterSubscriber, subscribed: boolean) => void;
};

type DemoNewsletterDeliveryPanelProps = {
  deliveryQuery: string;
  onDeliveryQueryChange: (value: string) => void;
  deliveryStatus: 'all' | DemoNewsletterDelivery['status'];
  onDeliveryStatusChange: (value: 'all' | DemoNewsletterDelivery['status']) => void;
  deliveries: DemoNewsletterDelivery[];
};

export function DemoNewsletterSubscriberPanel({
  subscriberQuery,
  onSubscriberQueryChange,
  subscriberStatus,
  onSubscriberStatusChange,
  subscribers,
  onToggleSubscriber
}: DemoNewsletterSubscriberPanelProps) {
  return (
    <Card className="border-[var(--vd-border)] shadow-none">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Subscriber consent</CardTitle>
          <CardDescription>Toggle subscribed status locally to demonstrate list hygiene and opt-in handling.</CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            value={subscriberQuery}
            onChange={(event) => onSubscriberQueryChange(event.target.value)}
            placeholder="Search email or name"
            className="md:w-[220px]"
          />
          <Select value={subscriberStatus} onValueChange={(value) => onSubscriberStatusChange(value as 'all' | DemoNewsletterSubscriber['status'])}>
            <SelectTrigger className="md:w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="subscribed">Subscribed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="not_consented">No consent</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">
              <tr>
                <th className="pb-3 pr-4 font-medium">Subscriber</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Updated</th>
                <th className="pb-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => {
                const subscribed = subscriber.status === 'subscribed';
                return (
                  <tr key={subscriber.id} className="border-t border-[var(--vd-border)]">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[var(--vd-fg)]">{subscriber.firstName}</p>
                      <p className="text-[var(--vd-muted-fg)]">{subscriber.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <SubscriberStatusBadge status={subscriber.status} />
                    </td>
                    <td className="py-3 pr-4 text-[var(--vd-muted-fg)]">{formatNewsletterDate(subscriber.updatedAt)}</td>
                    <td className="py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => onToggleSubscriber(subscriber, !subscribed)}>
                        {subscribed ? 'Unsubscribe' : 'Mark subscribed'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function DemoNewsletterDeliveryPanel({
  deliveryQuery,
  onDeliveryQueryChange,
  deliveryStatus,
  onDeliveryStatusChange,
  deliveries
}: DemoNewsletterDeliveryPanelProps) {
  return (
    <Card className="border-[var(--vd-border)] shadow-none">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Delivery log</CardTitle>
          <CardDescription>Recent sends and skips for the selected campaign in this fake session.</CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            value={deliveryQuery}
            onChange={(event) => onDeliveryQueryChange(event.target.value)}
            placeholder="Search recipient or message id"
            className="md:w-[220px]"
          />
          <Select value={deliveryStatus} onValueChange={(value) => onDeliveryStatusChange(value as 'all' | DemoNewsletterDelivery['status'])}>
            <SelectTrigger className="md:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped_no_consent">Skipped: no consent</SelectItem>
              <SelectItem value="skipped_unsubscribed">Skipped: unsubscribed</SelectItem>
              <SelectItem value="skipped_suppressed">Skipped: suppressed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">
              <tr>
                <th className="pb-3 pr-4 font-medium">Recipient</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Message</th>
                <th className="pb-3 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-t border-[var(--vd-border)]">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-[var(--vd-fg)]">{delivery.firstName}</p>
                    <p className="text-[var(--vd-muted-fg)]">{delivery.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <DeliveryStatusBadge status={delivery.status} />
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-mono text-xs text-[var(--vd-fg)]">{delivery.postmarkMessageId}</p>
                    <p className="text-[var(--vd-muted-fg)]">{delivery.error || `Attempts: ${delivery.attempts}`}</p>
                  </td>
                  <td className="py-3 text-[var(--vd-muted-fg)]">{formatNewsletterDate(delivery.sentAt || delivery.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
