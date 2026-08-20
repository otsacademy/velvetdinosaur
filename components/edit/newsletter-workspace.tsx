'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MailCheck, Settings2, Users } from 'lucide-react';
import { NewsletterComposerCard } from '@/components/edit/newsletter/newsletter-composer-card';
import { toast } from 'sonner';
import { NewsletterCampaignList } from '@/components/edit/newsletter/newsletter-campaign-list';
import { NewsletterDeliveryPanel, NewsletterSubscriberPanel } from '@/components/edit/newsletter/newsletter-management-panels';
import { NewsletterSettingsDialog } from '@/components/edit/newsletter/newsletter-settings-dialog';
import { StatCard } from '@/components/edit/newsletter/newsletter-workspace-ui';
import {
  type NewsletterAdminSettings,
  type NewsletterStatus,
  type CampaignItem,
  type DeliveryItem,
  type DeliveryStatus,
  type PreferenceItem,
  type OverviewPayload,
  type CampaignFormState,
  DEFAULT_NEWSLETTER_ADMIN_SETTINGS,
  EMPTY_OVERVIEW,
  fromDateTimeLocalInput
} from '@/components/edit/newsletter/newsletter-workspace.shared';
import {
  buildNewDraftForm,
  deriveCampaignBody,
  toCampaignFormState
} from '@/components/edit/newsletter/newsletter-workspace.helpers';
import { Button } from '@/components/ui/button';

export function NewsletterWorkspace() {
  const [overview, setOverview] = useState<OverviewPayload>(EMPTY_OVERVIEW);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [subscribers, setSubscribers] = useState<PreferenceItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [subscriberStatus, setSubscriberStatus] = useState<'all' | NewsletterStatus>('all');
  const [subscriberQuery, setSubscriberQuery] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'all' | DeliveryStatus>('all');
  const [deliveryQuery, setDeliveryQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('iwickens@gmail.com');
  const [testFirstName, setTestFirstName] = useState('');
  const [settings, setSettings] = useState<NewsletterAdminSettings>(DEFAULT_NEWSLETTER_ADMIN_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [suppressedCount, setSuppressedCount] = useState(0);
  const [form, setForm] = useState<CampaignFormState>(buildNewDraftForm(EMPTY_OVERVIEW.defaults));
  const [pendingSubscriberId, setPendingSubscriberId] = useState('');
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

  const loadOverview = useCallback(async () => {
    const response = await fetch('/api/admin/newsletter/overview', {
      cache: 'no-store',
      credentials: 'include'
    });
    const payload = (await response.json().catch(() => ({}))) as Partial<OverviewPayload> & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load newsletter overview');
    }

    const nextOverview: OverviewPayload = {
      counts: {
        total: Number(payload.counts?.total || 0),
        subscribed: Number(payload.counts?.subscribed || 0),
        pending: Number(payload.counts?.pending || 0),
        unsubscribed: Number(payload.counts?.unsubscribed || 0),
        notConsented: Number(payload.counts?.notConsented || 0),
        suppressed: Number(payload.counts?.suppressed || 0)
      },
      campaignStatus: {
        draft: Number(payload.campaignStatus?.draft || 0),
        queued: Number(payload.campaignStatus?.queued || 0),
        sending: Number(payload.campaignStatus?.sending || 0),
        completed: Number(payload.campaignStatus?.completed || 0),
        cancelled: Number(payload.campaignStatus?.cancelled || 0)
      },
      defaults: {
        htmlBody: payload.defaults?.htmlBody || EMPTY_OVERVIEW.defaults.htmlBody,
        textBody: payload.defaults?.textBody || EMPTY_OVERVIEW.defaults.textBody
      }
    };
    setOverview(nextOverview);
    setSuppressedCount(nextOverview.counts.suppressed);
    return nextOverview;
  }, []);

  const loadSettings = useCallback(async () => {
    const response = await fetch('/api/admin/newsletter/settings', {
      cache: 'no-store',
      credentials: 'include'
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      settings?: Partial<NewsletterAdminSettings>;
      suppression?: { active?: number };
    };
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load settings');
    }
    setSettings({ ...DEFAULT_NEWSLETTER_ADMIN_SETTINGS, ...(payload.settings || {}) });
    const nextSuppressed = Number(payload.suppression?.active || 0);
    if (Number.isFinite(nextSuppressed)) {
      setSuppressedCount(nextSuppressed);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    const response = await fetch('/api/admin/newsletter/campaigns?limit=80', {
      cache: 'no-store',
      credentials: 'include'
    });
    const payload = (await response.json().catch(() => ({}))) as { items?: CampaignItem[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load campaigns');
    }
    setCampaigns(Array.isArray(payload.items) ? payload.items : []);
  }, []);

  const loadSubscribers = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('status', subscriberStatus);
    if (subscriberQuery.trim()) params.set('q', subscriberQuery.trim());
    params.set('limit', '250');
    const response = await fetch(`/api/admin/newsletter/subscribers?${params.toString()}`, {
      cache: 'no-store',
      credentials: 'include'
    });
    const payload = (await response.json().catch(() => ({}))) as { items?: PreferenceItem[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load subscribers');
    }
    setSubscribers(Array.isArray(payload.items) ? payload.items : []);
  }, [subscriberQuery, subscriberStatus]);

  const loadDeliveries = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setIsLoadingDeliveries(true);
      try {
        const params = new URLSearchParams();
        if (form.campaignId) params.set('campaignId', form.campaignId);
        params.set('status', deliveryStatus);
        if (deliveryQuery.trim()) params.set('q', deliveryQuery.trim());
        params.set('limit', '400');
        const response = await fetch(`/api/admin/newsletter/deliveries?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include'
        });
        const payload = (await response.json().catch(() => ({}))) as { items?: DeliveryItem[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load delivery log');
        }
        setDeliveries(Array.isArray(payload.items) ? payload.items : []);
      } finally {
        if (!options?.silent) setIsLoadingDeliveries(false);
      }
    },
    [deliveryQuery, deliveryStatus, form.campaignId]
  );

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextOverview] = await Promise.all([
        loadOverview(),
        loadCampaigns(),
        loadSubscribers(),
        loadDeliveries({ silent: true }),
        loadSettings()
      ]);
      setForm((current) =>
        current.campaignId
          ? current
          : {
              ...current,
              htmlBody: current.htmlBody || nextOverview.defaults.htmlBody,
              textBody: current.textBody || nextOverview.defaults.textBody
            }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load newsletter workspace');
    } finally {
      setIsLoading(false);
    }
  }, [loadCampaigns, loadDeliveries, loadOverview, loadSettings, loadSubscribers]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSubscribers().catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'Unable to load subscribers');
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [loadSubscribers]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDeliveries().catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'Unable to load delivery log');
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [loadDeliveries]);

  const selectedCampaign = useMemo(
    () => campaigns.find((item) => item.id === form.campaignId) || null,
    [campaigns, form.campaignId]
  );

  const canEditSelected = !selectedCampaign || selectedCampaign.status === 'draft' || selectedCampaign.status === 'queued';

  const dirty = useMemo(() => {
    if (!selectedCampaign) return true;
    const formVisualBody = JSON.stringify(Array.isArray(form.visualBody) ? form.visualBody : []);
    const selectedVisualBody = JSON.stringify(Array.isArray(selectedCampaign.visualBody) ? selectedCampaign.visualBody : []);
    return (
      form.name !== selectedCampaign.name ||
      form.subject !== selectedCampaign.subject ||
      form.preheader !== selectedCampaign.preheader ||
      form.htmlBody !== selectedCampaign.htmlBody ||
      form.textBody !== selectedCampaign.textBody ||
      formVisualBody !== selectedVisualBody
    );
  }, [form, selectedCampaign]);

  function startNewDraft() {
    setForm(buildNewDraftForm(overview.defaults));
  }

  async function saveDraft() {
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
            name: form.name,
            subject: form.subject,
            preheader: form.preheader,
            htmlBody,
            textBody,
            visualBody
          }
        : {
            action: 'create_draft',
            name: form.name,
            subject: form.subject,
            preheader: form.preheader,
            htmlBody,
            textBody,
            visualBody
          };
      const response = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const payload = (await response.json().catch(() => ({}))) as { item?: CampaignItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || 'Unable to save draft');
      }
      await Promise.all([loadCampaigns(), loadOverview(), loadDeliveries({ silent: true })]);
      setForm(toCampaignFormState(payload.item));
      toast.success('Draft saved.');
      return payload.item;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save draft');
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function queueCampaign() {
    if (!form.campaignId) {
      toast.error('Save the draft before queueing.');
      return;
    }
    if (!canEditSelected) {
      toast.error('This campaign can no longer be edited or queued.');
      return;
    }

    setIsQueueing(true);
    try {
      if (dirty) {
        const saved = await saveDraft();
        if (!saved) return;
      }
      const response = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'queue',
          campaignId: form.campaignId,
          scheduledAt: fromDateTimeLocalInput(form.scheduledAt)
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { item?: CampaignItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || 'Unable to queue campaign');
      }
      await Promise.all([loadCampaigns(), loadOverview(), loadDeliveries({ silent: true })]);
      setForm(toCampaignFormState(payload.item));
      toast.success('Campaign queued for delivery.');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to queue campaign');
      return false;
    } finally {
      setIsQueueing(false);
    }
  }

  async function cancelCampaign() {
    if (!form.campaignId) return;
    setIsQueueing(true);
    try {
      const response = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'cancel', campaignId: form.campaignId })
      });
      const payload = (await response.json().catch(() => ({}))) as { item?: CampaignItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || 'Unable to cancel campaign');
      }
      await Promise.all([loadCampaigns(), loadOverview(), loadDeliveries({ silent: true })]);
      setForm(toCampaignFormState(payload.item));
      toast.success('Campaign cancelled.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel campaign');
    } finally {
      setIsQueueing(false);
    }
  }

  async function cancelSchedule() {
    if (!form.campaignId) return;
    setIsQueueing(true);
    try {
      const response = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'unschedule', campaignId: form.campaignId })
      });
      const payload = (await response.json().catch(() => ({}))) as { item?: CampaignItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || 'Unable to cancel scheduled send');
      }
      await Promise.all([loadCampaigns(), loadOverview(), loadDeliveries({ silent: true })]);
      setForm(toCampaignFormState(payload.item));
      toast.success('Scheduled send cancelled. Campaign moved back to draft.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel scheduled send');
    } finally {
      setIsQueueing(false);
    }
  }

  async function sendTest() {
    const { htmlBody, textBody } = deriveCampaignBody(form);
    if (!form.subject.trim() || !htmlBody.trim() || !textBody.trim()) {
      toast.error('Subject, HTML body, and text body are required for test sends.');
      return;
    }
    setIsSendingTest(true);
    try {
      const response = await fetch('/api/admin/newsletter/send-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          toEmail: testEmail,
          firstName: testFirstName,
          campaignId: form.campaignId || undefined,
          subject: form.subject,
          preheader: form.preheader,
          htmlBody,
          textBody
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { toEmail?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send test email');
      }
      toast.success(`Test email sent to ${payload.toEmail || testEmail}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send test email');
    } finally {
      setIsSendingTest(false);
    }
  }

  async function runDispatch() {
    setIsDispatching(true);
    try {
      if (selectedCampaign?.status === 'draft') {
        const queued = await queueCampaign();
        if (!queued) return;
      }
      const response = await fetch('/api/admin/newsletter/dispatch', {
        method: 'POST',
        credentials: 'include'
      });
      const payload = (await response.json().catch(() => ({}))) as {
        processedCampaigns?: number;
        sent?: number;
        failed?: number;
        skipped?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to run dispatch');
      }
      await Promise.all([loadCampaigns(), loadOverview(), loadDeliveries({ silent: true })]);
      toast.success(
        `Dispatch complete: ${payload.sent || 0} sent, ${payload.failed || 0} failed, ${payload.skipped || 0} skipped.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to dispatch campaigns');
    } finally {
      setIsDispatching(false);
    }
  }

  async function toggleSubscriber(item: PreferenceItem, nextSubscribed: boolean) {
    setPendingSubscriberId(item.id);
    try {
      const response = await fetch('/api/admin/newsletter/subscribers', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: item.userId,
          email: item.email,
          firstName: item.firstName,
          subscribed: nextSubscribed
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update subscriber');
      }
      await Promise.all([loadSubscribers(), loadOverview()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update subscriber');
    } finally {
      setPendingSubscriberId('');
    }
  }

  async function saveSettings() {
    setIsSavingSettings(true);
    try {
      const response = await fetch('/api/admin/newsletter/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        settings?: Partial<NewsletterAdminSettings>;
      };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save settings');
      }
      setSettings({ ...DEFAULT_NEWSLETTER_ADMIN_SETTINGS, ...(payload.settings || {}) });
      setSettingsOpen(false);
      toast.success('Newsletter settings saved.');
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] space-y-6 py-6">
      <section className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="h-4 w-4" />
          Settings
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Registered users" value={overview.counts.total} icon={Users} />
        <StatCard title="Subscribed" value={overview.counts.subscribed} icon={MailCheck} accent="success" />
        <StatCard title="Pending" value={overview.counts.pending} icon={MailCheck} accent="warning" />
        <StatCard title="No consent" value={overview.counts.notConsented} icon={MailCheck} accent="warning" />
        <StatCard title="Unsubscribed" value={overview.counts.unsubscribed} icon={MailCheck} />
        <StatCard title="Suppressed" value={suppressedCount} icon={MailCheck} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <NewsletterComposerCard
          form={form}
          setForm={setForm}
          canEditSelected={canEditSelected}
          selectedCampaignStatus={selectedCampaign?.status || null}
          isSaving={isSaving}
          isQueueing={isQueueing}
          isSendingTest={isSendingTest}
          isDispatching={isDispatching}
          testEmail={testEmail}
          setTestEmail={setTestEmail}
          testFirstName={testFirstName}
          setTestFirstName={setTestFirstName}
          onSaveDraft={() => {
            void saveDraft();
          }}
          onQueueCampaign={() => {
            void queueCampaign();
          }}
          onSendTest={() => {
            void sendTest();
          }}
          onRunDispatch={() => {
            void runDispatch();
          }}
          onStartNewDraft={startNewDraft}
          onCancelSchedule={() => {
            void cancelSchedule();
          }}
          onCancelCampaign={() => {
            void cancelCampaign();
          }}
        />

        <NewsletterCampaignList
          items={campaigns}
          selectedCampaignId={form.campaignId}
          isLoading={isLoading}
          onSelect={(item) => setForm(toCampaignFormState(item))}
        />
      </section>

      <NewsletterSubscriberPanel
        subscriberQuery={subscriberQuery}
        onSubscriberQueryChange={setSubscriberQuery}
        subscriberStatus={subscriberStatus}
        onSubscriberStatusChange={setSubscriberStatus}
        subscribers={subscribers}
        pendingSubscriberId={pendingSubscriberId}
        onToggleSubscriber={(item, checked) => {
          void toggleSubscriber(item, checked);
        }}
      />

      <NewsletterDeliveryPanel
        deliveryQuery={deliveryQuery}
        onDeliveryQueryChange={setDeliveryQuery}
        deliveryStatus={deliveryStatus}
        onDeliveryStatusChange={setDeliveryStatus}
        deliveries={deliveries}
        campaigns={campaigns}
        loading={isLoadingDeliveries}
      />

      <NewsletterSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        value={settings}
        onChange={setSettings}
        onSave={() => {
          void saveSettings();
        }}
        isSaving={isSavingSettings}
        suppressedCount={suppressedCount}
      />
    </main>
  );
}
