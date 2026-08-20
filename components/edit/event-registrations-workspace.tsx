'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EventRegistrationCampaignList } from '@/components/edit/event-registration/event-registration-campaign-list';
import { EventRegistrationComposerCard } from '@/components/edit/event-registration/event-registration-composer-card';
import { EventRegistrationEventFilterCard } from '@/components/edit/event-registration/event-registration-event-filter-card';
import { EventRegistrationManagementTabs } from '@/components/edit/event-registration/event-registration-management-tabs';
import { EventRegistrationOverviewCards } from '@/components/edit/event-registration/event-registration-overview-cards';
import {
  buildNewDraftForm,
  deriveCampaignBody,
  toCampaignFormState
} from '@/components/edit/event-registration/event-registration-workspace.helpers';
import {
  EMPTY_OVERVIEW,
  fromDateTimeLocalInput,
  type CampaignFormState,
  type CampaignItem,
  type DeliveryItem,
  type EventCampaignKind,
  type EventCampaignStatus,
  type EventDeliveryStatus,
  type EventRegistrationStatus,
  type EventWorkspaceItem,
  type OverviewPayload,
  type RegistrationItem
} from '@/components/edit/event-registration/event-registration-workspace.shared';
import { Button } from '@/components/ui/button';

export function EventRegistrationsWorkspace() {
  const [overview, setOverview] = useState<OverviewPayload>(EMPTY_OVERVIEW);
  const [events, setEvents] = useState<EventWorkspaceItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | EventCampaignStatus>('all');
  const [registrantStatus, setRegistrantStatus] = useState<'all' | EventRegistrationStatus>('all');
  const [registrantQuery, setRegistrantQuery] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'all' | EventDeliveryStatus>('all');
  const [deliveryQuery, setDeliveryQuery] = useState('');
  const [activeManagementTab, setActiveManagementTab] = useState<'registrants' | 'deliveries'>('registrants');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('iwickens@gmail.com');
  const [testFirstName, setTestFirstName] = useState('');
  const [form, setForm] = useState<CampaignFormState>(buildNewDraftForm('', EMPTY_OVERVIEW.defaults));

  const selectedEvent = useMemo(
    () => events.find((item) => item.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const selectedCampaign = useMemo(
    () => campaigns.find((item) => item.id === form.campaignId) || null,
    [campaigns, form.campaignId]
  );

  const filteredCampaigns = useMemo(
    () => (campaignStatusFilter === 'all' ? campaigns : campaigns.filter((item) => item.status === campaignStatusFilter)),
    [campaignStatusFilter, campaigns]
  );

  const canEditSelected = !selectedCampaign || selectedCampaign.status === 'draft' || selectedCampaign.status === 'queued';
  const selectedCampaignStatus = selectedCampaign?.status || null;
  const dirty = useMemo(() => {
    if (!selectedCampaign) return true;
    const formVisualBody = JSON.stringify(Array.isArray(form.visualBody) ? form.visualBody : []);
    const selectedVisualBody = JSON.stringify(Array.isArray(selectedCampaign.visualBody) ? selectedCampaign.visualBody : []);
    return (
      form.campaignKind !== selectedCampaign.campaignKind ||
      form.name !== selectedCampaign.name ||
      form.subject !== selectedCampaign.subject ||
      form.preheader !== selectedCampaign.preheader ||
      form.htmlBody !== selectedCampaign.htmlBody ||
      form.textBody !== selectedCampaign.textBody ||
      formVisualBody !== selectedVisualBody
    );
  }, [form, selectedCampaign]);

  function buildDraftForm(eventId: string, kind: EventCampaignKind = 'update') {
    return buildNewDraftForm(eventId, overview.defaults, kind);
  }

  const loadOverview = useCallback(async () => {
    const response = await fetch('/api/admin/event-registrations/overview', {
      cache: 'no-store',
      credentials: 'include'
    });
    const payload = (await response.json().catch(() => ({}))) as Partial<OverviewPayload> & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load event registration overview');
    }

    const nextOverview: OverviewPayload = {
      counts: {
        localEvents: Number(payload.counts?.localEvents || 0),
        pending: Number(payload.counts?.pending || 0),
        confirmed: Number(payload.counts?.confirmed || 0),
        cancelled: Number(payload.counts?.cancelled || 0)
      },
      campaignStatus: {
        draft: Number(payload.campaignStatus?.draft || 0),
        queued: Number(payload.campaignStatus?.queued || 0),
        sending: Number(payload.campaignStatus?.sending || 0),
        completed: Number(payload.campaignStatus?.completed || 0),
        cancelled: Number(payload.campaignStatus?.cancelled || 0)
      },
      defaults: {
        update: {
          htmlBody: payload.defaults?.update?.htmlBody || EMPTY_OVERVIEW.defaults.update.htmlBody,
          textBody: payload.defaults?.update?.textBody || EMPTY_OVERVIEW.defaults.update.textBody
        },
        'joining-instructions': {
          htmlBody:
            payload.defaults?.['joining-instructions']?.htmlBody ||
            EMPTY_OVERVIEW.defaults['joining-instructions'].htmlBody,
          textBody:
            payload.defaults?.['joining-instructions']?.textBody ||
            EMPTY_OVERVIEW.defaults['joining-instructions'].textBody
        }
      }
    };

    setOverview(nextOverview);
    return nextOverview;
  }, []);

  const loadEvents = useCallback(async () => {
    const response = await fetch('/api/admin/event-registrations/events?limit=200', {
      cache: 'no-store',
      credentials: 'include'
    });
    const payload = (await response.json().catch(() => ({}))) as { items?: EventWorkspaceItem[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load local-registration events');
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    setEvents(items);
    setSelectedEventId((current) => {
      if (current && items.some((item) => item.id === current)) return current;
      return items[0]?.id || '';
    });
    return items;
  }, []);

  const loadCampaigns = useCallback(async () => {
    if (!selectedEventId) {
      setCampaigns([]);
      return;
    }
    setIsLoadingCampaigns(true);
    try {
      const params = new URLSearchParams({ eventId: selectedEventId, limit: '100' });
      const response = await fetch(`/api/admin/event-registrations/campaigns?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await response.json().catch(() => ({}))) as { items?: CampaignItem[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load event campaigns');
      }
      setCampaigns(Array.isArray(payload.items) ? payload.items : []);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [selectedEventId]);

  const loadRegistrations = useCallback(async () => {
    if (!selectedEventId) {
      setRegistrations([]);
      return;
    }
    const params = new URLSearchParams({
      eventId: selectedEventId,
      status: registrantStatus,
      limit: '500'
    });
    if (registrantQuery.trim()) params.set('q', registrantQuery.trim());
    const response = await fetch(`/api/admin/event-registrations/registrants?${params.toString()}`, {
      cache: 'no-store',
      credentials: 'include'
    });
    const payload = (await response.json().catch(() => ({}))) as { items?: RegistrationItem[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load event registrants');
    }
    setRegistrations(Array.isArray(payload.items) ? payload.items : []);
  }, [registrantQuery, registrantStatus, selectedEventId]);

  const loadDeliveries = useCallback(async () => {
    if (!selectedEventId) {
      setDeliveries([]);
      return;
    }
    setIsLoadingDeliveries(true);
    try {
      const params = new URLSearchParams({
        eventId: selectedEventId,
        status: deliveryStatus,
        limit: '500'
      });
      if (form.campaignId) params.set('campaignId', form.campaignId);
      if (deliveryQuery.trim()) params.set('q', deliveryQuery.trim());
      const response = await fetch(`/api/admin/event-registrations/deliveries?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await response.json().catch(() => ({}))) as { items?: DeliveryItem[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load delivery log');
      }
      setDeliveries(Array.isArray(payload.items) ? payload.items : []);
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, [deliveryQuery, deliveryStatus, form.campaignId, selectedEventId]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextOverview = await loadOverview();
      const nextEvents = await loadEvents();
      const nextEventId =
        selectedEventId && nextEvents.some((item) => item.id === selectedEventId) ? selectedEventId : nextEvents[0]?.id || '';
      if (!form.campaignId) {
        setForm(buildNewDraftForm(nextEventId, nextOverview.defaults));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load event outreach workspace');
    } finally {
      setIsLoading(false);
    }
  }, [form.campaignId, loadEvents, loadOverview, selectedEventId]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!selectedEventId) {
      setCampaigns([]);
      setRegistrations([]);
      setDeliveries([]);
      setForm((current) => ({ ...current, eventId: '', campaignId: '' }));
      return;
    }

    if (!form.campaignId) {
      setForm((current) =>
        current.eventId === selectedEventId ? current : buildNewDraftForm(selectedEventId, overview.defaults, current.campaignKind)
      );
    }

    void loadCampaigns().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unable to load event campaigns');
    });
  }, [form.campaignId, loadCampaigns, overview.defaults, selectedEventId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadRegistrations().catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'Unable to load event registrants');
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [loadRegistrations]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDeliveries().catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'Unable to load delivery log');
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [loadDeliveries]);

  const selectCampaign = useCallback((campaign: CampaignItem) => {
    setForm(toCampaignFormState(campaign));
  }, []);

  useEffect(() => {
    if (campaignStatusFilter === 'all') return;
    if (filteredCampaigns.some((campaign) => campaign.id === form.campaignId)) return;
    if (filteredCampaigns[0]) {
      selectCampaign(filteredCampaigns[0]);
      return;
    }
    if (!selectedEventId) return;
    setForm((current) => buildNewDraftForm(selectedEventId, overview.defaults, current.campaignKind));
  }, [campaignStatusFilter, filteredCampaigns, form.campaignId, overview.defaults, selectCampaign, selectedEventId]);

  function resetQuickFilters() {
    setRegistrantStatus('all');
    setCampaignStatusFilter('all');
  }

  function toggleRegistrantQuickFilter(status: EventRegistrationStatus) {
    setCampaignStatusFilter('all');
    setActiveManagementTab('registrants');
    setRegistrantStatus((current) => (current === status ? 'all' : status));
  }

  function toggleCampaignQuickFilter(status: EventCampaignStatus) {
    setRegistrantStatus('all');
    setCampaignStatusFilter((current) => (current === status ? 'all' : status));
  }

  function startNewDraft(kind: EventCampaignKind = form.campaignKind) {
    setForm(buildDraftForm(selectedEventId, kind));
  }

  async function saveDraft() {
    if (!selectedEventId) {
      toast.error('Select an event first.');
      return null;
    }
    const { htmlBody, textBody, visualBody } = deriveCampaignBody(form);
    if (!form.name.trim() || !form.subject.trim() || !htmlBody.trim() || !textBody.trim()) {
      toast.error('Name, subject, HTML body, and text body are required.');
      return null;
    }

    setIsSaving(true);
    try {
      const body = form.campaignId
        ? {
            action: 'update_draft',
            campaignId: form.campaignId,
            campaignKind: form.campaignKind,
            name: form.name,
            subject: form.subject,
            preheader: form.preheader,
            htmlBody,
            textBody,
            visualBody
          }
        : {
            action: 'create_draft',
            eventId: selectedEventId,
            campaignKind: form.campaignKind,
            name: form.name,
            subject: form.subject,
            preheader: form.preheader,
            htmlBody,
            textBody,
            visualBody
          };

      const response = await fetch('/api/admin/event-registrations/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const payload = (await response.json().catch(() => ({}))) as { item?: CampaignItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || 'Unable to save draft');
      }

      toast.success(form.campaignId ? 'Campaign draft updated.' : 'Campaign draft created.');
      setForm(toCampaignFormState(payload.item));
      await Promise.all([loadOverview(), loadCampaigns(), loadDeliveries()]);
      return payload.item;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save event campaign');
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function queueCampaign() {
    let campaignId = form.campaignId;
    if (!campaignId || dirty) {
      const saved = await saveDraft();
      campaignId = saved?.id || '';
    }
    if (!campaignId) return;

    setIsQueueing(true);
    try {
      const response = await fetch('/api/admin/event-registrations/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'queue',
          campaignId,
          scheduledAt: fromDateTimeLocalInput(form.scheduledAt)
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { item?: CampaignItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || 'Unable to queue campaign');
      }

      toast.success('Campaign queued.');
      selectCampaign(payload.item);
      await Promise.all([loadOverview(), loadCampaigns(), loadDeliveries()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to queue event campaign');
    } finally {
      setIsQueueing(false);
    }
  }

  async function sendTest() {
    if (!selectedEventId) {
      toast.error('Select an event first.');
      return;
    }
    const { htmlBody, textBody } = deriveCampaignBody(form);
    setIsSendingTest(true);
    try {
      const response = await fetch('/api/admin/event-registrations/send-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: selectedEventId,
          campaignId: form.campaignId || undefined,
          campaignKind: form.campaignKind,
          toEmail: testEmail,
          firstName: testFirstName,
          subject: form.subject,
          preheader: form.preheader,
          htmlBody,
          textBody
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send test email');
      }
      toast.success('Test email sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send test email');
    } finally {
      setIsSendingTest(false);
    }
  }

  async function runDispatch() {
    setIsDispatching(true);
    try {
      const response = await fetch('/api/admin/event-registrations/dispatch', {
        method: 'POST',
        credentials: 'include'
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; sent?: number };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to dispatch campaigns');
      }
      toast.success(`Dispatch complete. Sent ${Number(payload.sent || 0)} event emails.`);
      await Promise.all([loadOverview(), loadCampaigns(), loadDeliveries()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to dispatch event campaigns');
    } finally {
      setIsDispatching(false);
    }
  }

  async function updateCampaignAction(action: 'unschedule' | 'cancel') {
    if (!form.campaignId) return;
    try {
      const response = await fetch('/api/admin/event-registrations/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, campaignId: form.campaignId })
      });
      const payload = (await response.json().catch(() => ({}))) as { item?: CampaignItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || `Unable to ${action} campaign`);
      }
      toast.success(action === 'unschedule' ? 'Campaign moved back to draft.' : 'Campaign cancelled.');
      selectCampaign(payload.item);
      await Promise.all([loadOverview(), loadCampaigns(), loadDeliveries()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Unable to ${action} campaign`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-8 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Event Outreach</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            Manage event registrations, confirmations, and event-specific email updates.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refreshAll()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <EventRegistrationOverviewCards
        overview={overview}
        registrantStatus={registrantStatus}
        campaignStatusFilter={campaignStatusFilter}
        onResetFilters={resetQuickFilters}
        onToggleRegistrantStatus={toggleRegistrantQuickFilter}
        onToggleCampaignStatus={toggleCampaignQuickFilter}
      />

      <EventRegistrationEventFilterCard
        events={events}
        selectedEventId={selectedEventId}
        selectedEvent={selectedEvent}
        onSelectEvent={(nextValue) => {
          setSelectedEventId(nextValue);
          setForm((current) => buildNewDraftForm(nextValue, overview.defaults, current.campaignKind));
        }}
      />

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <EventRegistrationCampaignList
          items={filteredCampaigns}
          selectedCampaignId={form.campaignId}
          statusFilter={campaignStatusFilter}
          isLoading={isLoadingCampaigns}
          selectedEventTitle={selectedEvent?.title}
          onClearFilter={() => setCampaignStatusFilter('all')}
          onSelect={selectCampaign}
        />
        <EventRegistrationComposerCard
          form={form}
          setForm={setForm}
          selectedEvent={selectedEvent}
          canEditSelected={canEditSelected}
          selectedCampaignStatus={selectedCampaignStatus}
          isSaving={isSaving}
          isQueueing={isQueueing}
          isSendingTest={isSendingTest}
          isDispatching={isDispatching}
          queuedCampaignCount={overview.campaignStatus.queued}
          testEmail={testEmail}
          setTestEmail={setTestEmail}
          testFirstName={testFirstName}
          setTestFirstName={setTestFirstName}
          onCampaignKindChange={(value) => {
            setForm((current) =>
              current.campaignId ? { ...current, campaignKind: value } : buildNewDraftForm(selectedEventId, overview.defaults, value)
            );
          }}
          onSaveDraft={() => void saveDraft()}
          onQueueCampaign={() => void queueCampaign()}
          onSendTest={() => void sendTest()}
          onRunDispatch={() => void runDispatch()}
          onStartNewDraft={() => startNewDraft()}
          onCancelSchedule={() => void updateCampaignAction('unschedule')}
          onCancelCampaign={() => void updateCampaignAction('cancel')}
        />
      </div>

      <EventRegistrationManagementTabs
        activeTab={activeManagementTab}
        onActiveTabChange={setActiveManagementTab}
        selectedEvent={selectedEvent}
        registrantQuery={registrantQuery}
        onRegistrantQueryChange={setRegistrantQuery}
        registrantStatus={registrantStatus}
        onRegistrantStatusChange={setRegistrantStatus}
        registrations={registrations}
        deliveryQuery={deliveryQuery}
        onDeliveryQueryChange={setDeliveryQuery}
        deliveryStatus={deliveryStatus}
        onDeliveryStatusChange={setDeliveryStatus}
        deliveries={deliveries}
        campaigns={campaigns}
        isLoadingDeliveries={isLoadingDeliveries}
      />
    </main>
  );
}
