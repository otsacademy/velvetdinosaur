'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventRegistrationDeliveryPanel, EventRegistrationRegistrantPanel } from '@/components/edit/event-registration/event-registration-management-panels';
import {
  type CampaignItem,
  type DeliveryItem,
  type EventDeliveryStatus,
  type EventRegistrationStatus,
  type EventWorkspaceItem,
  type RegistrationItem
} from '@/components/edit/event-registration/event-registration-workspace.shared';

type EventRegistrationManagementTabsProps = {
  activeTab: 'registrants' | 'deliveries';
  onActiveTabChange: (value: 'registrants' | 'deliveries') => void;
  selectedEvent: EventWorkspaceItem | null;
  registrantQuery: string;
  onRegistrantQueryChange: (value: string) => void;
  registrantStatus: 'all' | EventRegistrationStatus;
  onRegistrantStatusChange: (value: 'all' | EventRegistrationStatus) => void;
  registrations: RegistrationItem[];
  deliveryQuery: string;
  onDeliveryQueryChange: (value: string) => void;
  deliveryStatus: 'all' | EventDeliveryStatus;
  onDeliveryStatusChange: (value: 'all' | EventDeliveryStatus) => void;
  deliveries: DeliveryItem[];
  campaigns: CampaignItem[];
  isLoadingDeliveries: boolean;
};

export function EventRegistrationManagementTabs({
  activeTab,
  onActiveTabChange,
  selectedEvent,
  registrantQuery,
  onRegistrantQueryChange,
  registrantStatus,
  onRegistrantStatusChange,
  registrations,
  deliveryQuery,
  onDeliveryQueryChange,
  deliveryStatus,
  onDeliveryStatusChange,
  deliveries,
  campaigns,
  isLoadingDeliveries
}: EventRegistrationManagementTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as 'registrants' | 'deliveries')} className="space-y-4">
      <TabsList className="inline-flex h-auto flex-wrap gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/35 p-1">
        <TabsTrigger value="registrants">Registrants ({registrations.length})</TabsTrigger>
        <TabsTrigger value="deliveries">Delivery Log ({deliveries.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="registrants">
        <EventRegistrationRegistrantPanel
          selectedEvent={selectedEvent}
          registrantQuery={registrantQuery}
          onRegistrantQueryChange={onRegistrantQueryChange}
          registrantStatus={registrantStatus}
          onRegistrantStatusChange={onRegistrantStatusChange}
          registrations={registrations}
        />
      </TabsContent>

      <TabsContent value="deliveries">
        <EventRegistrationDeliveryPanel
          selectedEvent={selectedEvent}
          deliveryQuery={deliveryQuery}
          onDeliveryQueryChange={onDeliveryQueryChange}
          deliveryStatus={deliveryStatus}
          onDeliveryStatusChange={onDeliveryStatusChange}
          deliveries={deliveries}
          campaigns={campaigns}
          loading={isLoadingDeliveries}
        />
      </TabsContent>
    </Tabs>
  );
}
