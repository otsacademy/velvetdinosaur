'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingApiAvailabilityTab } from '@/components/edit/booking-api-availability-tab';
import { BookingApiCatalogTab } from '@/components/edit/booking-api-catalog-tab';
import { BookingApiOverviewCards } from '@/components/edit/booking-api-overview-cards';
import { BookingApiPipelineTab } from '@/components/edit/booking-api-pipeline-tab';
import { BookingApiSettingsDialog } from '@/components/edit/booking-api-settings-dialog';
import {
  apiGet,
  apiSend,
  type BookingItem,
  type BookingResourceItem,
  type BookingServiceItem,
  type BookingSettingsItem,
  type BookingsOverviewPayload
} from '@/components/edit/booking-api-shared';

export function BookingsWorkspace() {
  const [overview, setOverview] = useState<BookingsOverviewPayload | null>(null);
  const [services, setServices] = useState<BookingServiceItem[]>([]);
  const [resources, setResources] = useState<BookingResourceItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [settings, setSettings] = useState<BookingSettingsItem | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'catalog' | 'availability'>('pipeline');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [overviewPayload, bookingsPayload, settingsPayload] = await Promise.all([
        apiGet<BookingsOverviewPayload>('/api/admin/bookings/overview'),
        apiGet<{ bookings: BookingItem[] }>('/api/admin/bookings/bookings'),
        apiGet<{ settings: BookingSettingsItem }>('/api/admin/bookings/settings')
      ]);
      setOverview(overviewPayload);
      setServices(overviewPayload.services);
      setResources(overviewPayload.resources);
      setBookings(bookingsPayload.bookings);
      setSettings(settingsPayload.settings);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSettings = useCallback(
    async (patch: Partial<BookingSettingsItem>) => {
      setSavingSettings(true);
      try {
        const payload = await apiSend<{ settings: BookingSettingsItem }>(
          '/api/admin/bookings/settings',
          'PUT',
          patch
        );
        setSettings(payload.settings);
        toast.success('Settings saved.');
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not save settings.');
        return false;
      } finally {
        setSavingSettings(false);
      }
    },
    []
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading bookings…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Services, staff availability, and the bookings coming in from your website.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      <BookingApiOverviewCards overview={overview} />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="pt-4">
          <BookingApiPipelineTab
            bookings={bookings}
            services={services}
            resources={resources}
            onChanged={refresh}
          />
        </TabsContent>
        <TabsContent value="catalog" className="pt-4">
          <BookingApiCatalogTab services={services} resources={resources} onChanged={refresh} />
        </TabsContent>
        <TabsContent value="availability" className="pt-4">
          <BookingApiAvailabilityTab settings={settings} saving={savingSettings} onSave={saveSettings} />
        </TabsContent>
      </Tabs>

      <BookingApiSettingsDialog
        open={settingsOpen}
        settings={settings}
        saving={savingSettings}
        onOpenChange={setSettingsOpen}
        onSave={saveSettings}
      />
    </div>
  );
}
