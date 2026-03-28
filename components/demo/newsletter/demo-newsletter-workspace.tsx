'use client';

import { useMemo, useState } from 'react';
import { MailCheck, Send, Settings2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DemoNewsletterCampaignList } from '@/components/demo/newsletter/demo-newsletter-campaign-list';
import {
  applyHighlightSelections,
  createCampaignForm,
  createDraftCampaign,
  createNewsletterOverview,
  filterDeliveries,
  filterSubscribers,
  nextCampaignId,
  nextDeliveryId,
  readSelectedHighlights
} from '@/components/demo/newsletter/demo-newsletter-helpers';
import { DemoNewsletterManagementPanels } from './demo-newsletter-workspace.panels';
import { DemoNewsletterSettingsDialog } from '@/components/demo/newsletter/demo-newsletter-settings-dialog';
import { DemoNewsletterComposerCard } from '@/components/demo/newsletter/demo-newsletter-composer-card';
import { StatCard } from '@/components/demo/newsletter/demo-newsletter-ui';
import {
  createDemoNewsletterSeed,
  fromDateTimeLocalInput,
  DEFAULT_DEMO_NEWSLETTER_SETTINGS,
  type DemoNewsletterCampaign,
  type DemoNewsletterDelivery,
  type DemoNewsletterSettings,
  type DemoNewsletterSubscriber
} from '@/lib/demo-newsletter-seed';

function deriveDispatchDeliveries(campaign: DemoNewsletterCampaign, subscribers: DemoNewsletterSubscriber[]): DemoNewsletterDelivery[] {
  return subscribers.map((subscriber) => {
    let status: DemoNewsletterDelivery['status'] = 'sent';
    if (subscriber.status === 'pending' || subscriber.status === 'not_consented') {
      status = 'skipped_no_consent';
    } else if (subscriber.status === 'unsubscribed') {
      status = 'skipped_unsubscribed';
    }

    return {
      id: nextDeliveryId(),
      campaignId: campaign.id,
      email: subscriber.email,
      firstName: subscriber.firstName,
      status,
      postmarkMessageId: `pm_demo_${Math.random().toString(36).slice(2, 7)}`,
      sentAt: status === 'sent' ? new Date().toISOString() : null,
      error: status === 'sent' ? '' : 'Suppressed inside the demo delivery rules.',
      attempts: 1,
      createdAt: new Date().toISOString()
    };
  });
}

export function DemoNewsletterWorkspace() {
  const seed = useMemo(() => createDemoNewsletterSeed(), []);
  const [campaigns, setCampaigns] = useState(seed.campaigns);
  const [subscribers, setSubscribers] = useState(seed.subscribers);
  const [deliveries, setDeliveries] = useState(seed.deliveries);
  const [settings, setSettings] = useState<DemoNewsletterSettings>(seed.settings || DEFAULT_DEMO_NEWSLETTER_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState(createCampaignForm(seed.campaigns[2] ?? null, seed.defaults));
  const [subscriberStatus, setSubscriberStatus] = useState<'all' | DemoNewsletterSubscriber['status']>('all');
  const [subscriberQuery, setSubscriberQuery] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'all' | DemoNewsletterDelivery['status']>('all');
  const [deliveryQuery, setDeliveryQuery] = useState('');
  const [testEmail, setTestEmail] = useState('amelia@harbourandpine.example');
  const [testFirstName, setTestFirstName] = useState('Amelia');
  const [selectedNewsSlugs, setSelectedNewsSlugs] = useState(readSelectedHighlights(form, 'newsHighlights'));
  const [selectedEventSlugs, setSelectedEventSlugs] = useState(readSelectedHighlights(form, 'eventHighlights'));

  const overview = useMemo(() => createNewsletterOverview(subscribers, campaigns), [subscribers, campaigns]);
  const visibleSubscribers = useMemo(
    () => filterSubscribers(subscribers, subscriberQuery, subscriberStatus),
    [subscribers, subscriberQuery, subscriberStatus]
  );
  const visibleDeliveries = useMemo(
    () => filterDeliveries(deliveries, deliveryQuery, deliveryStatus, form.campaignId),
    [deliveries, deliveryQuery, deliveryStatus, form.campaignId]
  );
  const selectedCampaign = campaigns.find((item) => item.id === form.campaignId) ?? null;

  function syncHighlightSelections(nextForm: typeof form) {
    setSelectedNewsSlugs(readSelectedHighlights(nextForm, 'newsHighlights'));
    setSelectedEventSlugs(readSelectedHighlights(nextForm, 'eventHighlights'));
  }

  function selectCampaign(campaign: DemoNewsletterCampaign) {
    const nextForm = createCampaignForm(campaign, seed.defaults);
    setForm(nextForm);
    syncHighlightSelections(nextForm);
  }

  function startNewDraft() {
    const nextForm = createCampaignForm(null, seed.defaults);
    setForm(nextForm);
    syncHighlightSelections(nextForm);
  }

  function saveDraft() {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlBody.trim() || !form.textBody.trim()) {
      toast.error('Name, subject, HTML body, and plain-text body are required.');
      return;
    }

    if (form.campaignId) {
      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === form.campaignId
            ? {
                ...campaign,
                name: form.name.trim(),
                subject: form.subject.trim(),
                preheader: form.preheader.trim(),
                htmlBody: form.htmlBody,
                textBody: form.textBody,
                visualBody: Array.isArray(form.visualBody) ? form.visualBody : [],
                scheduledAt: fromDateTimeLocalInput(form.scheduledAt) || null
              }
            : campaign
        )
      );
    } else {
      const nextCampaign = createDraftCampaign(form, nextCampaignId());
      setCampaigns((current) => [nextCampaign, ...current]);
      const nextForm = createCampaignForm(nextCampaign, seed.defaults);
      setForm(nextForm);
      syncHighlightSelections(nextForm);
    }

    toast.info('This is a demonstration workspace, so the newsletter draft is not saved permanently.');
  }

  function queueCampaign() {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error('Name and subject are required before queueing a campaign.');
      return;
    }

    const scheduledAt = fromDateTimeLocalInput(form.scheduledAt) || new Date(Date.now() + 86_400_000).toISOString();
    const campaignId = form.campaignId || nextCampaignId();
    const recipientSnapshotCount = subscribers.filter((item) => item.status === 'subscribed').length;

    const nextCampaign: DemoNewsletterCampaign = {
      ...(campaigns.find((item) => item.id === campaignId) ?? createDraftCampaign(form, campaignId)),
      id: campaignId,
      name: form.name.trim(),
      subject: form.subject.trim(),
      preheader: form.preheader.trim(),
      htmlBody: form.htmlBody,
      textBody: form.textBody,
      visualBody: Array.isArray(form.visualBody) ? form.visualBody : [],
      status: 'queued',
      scheduledAt,
      recipientSnapshotCount
    };

    setCampaigns((current) => {
      const exists = current.some((item) => item.id === campaignId);
      return exists ? current.map((item) => (item.id === campaignId ? nextCampaign : item)) : [nextCampaign, ...current];
    });
    const nextForm = createCampaignForm(nextCampaign, seed.defaults);
    setForm(nextForm);
    syncHighlightSelections(nextForm);
    toast.info('Queued for this demonstration session only. No campaign has been scheduled on a real system.');
  }

  function sendTest() {
    toast.info('This is a demonstration workspace, so no test email has been sent.');
  }

  function runDispatch() {
    if (!selectedCampaign) {
      toast.error('Select or queue a campaign before running the dispatch demo.');
      return;
    }

    const nextDeliveries = deriveDispatchDeliveries(selectedCampaign, subscribers);
    const sentCount = nextDeliveries.filter((item) => item.status === 'sent').length;
    const skippedCount = nextDeliveries.length - sentCount;

    setDeliveries((current) => [...nextDeliveries, ...current.filter((item) => item.campaignId !== selectedCampaign.id)]);
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === selectedCampaign.id
          ? {
              ...campaign,
              status: 'completed',
              recipientSnapshotCount: nextDeliveries.length,
              sentCount,
              skippedCount,
              failedCount: 0
            }
          : campaign
      )
    );
    toast.info('Dispatch complete for this demo session. No live messages have been delivered.');
  }

  function cancelSchedule() {
    if (!selectedCampaign || selectedCampaign.status !== 'queued') return;
    const nextCampaign = { ...selectedCampaign, status: 'draft' as const, scheduledAt: null };
    setCampaigns((current) => current.map((item) => (item.id === nextCampaign.id ? nextCampaign : item)));
    const nextForm = createCampaignForm(nextCampaign, seed.defaults);
    setForm(nextForm);
    syncHighlightSelections(nextForm);
    toast.info('The demo schedule has been cancelled.');
  }

  function cancelCampaign() {
    if (!selectedCampaign) return;
    const nextCampaign = { ...selectedCampaign, status: 'cancelled' as const };
    setCampaigns((current) => current.map((item) => (item.id === nextCampaign.id ? nextCampaign : item)));
    toast.info('The campaign has been cancelled in this demo session.');
  }

  function toggleSubscriber(item: DemoNewsletterSubscriber, subscribed: boolean) {
    setSubscribers((current) =>
      current.map((subscriber) =>
        subscriber.id === item.id
          ? {
              ...subscriber,
              status: subscribed ? 'subscribed' : 'unsubscribed',
              updatedAt: new Date().toISOString()
            }
          : subscriber
      )
    );
    toast.info('Subscriber consent updated for this demonstration session only.');
  }

  function saveSettings() {
    setSettingsOpen(false);
    toast.info('These deliverability settings are shown for demonstration only and are not saved.');
  }

  function applyHighlights() {
    const nextForm = applyHighlightSelections(form, selectedNewsSlugs, selectedEventSlugs);
    setForm(nextForm);
    toast.info('Selected highlights have been applied inside the demo composer.');
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total subscribers" value={overview.totalSubscribers} icon={Users} />
        <StatCard title="Subscribed" value={overview.subscribedCount} icon={MailCheck} accent="success" />
        <StatCard title="Pending confirmation" value={overview.pendingCount} icon={Settings2} accent="warning" />
        <StatCard title="Queued campaigns" value={overview.campaignCounts.queued} icon={Send} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <DemoNewsletterCampaignList items={campaigns} selectedCampaignId={form.campaignId} onSelect={selectCampaign} />

        <DemoNewsletterComposerCard
          form={form}
          setForm={setForm}
          selectedCampaignStatus={selectedCampaign?.status ?? null}
          newsOptions={seed.newsOptions}
          eventOptions={seed.eventOptions}
          selectedNewsSlugs={selectedNewsSlugs}
          setSelectedNewsSlugs={setSelectedNewsSlugs}
          selectedEventSlugs={selectedEventSlugs}
          setSelectedEventSlugs={setSelectedEventSlugs}
          testEmail={testEmail}
          setTestEmail={setTestEmail}
          testFirstName={testFirstName}
          setTestFirstName={setTestFirstName}
          onApplyHighlights={applyHighlights}
          onSaveDraft={saveDraft}
          onQueueCampaign={queueCampaign}
          onSendTest={sendTest}
          onRunDispatch={runDispatch}
          onStartNewDraft={startNewDraft}
          onCancelSchedule={cancelSchedule}
          onCancelCampaign={cancelCampaign}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DemoNewsletterManagementPanels
          subscriberQuery={subscriberQuery}
          onSubscriberQueryChange={setSubscriberQuery}
          subscriberStatus={subscriberStatus}
          onSubscriberStatusChange={setSubscriberStatus}
          subscribers={visibleSubscribers}
          onToggleSubscriber={toggleSubscriber}
          deliveryQuery={deliveryQuery}
          onDeliveryQueryChange={setDeliveryQuery}
          deliveryStatus={deliveryStatus}
          onDeliveryStatusChange={setDeliveryStatus}
          deliveries={visibleDeliveries}
        />
      </div>

      <DemoNewsletterSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        value={settings}
        onChange={setSettings}
        onSave={saveSettings}
      />
    </div>
  );
}
