'use client';

import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { MailCheck, RefreshCw, Send, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { DemoEmailTemplateVisualEditor } from '@/components/demo/newsletter/demo-email-template-visual-editor';
import {
  deriveNewsletterSource,
  getVisualSource,
  renderNewsletterPreview
} from '@/components/demo/newsletter/demo-newsletter-helpers';
import { DemoNewsletterPreview } from '@/components/demo/newsletter/demo-newsletter-preview';
import { Field } from '@/components/demo/newsletter/demo-newsletter-ui';
import { visualValueFromPlainText } from '@/lib/demo-email-template-visual';
import type {
  DemoNewsletterCampaignStatus,
  DemoNewsletterContentItem,
  DemoNewsletterFormState
} from '@/lib/demo-newsletter-seed';

type DemoNewsletterComposerCardProps = {
  form: DemoNewsletterFormState;
  setForm: Dispatch<SetStateAction<DemoNewsletterFormState>>;
  selectedCampaignStatus: DemoNewsletterCampaignStatus | null;
  newsOptions: DemoNewsletterContentItem[];
  eventOptions: DemoNewsletterContentItem[];
  selectedNewsSlugs: string[];
  setSelectedNewsSlugs: (value: string[]) => void;
  selectedEventSlugs: string[];
  setSelectedEventSlugs: (value: string[]) => void;
  testEmail: string;
  setTestEmail: (value: string) => void;
  testFirstName: string;
  setTestFirstName: (value: string) => void;
  onApplyHighlights: () => void;
  onSaveDraft: () => void;
  onQueueCampaign: () => void;
  onSendTest: () => void;
  onRunDispatch: () => void;
  onStartNewDraft: () => void;
  onCancelSchedule: () => void;
  onCancelCampaign: () => void;
  onOpenSettings: () => void;
};

type ComposerTab = 'visual' | 'preview' | 'html' | 'text';

const COMPOSER_TOKENS = [
  '{{firstName}}',
  '{{email}}',
  '{{siteName}}',
  '{{appUrl}}',
  '{{logoUrl}}',
  '{{subject}}',
  '{{preheader}}',
  '{{unsubscribeUrl}}',
  '{{newsHighlights}}',
  '{{eventHighlights}}'
];

const tabTriggerClass =
  'rounded-[calc(var(--vd-radius)-4px)] border border-[var(--vd-border)] bg-[var(--vd-card)] text-[var(--vd-muted-fg)] data-[state=active]:border-[var(--vd-ring)] data-[state=active]:bg-[var(--vd-muted)] data-[state=active]:text-[var(--vd-fg)]';

function toggleSelection(value: string, current: string[]) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function stableKeyFromId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function DemoNewsletterComposerCard({
  form,
  setForm,
  selectedCampaignStatus,
  newsOptions,
  eventOptions,
  selectedNewsSlugs,
  setSelectedNewsSlugs,
  selectedEventSlugs,
  setSelectedEventSlugs,
  testEmail,
  setTestEmail,
  testFirstName,
  setTestFirstName,
  onApplyHighlights,
  onSaveDraft,
  onQueueCampaign,
  onSendTest,
  onRunDispatch,
  onStartNewDraft,
  onCancelSchedule,
  onCancelCampaign,
  onOpenSettings
}: DemoNewsletterComposerCardProps) {
  const [activeTab, setActiveTab] = useState<ComposerTab>('visual');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [visualEditorNonce, setVisualEditorNonce] = useState(0);
  const [pendingEditorToken, setPendingEditorToken] = useState<{ token: string; nonce: number } | null>(null);
  const tokenInsertNonceRef = useRef(0);

  const preview = useMemo(
    () =>
      renderNewsletterPreview({
        subject: form.subject,
        preheader: form.preheader,
        htmlBody: form.htmlBody,
        textBody: form.textBody,
        email: testEmail,
        firstName: testFirstName,
        newsOptions,
        eventOptions
      }),
    [eventOptions, form.htmlBody, form.preheader, form.subject, form.textBody, newsOptions, previewNonce, testEmail, testFirstName]
  );
  const visualValue = useMemo(() => getVisualSource(form), [form]);
  const visualEditorKey = useMemo(
    () => stableKeyFromId(form.campaignId || 'new-campaign') + visualEditorNonce * 1_000_003,
    [form.campaignId, visualEditorNonce]
  );

  const canCancelSchedule = selectedCampaignStatus === 'queued';
  const canCancelCampaign = selectedCampaignStatus === 'queued' || selectedCampaignStatus === 'sending';

  function syncFromVisual(current: DemoNewsletterFormState, visualBody: unknown[]) {
    const { htmlBody, textBody, visualBody: nextVisualBody } = deriveNewsletterSource(
      current,
      Array.isArray(visualBody) ? visualBody : []
    );
    return { ...current, visualBody: nextVisualBody, htmlBody, textBody };
  }

  function handleTabChange(value: string) {
    const nextTab = value as ComposerTab;
    setActiveTab(nextTab);
    if (nextTab === 'visual' && (!Array.isArray(form.visualBody) || !form.visualBody.length)) {
      setForm((current) => ({
        ...current,
        visualBody: visualValueFromPlainText(current.textBody || '')
      }));
      setVisualEditorNonce((nonce) => nonce + 1);
    }
  }

  function insertToken(token: string) {
    if (activeTab === 'html') {
      setForm((current) => ({ ...current, htmlBody: `${current.htmlBody}${token}`, visualBody: [] }));
      return;
    }
    if (activeTab === 'text') {
      setForm((current) => ({ ...current, textBody: `${current.textBody}${token}`, visualBody: [] }));
      return;
    }
    if (activeTab === 'preview') {
      setActiveTab('visual');
    }
    tokenInsertNonceRef.current += 1;
    setPendingEditorToken({ token, nonce: tokenInsertNonceRef.current });
  }

  return (
    <Card className="border-[var(--vd-border)] shadow-none">
      <CardHeader className="gap-4 border-b border-[var(--vd-border)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <CardTitle>Campaign composer</CardTitle>
            <CardDescription>
              Build the newsletter in visual mode, then inspect the same HTML and plain-text source the demo would deliver.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <DemoHelpTooltip content="Start a fresh campaign draft while leaving the seeded examples untouched.">
              <Button variant="outline" onClick={onStartNewDraft}>
                <RefreshCw className="h-4 w-4" />
                New draft
              </Button>
            </DemoHelpTooltip>
            <DemoHelpTooltip content="Open the same style of newsletter settings panel clients use for sender, consent, and delivery defaults.">
              <Button variant="outline" onClick={onOpenSettings}>
                <Settings2 className="h-4 w-4" />
                Settings
              </Button>
            </DemoHelpTooltip>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Campaign name">
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => {
                  const next = { ...current, name: event.target.value };
                  return Array.isArray(current.visualBody) && current.visualBody.length
                    ? syncFromVisual(next, current.visualBody)
                    : next;
                })
              }
            />
          </Field>
          <Field label="Subject line">
            <Input
              value={form.subject}
              onChange={(event) =>
                setForm((current) => {
                  const next = { ...current, subject: event.target.value };
                  return Array.isArray(current.visualBody) && current.visualBody.length
                    ? syncFromVisual(next, current.visualBody)
                    : next;
                })
              }
            />
          </Field>
          <Field label="Preheader">
            <Input
              value={form.preheader}
              onChange={(event) =>
                setForm((current) => {
                  const next = { ...current, preheader: event.target.value };
                  return Array.isArray(current.visualBody) && current.visualBody.length
                    ? syncFromVisual(next, current.visualBody)
                    : next;
                })
              }
            />
          </Field>
          <Field label="Schedule">
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
            />
          </Field>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <TabsList
              className={
                showAdvanced
                  ? 'grid w-full grid-cols-4 gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/25 p-1 sm:flex-1'
                  : 'grid w-full grid-cols-2 gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/25 p-1 sm:flex-1'
              }
            >
              <TabsTrigger value="visual" className={tabTriggerClass}>
                Editor
              </TabsTrigger>
              {showAdvanced ? (
                <TabsTrigger value="html" className={tabTriggerClass}>
                  HTML
                </TabsTrigger>
              ) : null}
              {showAdvanced ? (
                <TabsTrigger value="text" className={tabTriggerClass}>
                  Plain Text
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="preview" className={tabTriggerClass}>
                Preview
              </TabsTrigger>
            </TabsList>

            <DemoHelpTooltip content="Reveal the raw HTML and plain-text versions that are generated from the visual newsletter editor.">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextShowAdvanced = !showAdvanced;
                  if (!nextShowAdvanced && (activeTab === 'html' || activeTab === 'text')) {
                    setActiveTab('visual');
                  }
                  setShowAdvanced(nextShowAdvanced);
                }}
                className="sm:shrink-0"
              >
                {showAdvanced ? 'Hide HTML & Plain Text' : 'Show HTML & Plain Text'}
              </Button>
            </DemoHelpTooltip>
          </div>

          <TabsContent value="visual" className="space-y-4">
            <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-3 text-xs text-[var(--vd-muted-fg)]">
              <p>
                Edit in visual mode. HTML and plain-text source are regenerated automatically for the branded demo send.
              </p>
            </div>
            <DemoEmailTemplateVisualEditor
              editorKey={visualEditorKey}
              initialValue={visualValue}
              tokens={COMPOSER_TOKENS}
              insertTokenRequest={pendingEditorToken}
              onChange={(value) => {
                setForm((current) => syncFromVisual(current, value));
              }}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <DemoNewsletterPreview
              htmlBody={preview.htmlBody}
              textBody={preview.textBody}
              recipientEmail={testEmail}
              onRefresh={() => setPreviewNonce((value) => value + 1)}
            />
          </TabsContent>

          <TabsContent value="html">
            <Textarea
              value={form.htmlBody}
              onChange={(event) =>
                setForm((current) => ({ ...current, htmlBody: event.target.value, visualBody: [] }))
              }
              className="min-h-[320px] font-mono text-xs leading-6"
            />
          </TabsContent>

          <TabsContent value="text">
            <Textarea
              value={form.textBody}
              onChange={(event) =>
                setForm((current) => ({ ...current, textBody: event.target.value, visualBody: [] }))
              }
              className="min-h-[300px] font-mono text-xs leading-6"
            />
          </TabsContent>
        </Tabs>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="rounded-[1.5rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">Dynamic sections</p>
                <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">Choose which fictional stories and sessions should be injected into the email body.</p>
              </div>
              <DemoHelpTooltip content="Insert the selected demo stories and events into the newsletter body so the preview updates instantly.">
                <Button variant="outline" size="sm" onClick={onApplyHighlights}>
                  Apply selections
                </Button>
              </DemoHelpTooltip>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">News</p>
                {newsOptions.map((item) => (
                  <label key={item.slug} className="flex items-start gap-3 rounded-xl border border-[var(--vd-border)] p-3">
                    <input
                      type="checkbox"
                      checked={selectedNewsSlugs.includes(item.slug)}
                      onChange={() => setSelectedNewsSlugs(toggleSelection(item.slug, selectedNewsSlugs))}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-[var(--vd-fg)]">{item.title}</p>
                      <p className="text-sm text-[var(--vd-muted-fg)]">{item.dateLabel}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">Events</p>
                {eventOptions.map((item) => (
                  <label key={item.slug} className="flex items-start gap-3 rounded-xl border border-[var(--vd-border)] p-3">
                    <input
                      type="checkbox"
                      checked={selectedEventSlugs.includes(item.slug)}
                      onChange={() => setSelectedEventSlugs(toggleSelection(item.slug, selectedEventSlugs))}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-[var(--vd-fg)]">{item.title}</p>
                      <p className="text-sm text-[var(--vd-muted-fg)]">{item.dateLabel}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-[var(--vd-border)] shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Tokens</CardTitle>
                <CardDescription>Insert variables into the current editor or source tab.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {COMPOSER_TOKENS.map((token) => (
                  <Button
                    key={token}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertToken(token)}
                    className="font-mono text-[11px]"
                  >
                    {token}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-[var(--vd-border)] shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Test recipient</CardTitle>
                <CardDescription>The preview updates with these fictional details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Email">
                  <Input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} />
                </Field>
                <Field label="First name">
                  <Input value={testFirstName} onChange={(event) => setTestFirstName(event.target.value)} />
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DemoHelpTooltip content="Save the newsletter draft in this browser session so you can keep editing the same campaign during the walkthrough.">
            <Button onClick={onSaveDraft}>
              <MailCheck className="h-4 w-4" />
              Save draft
            </Button>
          </DemoHelpTooltip>
          <DemoHelpTooltip content="Stage the campaign for a future send. In the demo this updates the queue only and never schedules a live delivery.">
            <Button variant="outline" onClick={onQueueCampaign}>
              <Send className="h-4 w-4" />
              Queue campaign
            </Button>
          </DemoHelpTooltip>
          <DemoHelpTooltip content="Run a fake test send so prospects can see the workflow without emailing anyone.">
            <Button variant="outline" onClick={onSendTest}>
              Send test
            </Button>
          </DemoHelpTooltip>
          <DemoHelpTooltip content="Simulate the final dispatch and populate the delivery log with demo outcomes for subscribed and suppressed contacts.">
            <Button variant="outline" onClick={onRunDispatch}>
              Run dispatch
            </Button>
          </DemoHelpTooltip>
          <DemoHelpTooltip content="Remove the queued send time and put the campaign back into draft mode for this session.">
            <Button variant="outline" onClick={onCancelSchedule} disabled={!canCancelSchedule}>
              Cancel schedule
            </Button>
          </DemoHelpTooltip>
          <DemoHelpTooltip content="Mark the current demo campaign as cancelled without deleting the draft itself.">
            <Button variant="outline" onClick={onCancelCampaign} disabled={!canCancelCampaign}>
              Cancel campaign
            </Button>
          </DemoHelpTooltip>
        </div>
      </CardContent>
    </Card>
  );
}
