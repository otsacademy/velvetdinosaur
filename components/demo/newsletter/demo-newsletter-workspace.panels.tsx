import {
  DemoNewsletterDeliveryPanel,
  DemoNewsletterSubscriberPanel
} from '@/components/demo/newsletter/demo-newsletter-management-panels';
import type { DemoNewsletterDelivery, DemoNewsletterSubscriber } from '@/lib/demo-newsletter-seed';

type DemoNewsletterManagementPanelsProps = {
  subscriberQuery: string;
  onSubscriberQueryChange: (value: string) => void;
  subscriberStatus: 'all' | DemoNewsletterSubscriber['status'];
  onSubscriberStatusChange: (value: 'all' | DemoNewsletterSubscriber['status']) => void;
  subscribers: DemoNewsletterSubscriber[];
  onToggleSubscriber: (item: DemoNewsletterSubscriber, subscribed: boolean) => void;
  deliveryQuery: string;
  onDeliveryQueryChange: (value: string) => void;
  deliveryStatus: 'all' | DemoNewsletterDelivery['status'];
  onDeliveryStatusChange: (value: 'all' | DemoNewsletterDelivery['status']) => void;
  deliveries: DemoNewsletterDelivery[];
};

export function DemoNewsletterManagementPanels({
  subscriberQuery,
  onSubscriberQueryChange,
  subscriberStatus,
  onSubscriberStatusChange,
  subscribers,
  onToggleSubscriber,
  deliveryQuery,
  onDeliveryQueryChange,
  deliveryStatus,
  onDeliveryStatusChange,
  deliveries
}: DemoNewsletterManagementPanelsProps) {
  return (
    <>
      <DemoNewsletterSubscriberPanel
        subscriberQuery={subscriberQuery}
        onSubscriberQueryChange={onSubscriberQueryChange}
        subscriberStatus={subscriberStatus}
        onSubscriberStatusChange={onSubscriberStatusChange}
        subscribers={subscribers}
        onToggleSubscriber={onToggleSubscriber}
      />
      <DemoNewsletterDeliveryPanel
        deliveryQuery={deliveryQuery}
        onDeliveryQueryChange={onDeliveryQueryChange}
        deliveryStatus={deliveryStatus}
        onDeliveryStatusChange={onDeliveryStatusChange}
        deliveries={deliveries}
      />
    </>
  );
}
