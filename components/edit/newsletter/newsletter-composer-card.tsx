'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { NewsletterComposerPreview } from '@/components/edit/newsletter/newsletter-composer-preview';
import {
  NewsletterHighlightPicker,
  type NewsletterContentOptionItem
} from '@/components/edit/newsletter/newsletter-highlight-picker';
import { EmailTemplateVisualEditor } from '@/components/edit/email-template-visual-editor';
import { Field } from '@/components/edit/newsletter/newsletter-workspace-ui';
import {
  type CampaignFormState,
  type CampaignStatus
} from '@/components/edit/newsletter/newsletter-workspace.shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ensureVisualValue,
  visualValueFromPlainText,
  visualValueToEmailHtml,
  visualValueToPlainText
} from '@/lib/email-template-visual';

const COMPOSER_TOKENS = [
  '{{firstName}}',
  '{{email}}',
  '{{siteName}}',
  '{{appUrl}}',
  '{{subject}}',
  '{{preheader}}',
  '{{unsubscribeUrl}}',
  '{{newsHighlights}}',
  '{{eventHighlights}}'
];

type RenderedPreviewState = {
  toEmail: string;
  htmlBody: string;
  textBody: string;
};

type NewsletterComposerCardProps = {
  form: CampaignFormState;
  setForm: Dispatch<SetStateAction<CampaignFormState>>;
  canEditSelected: boolean;
  selectedCampaignStatus: CampaignStatus | null;
  isSaving: boolean;
  isQueueing: boolean;
  isSendingTest: boolean;
  isDispatching: boolean;
  testEmail: string;
  setTestEmail: (value: string) => void;
  testFirstName: string;
  setTestFirstName: (value: string) => void;
  onSaveDraft: () => void;
  onQueueCampaign: () => void;
  onSendTest: () => void;
  onRunDispatch: () => void;
  onStartNewDraft: () => void;
  onCancelSchedule: () => void;
  onCancelCampaign: () => void;
};

type ComposerTab = 'visual' | 'preview' | 'html' | 'text';
type HighlightDirectiveType = 'newsHighlights' | 'eventHighlights';

const tabTriggerClass =
  'rounded-[calc(var(--vd-radius)-4px)] border border-[var(--vd-border)] bg-[var(--vd-card)] text-[var(--vd-muted-fg)] data-[state=active]:border-[var(--vd-ring)] data-[state=active]:bg-[var(--vd-muted)] data-[state=active]:text-[var(--vd-fg)]';
function normalizeOptionItems(input: unknown): NewsletterContentOptionItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as { slug?: unknown; title?: unknown; dateLabel?: unknown };
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      const dateLabel = typeof row.dateLabel === 'string' ? row.dateLabel.trim() : '';
      if (!slug || !title) return null;
      return { slug, title, dateLabel };
    })
    .filter((item): item is NewsletterContentOptionItem => Boolean(item));
}

function buildHighlightDirective(type: HighlightDirectiveType, slugs: string[]) {
  return slugs.length ? `{{${type}:${slugs.join(',')}}}` : `{{${type}}}`;
}

function getVisualSource(form: CampaignFormState) {
  if (Array.isArray(form.visualBody) && form.visualBody.length) {
    return ensureVisualValue(form.visualBody);
  }
  return visualValueFromPlainText(form.textBody || '');
}

function deriveComposerSource(form: CampaignFormState, visualOverride?: unknown[]) {
  const hasVisualSource = Array.isArray(visualOverride) ? visualOverride.length > 0 : Array.isArray(form.visualBody) && form.visualBody.length > 0;
  const visualBody = hasVisualSource
    ? ensureVisualValue(Array.isArray(visualOverride) ? visualOverride : form.visualBody)
    : visualValueFromPlainText(form.textBody || '');
  const textBody = hasVisualSource ? visualValueToPlainText(visualBody) : form.textBody || '';
  const htmlBody = hasVisualSource
    ? visualValueToEmailHtml({
        value: visualBody,
        heading: (form.subject || form.name || 'Newsletter update').trim(),
        previewText: form.preheader || textBody,
        siteNameToken: '{{siteName}}',
        appUrlToken: '{{appUrl}}',
        logoUrlToken: '{{logoUrl}}'
      })
    : form.htmlBody || '';

  return { htmlBody, textBody, visualBody };
}

function stableKeyFromId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function NewsletterComposerCard({
  form,
  setForm,
  canEditSelected,
  selectedCampaignStatus,
  isSaving,
  isQueueing,
  isSendingTest,
  isDispatching,
  testEmail,
  setTestEmail,
  testFirstName,
  setTestFirstName,
  onSaveDraft,
  onQueueCampaign,
  onSendTest,
  onRunDispatch,
  onStartNewDraft,
  onCancelSchedule,
  onCancelCampaign
}: NewsletterComposerCardProps) {
  const [activeTab, setActiveTab] = useState<ComposerTab>('visual');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visualEditorNonce, setVisualEditorNonce] = useState(0);
  const [pendingEditorToken, setPendingEditorToken] = useState<{ token: string; nonce: number } | null>(null);
  const tokenInsertNonceRef = useRef(0);
  const [contentOptionsLoading, setContentOptionsLoading] = useState(true);
  const [contentOptionsError, setContentOptionsError] = useState('');
  const [newsOptions, setNewsOptions] = useState<NewsletterContentOptionItem[]>([]);
  const [eventOptions, setEventOptions] = useState<NewsletterContentOptionItem[]>([]);
  const [selectedNewsSlugs, setSelectedNewsSlugs] = useState<string[]>([]);
  const [selectedEventSlugs, setSelectedEventSlugs] = useState<string[]>([]);
  const [renderedPreview, setRenderedPreview] = useState<RenderedPreviewState | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const previewRequestRef = useRef(0);
  const visualEditorKey = useMemo(
    () => stableKeyFromId(form.campaignId || 'new-campaign') + visualEditorNonce * 1_000_003,
    [form.campaignId, visualEditorNonce]
  );

  const visualValue = useMemo(() => getVisualSource(form), [form]);
  const previewSource = useMemo(() => deriveComposerSource(form), [form]);

  const refreshRenderedPreview = useCallback(async () => {
    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const response = await fetch('/api/admin/newsletter/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          toEmail: testEmail,
          firstName: testFirstName,
          campaignId: form.campaignId || undefined,
          subject: form.subject,
          preheader: form.preheader,
          htmlBody: previewSource.htmlBody,
          textBody: previewSource.textBody
        })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        toEmail?: string;
        htmlBody?: string;
        textBody?: string;
        error?: string;
      };
      if (requestId !== previewRequestRef.current) return;
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to render newsletter preview.');
      }
      setRenderedPreview({
        toEmail: payload.toEmail || testEmail,
        htmlBody: payload.htmlBody || '',
        textBody: payload.textBody || ''
      });
    } catch (error) {
      if (requestId !== previewRequestRef.current) return;
      setPreviewError(error instanceof Error ? error.message : 'Unable to render newsletter preview.');
    } finally {
      if (requestId === previewRequestRef.current) {
        setPreviewLoading(false);
      }
    }
  }, [
    form.campaignId,
    form.preheader,
    form.subject,
    previewSource.htmlBody,
    previewSource.textBody,
    testEmail,
    testFirstName
  ]);

  useEffect(() => {
    let active = true;
    void fetch('/api/admin/newsletter/content-options', { cache: 'no-store', credentials: 'include' })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          news?: unknown;
          events?: unknown;
          error?: string;
        };
        if (!active) return;
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load news and event content options.');
        }
        setNewsOptions(normalizeOptionItems(payload.news));
        setEventOptions(normalizeOptionItems(payload.events));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setContentOptionsError(error instanceof Error ? error.message : 'Unable to load content options.');
      })
      .finally(() => {
        if (!active) return;
        setContentOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'preview') return;
    const timeout = window.setTimeout(() => {
      void refreshRenderedPreview();
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [activeTab, refreshRenderedPreview]);

  function toggleSlug(slug: string, setSelected: Dispatch<SetStateAction<string[]>>) {
    setSelected((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  }

  function clearTargetedSelections() {
    setSelectedNewsSlugs([]); setSelectedEventSlugs([]);
  }

  function handleTabChange(value: string) {
    const nextTab = value as ComposerTab;
    setActiveTab(nextTab);
    if (nextTab === 'visual' && (!Array.isArray(form.visualBody) || !form.visualBody.length)) {
      setForm((current) => ({ ...current, visualBody: visualValueFromPlainText(current.textBody || '') }));
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

  function syncFromVisual(current: CampaignFormState, visualBody: unknown[]) {
    const { htmlBody, textBody, visualBody: nextVisualBody } = deriveComposerSource(current, Array.isArray(visualBody) ? visualBody : []);
    return { ...current, visualBody: nextVisualBody, htmlBody, textBody };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsletter Composer</CardTitle>
        <CardDescription>
          Dynamic sections are supported in HTML/Text body: {'{{newsHighlights}}'}, {'{{eventHighlights}}'}, or
          slug-targeted {'{{newsHighlights:slug-a,slug-b}}'}. Dispatch targets all registered users except explicitly
          unsubscribed recipients. Preview renders the same final delivery output used for sends.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
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
              disabled={!canEditSelected}
            />
          </Field>
          <Field label="Subject">
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
              disabled={!canEditSelected}
            />
          </Field>
        </div>
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
            disabled={!canEditSelected}
          />
        </Field>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
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
          </div>

          <TabsContent value="visual" className="space-y-3">
            <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-3 text-xs text-[var(--vd-muted-fg)]">
              <p>
                Edit in Plate mode. HTML and plain-text source are regenerated automatically for delivery.
              </p>
            </div>
            <EmailTemplateVisualEditor
              editorKey={visualEditorKey}
              initialValue={visualValue}
              tokens={COMPOSER_TOKENS}
              insertTokenRequest={pendingEditorToken}
              disabled={!canEditSelected}
              onChange={(value) => {
                setForm((current) => syncFromVisual(current, value));
              }}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-3">
            <NewsletterComposerPreview
              htmlBody={renderedPreview?.htmlBody || ''}
              textBody={renderedPreview?.textBody || ''}
              recipientEmail={renderedPreview?.toEmail || testEmail}
              loading={previewLoading}
              error={previewError}
              onRefresh={() => {
                void refreshRenderedPreview();
              }}
            />
          </TabsContent>

          <TabsContent value="html">
            <Textarea
              value={form.htmlBody}
              onChange={(event) =>
                setForm((current) => ({ ...current, htmlBody: event.target.value, visualBody: [] }))
              }
              className="min-h-[260px] font-mono text-xs"
              disabled={!canEditSelected}
            />
          </TabsContent>

          <TabsContent value="text">
            <Textarea
              value={form.textBody}
              onChange={(event) =>
                setForm((current) => ({ ...current, textBody: event.target.value, visualBody: [] }))
              }
              className="min-h-[220px] font-mono text-xs"
              disabled={!canEditSelected}
            />
          </TabsContent>
        </Tabs>

        <NewsletterHighlightPicker
          canEditSelected={canEditSelected}
          contentOptionsLoading={contentOptionsLoading}
          contentOptionsError={contentOptionsError}
          newsOptions={newsOptions}
          eventOptions={eventOptions}
          selectedNewsSlugs={selectedNewsSlugs}
          selectedEventSlugs={selectedEventSlugs}
          onToggleNewsSlug={(slug) => toggleSlug(slug, setSelectedNewsSlugs)}
          onToggleEventSlug={(slug) => toggleSlug(slug, setSelectedEventSlugs)}
          onClearSelections={clearTargetedSelections}
          onInsertDirective={(type, slugs) => insertToken(buildHighlightDirective(type, slugs))}
          onInsertLatestNews={() => insertToken('{{newsHighlights}}')}
          onInsertLatestEvents={() => insertToken('{{eventHighlights}}')}
        />

        <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">Tokens</p>
          <div className="flex flex-wrap gap-2">
            {COMPOSER_TOKENS.map((token) => (
              <Button
                key={token}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertToken(token)}
                disabled={!canEditSelected}
                className="font-mono text-[11px]"
              >
                {token}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Schedule (optional)">
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
              disabled={!canEditSelected}
            />
          </Field>
          <Field label="Test email">
            <Input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} />
          </Field>
          <Field label="Test first name">
            <Input value={testFirstName} onChange={(event) => setTestFirstName(event.target.value)} placeholder="Sam" />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onSaveDraft} disabled={isSaving || !canEditSelected}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button variant="secondary" onClick={onQueueCampaign} disabled={isQueueing || !form.campaignId}>
            {isQueueing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Queue campaign
          </Button>
          <Button variant="outline" onClick={onSendTest} disabled={isSendingTest}>
            {isSendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send test
          </Button>
          <Button variant="outline" onClick={onRunDispatch} disabled={isDispatching}>
            {isDispatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Run dispatch (send queued)
          </Button>
          <Button variant="ghost" onClick={onStartNewDraft}>
            New draft
          </Button>
          {form.campaignId && selectedCampaignStatus === 'queued' ? (
            <Button variant="ghost" onClick={onCancelSchedule} disabled={isQueueing}>
              Cancel schedule
            </Button>
          ) : null}
          {form.campaignId && selectedCampaignStatus !== 'queued' ? (
            <Button
              variant="ghost"
              onClick={onCancelCampaign}
              disabled={isQueueing || selectedCampaignStatus === 'completed'}
            >
              Cancel campaign
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
