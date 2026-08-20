'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { AlertTriangle, Loader2, PlusCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { EmailTemplateVisualEditor } from '@/components/edit/email-template-visual-editor';
import { EventRegistrationComposerPreview } from '@/components/edit/event-registration/event-registration-composer-preview';
import {
  deriveCampaignBody,
  getVisualSource
} from '@/components/edit/event-registration/event-registration-workspace.helpers';
import { EventDateTimeField } from '@/components/edit/event-editor/event-date-time-field';
import {
  type CampaignFormState,
  type EventCampaignKind,
  type EventCampaignStatus,
  type EventWorkspaceItem
} from '@/components/edit/event-registration/event-registration-workspace.shared';
import { Field } from '@/components/edit/newsletter/newsletter-workspace-ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { visualValueFromPlainText } from '@/lib/email-template-visual';

const COMPOSER_TOKENS = [
  '{{firstName}}',
  '{{fullName}}',
  '{{email}}',
  '{{siteName}}',
  '{{appUrl}}',
  '{{logoUrl}}',
  '{{eventTitle}}',
  '{{eventDate}}',
  '{{eventLocation}}',
  '{{eventUrl}}',
  '{{joiningInstructions}}',
  '{{customMessage}}'
] as const;
const visualEditorTokens = [...COMPOSER_TOKENS];

type RenderedPreviewState = {
  toEmail: string;
  htmlBody: string;
  textBody: string;
};

type EventRegistrationComposerCardProps = {
  form: CampaignFormState;
  setForm: Dispatch<SetStateAction<CampaignFormState>>;
  selectedEvent: EventWorkspaceItem | null;
  canEditSelected: boolean;
  selectedCampaignStatus: EventCampaignStatus | null;
  isSaving: boolean;
  isQueueing: boolean;
  isSendingTest: boolean;
  isDispatching: boolean;
  queuedCampaignCount: number;
  testEmail: string;
  setTestEmail: (value: string) => void;
  testFirstName: string;
  setTestFirstName: (value: string) => void;
  onCampaignKindChange: (value: EventCampaignKind) => void;
  onSaveDraft: () => void;
  onQueueCampaign: () => void;
  onSendTest: () => void;
  onRunDispatch: () => void;
  onStartNewDraft: () => void;
  onCancelSchedule: () => void;
  onCancelCampaign: () => void;
};

type ComposerTab = 'visual' | 'preview' | 'html' | 'text';

const tabTriggerClass =
  'rounded-[calc(var(--vd-radius)-4px)] border border-[var(--vd-border)] bg-[var(--vd-card)] text-[var(--vd-muted-fg)] data-[state=active]:border-[var(--vd-ring)] data-[state=active]:bg-[var(--vd-muted)] data-[state=active]:text-[var(--vd-fg)]';

function stableKeyFromId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function EventRegistrationComposerCard({
  form,
  setForm,
  selectedEvent,
  canEditSelected,
  selectedCampaignStatus,
  isSaving,
  isQueueing,
  isSendingTest,
  isDispatching,
  queuedCampaignCount,
  testEmail,
  setTestEmail,
  testFirstName,
  setTestFirstName,
  onCampaignKindChange,
  onSaveDraft,
  onQueueCampaign,
  onSendTest,
  onRunDispatch,
  onStartNewDraft,
  onCancelSchedule,
  onCancelCampaign
}: EventRegistrationComposerCardProps) {
  const [activeTab, setActiveTab] = useState<ComposerTab>('visual');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visualEditorNonce, setVisualEditorNonce] = useState(0);
  const [pendingEditorToken, setPendingEditorToken] = useState<{ token: string; nonce: number } | null>(null);
  const tokenInsertNonceRef = useRef(0);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [renderedPreview, setRenderedPreview] = useState<RenderedPreviewState | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const previewRequestRef = useRef(0);
  const visualEditorKey = useMemo(
    () => stableKeyFromId(`${form.campaignId || 'new-event-campaign'}:${form.eventId}:${form.campaignKind}`) + visualEditorNonce * 1_000_003,
    [form.campaignId, form.campaignKind, form.eventId, visualEditorNonce]
  );

  const visualValue = useMemo(() => getVisualSource(form), [form]);
  const previewSource = useMemo(() => deriveCampaignBody(form), [form]);

  const refreshRenderedPreview = useCallback(async () => {
    if (!selectedEvent?.id) return;
    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const response = await fetch('/api/admin/event-registrations/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: selectedEvent.id,
          campaignId: form.campaignId || undefined,
          toEmail: testEmail,
          firstName: testFirstName,
          campaignKind: form.campaignKind,
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
        throw new Error(payload.error || 'Unable to render event email preview.');
      }
      setRenderedPreview({
        toEmail: payload.toEmail || testEmail,
        htmlBody: payload.htmlBody || '',
        textBody: payload.textBody || ''
      });
    } catch (error) {
      if (requestId !== previewRequestRef.current) return;
      setPreviewError(error instanceof Error ? error.message : 'Unable to render event email preview.');
    } finally {
      if (requestId === previewRequestRef.current) {
        setPreviewLoading(false);
      }
    }
  }, [
    form.campaignId,
    form.campaignKind,
    form.preheader,
    form.subject,
    previewSource.htmlBody,
    previewSource.textBody,
    selectedEvent?.id,
    testEmail,
    testFirstName
  ]);

  useEffect(() => {
    if (activeTab !== 'preview') return;
    const timeout = window.setTimeout(() => {
      void refreshRenderedPreview();
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [activeTab, refreshRenderedPreview]);

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

  function showSelectEventHint() {
    toast.message('Choose an event first.', {
      description:
        'Pick an upcoming event from the Selected event panel above. Once you do that, you can start a draft and the editor will unlock.'
    });
  }

  function syncFromVisual(current: CampaignFormState, visualBody: unknown[]) {
    const next = deriveCampaignBody(current, Array.isArray(visualBody) ? visualBody : []);
    return { ...current, visualBody: next.visualBody, htmlBody: next.htmlBody, textBody: next.textBody };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Outreach Composer</CardTitle>
        <CardDescription>
          Each event stage starts from the React Email template defaults in Email Templates. Use the Plate editor for
          normal updates, then fall back to HTML or plain text only when you need an advanced override.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedEvent ? (
          <button
            type="button"
            onClick={showSelectEventHint}
            className="w-full rounded-lg border border-dashed border-border px-4 py-6 text-left text-sm text-muted-foreground transition hover:border-[var(--vd-ring)] hover:bg-muted/20"
          >
            Choose an event that has not finished yet to manage registrations and outreach.
          </button>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Event">
            {selectedEvent ? (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {selectedEvent.title}
              </div>
            ) : (
              <button
                type="button"
                onClick={showSelectEventHint}
                className="w-full rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-[var(--vd-ring)] hover:bg-muted/30"
              >
                No event selected
              </button>
            )}
          </Field>
          <Field label="Campaign type">
            <Select
              value={form.campaignKind}
              onValueChange={(value) => onCampaignKindChange(value as EventCampaignKind)}
              disabled={!selectedEvent || !canEditSelected}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Event update</SelectItem>
                <SelectItem value="joining-instructions">Joining instructions</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

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
              placeholder="Campaign name"
              disabled={!selectedEvent || !canEditSelected}
            />
          </Field>
          <EventDateTimeField
            id="event-outreach-scheduled-send"
            label="Scheduled send"
            value={form.scheduledAt}
            onChange={(value) => setForm((current) => ({ ...current, scheduledAt: value }))}
            disabled={!selectedEvent || !canEditSelected}
            clearable
            placeholder="Send immediately when queued"
            description="Leave blank to let the queue send on the next dispatch cycle."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
              placeholder="Email subject"
              disabled={!selectedEvent || !canEditSelected}
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
              placeholder="Optional preview line"
              disabled={!selectedEvent || !canEditSelected}
            />
          </Field>
        </div>

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
                Edit in Plate mode. HTML and plain-text source are regenerated automatically for the themed React Email
                delivery wrapper.
              </p>
            </div>
            <EmailTemplateVisualEditor
              editorKey={visualEditorKey}
              initialValue={visualValue}
              tokens={visualEditorTokens}
              insertTokenRequest={pendingEditorToken}
              disabled={!selectedEvent || !canEditSelected}
              onChange={(value) => {
                setForm((current) => syncFromVisual(current, value));
              }}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-3">
            <EventRegistrationComposerPreview
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
              disabled={!selectedEvent || !canEditSelected}
            />
          </TabsContent>

          <TabsContent value="text">
            <Textarea
              value={form.textBody}
              onChange={(event) =>
                setForm((current) => ({ ...current, textBody: event.target.value, visualBody: [] }))
              }
              className="min-h-[220px] font-mono text-xs"
              disabled={!selectedEvent || !canEditSelected}
            />
          </TabsContent>
        </Tabs>

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
                disabled={!selectedEvent || !canEditSelected}
                className="font-mono text-[11px]"
              >
                {token}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border border-[var(--vd-border)] bg-[var(--vd-muted)]/15 p-4 md:grid-cols-2">
          <Field label="Test recipient email">
            <Input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="name@example.org" />
          </Field>
          <Field label="Test recipient first name">
            <Input value={testFirstName} onChange={(event) => setTestFirstName(event.target.value)} placeholder="Sam" />
          </Field>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-[var(--vd-fg)]">Campaign actions</p>
            <p className="text-xs text-[var(--vd-muted-fg)]">
              Dispatch sends every queued event campaign, not just the draft on screen.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={onStartNewDraft} disabled={!selectedEvent}>
                <PlusCircle className="h-4 w-4" />
                New draft
              </Button>
              <Button variant="outline" onClick={onSaveDraft} disabled={!selectedEvent || !canEditSelected || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save draft
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={onSendTest} disabled={!selectedEvent || isSendingTest}>
                {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send test
              </Button>
              <Button onClick={onQueueCampaign} disabled={!selectedEvent || !canEditSelected || isQueueing}>
                {isQueueing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Queue campaign
              </Button>
              <AlertDialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" disabled={isDispatching || queuedCampaignCount === 0}>
                    {isDispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Run dispatch now
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Dispatch queued event campaigns now?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately process all queued event campaigns across the site. Use it only when you are
                      ready to send to confirmed participants without waiting for the normal dispatch cycle.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setDispatchDialogOpen(false);
                        onRunDispatch();
                      }}
                    >
                      Run dispatch now
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCampaignStatus === 'queued' || selectedCampaignStatus === 'sending' ? (
              <Button variant="outline" onClick={onCancelSchedule}>
                Unschedule
              </Button>
            ) : null}
            {selectedCampaignStatus && selectedCampaignStatus !== 'completed' && selectedCampaignStatus !== 'cancelled' ? (
              <Button variant="destructive" onClick={onCancelCampaign}>
                Cancel campaign
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
