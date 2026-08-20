'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html as htmlLanguage } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import { AlertCircle, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { EmailTemplateVisualEditor } from '@/components/edit/email-template-visual-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  buildEventCampaignPreviewHtml,
  buildEventCampaignPreviewText,
  eventCampaignTemplateKeyToKind,
  isEventCampaignTemplateKey
} from '@/lib/event-registration/campaign-preview';
import {
  visualValueFromPlainText,
  visualValueToEmailHtml,
  visualValueToPlainText,
  type EmailTemplateVisualNode
} from '@/lib/email-template-visual';

export type ContactTemplateEditorStatus = {
  hasBlockingErrors: boolean;
  hasWarnings: boolean;
  customized: boolean;
  dirty: boolean;
};

type ContactTemplatesEditorProps = {
  templateKey: string;
  templateLabel: string;
  initialHtml: string;
  initialText: string;
  defaultHtml: string;
  defaultText: string;
  tokens: string[];
  requiredTokens: string[];
  previewTokenValues: Record<string, string>;
  updatedAt?: string | null;
  initialTab?: 'visual' | 'html' | 'text' | 'preview';
  onStatusChange?: (status: ContactTemplateEditorStatus) => void;
};

function toTokenLabel(token: string) {
  return token.replace(/[{}]/g, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

function toTokenDescription(token: string) {
  const key = token.replace(/[{}]/g, '');
  const explicit: Record<string, string> = {
    firstName: 'Recipient first name.',
    invitedByName: 'Name of the admin/sender.',
    roleName: 'Assigned role in the platform.',
    inviteUrl: 'Invite signup link sent to recipient.',
    verificationLink: 'Email verification URL.',
    resetLink: 'Password reset URL.',
    reviewLink: 'Review page URL.',
    appUrl: 'Base URL of this site.',
    siteName: 'Display name of the site.',
    appName: 'Display name of the app/site.',
    logoUrl: 'Absolute URL for brand logo.',
    subject: 'Email subject line token.',
    greeting: 'Greeting line near top of message.',
    permissionOne: 'Permission/benefit bullet item.',
    permissionTwo: 'Permission/benefit bullet item.',
    permissionThree: 'Permission/benefit bullet item.',
    email: 'Email address value.',
    name: 'Person full name.',
    message: 'Message body from user input.',
    sentAt: 'Timestamp string.',
    deadline: 'Deadline label string.',
    remaining: 'Relative remaining time string.'
  };
  return explicit[key] || `${toTokenLabel(token)} value.`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyTokenPreview(template: string, values: Record<string, string>, html = false) {
  return Object.entries(values).reduce((output, [token, value]) => {
    const formatted = html ? escapeHtml(value).replace(/\n/g, '<br />') : value;
    return output.split(token).join(formatted);
  }, template);
}

const editorTheme = EditorView.theme({
  '&': {
    borderRadius: 'var(--vd-radius)',
    border: '1px solid var(--vd-border)',
    backgroundColor: 'var(--vd-card)'
  },
  '.cm-content': {
    fontFamily: 'var(--vd-font-mono)',
    fontSize: '12px',
    lineHeight: '1.5'
  },
  '.cm-gutters': {
    borderRight: '1px solid var(--vd-border)',
    backgroundColor: 'var(--vd-muted)',
    color: 'var(--vd-muted-fg)'
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in oklch, var(--vd-muted) 65%, transparent)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'color-mix(in oklch, var(--vd-muted) 80%, transparent)'
  },
  '&.cm-editor.cm-focused': {
    outline: '1px solid var(--vd-ring)'
  }
});

const tabTriggerClass =
  'rounded-[calc(var(--vd-radius)-4px)] border border-[var(--vd-border)] bg-[var(--vd-card)] text-[var(--vd-muted-fg)] data-[state=active]:border-[var(--vd-ring)] data-[state=active]:bg-[var(--vd-muted)] data-[state=active]:text-[var(--vd-fg)]';

export function ContactTemplatesEditor({
  templateKey,
  templateLabel,
  initialHtml,
  initialText,
  defaultHtml,
  defaultText,
  tokens,
  requiredTokens,
  previewTokenValues,
  updatedAt,
  initialTab = 'visual',
  onStatusChange
}: ContactTemplatesEditorProps) {
  const [html, setHtml] = useState(initialHtml);
  const [text, setText] = useState(initialText);
  const [savedHtml, setSavedHtml] = useState(initialHtml);
  const [savedText, setSavedText] = useState(initialText);
  const [visualValue, setVisualValue] = useState<EmailTemplateVisualNode[]>(() => visualValueFromPlainText(initialText));
  const [visualEditorKey, setVisualEditorKey] = useState(0);
  const [pendingEditorToken, setPendingEditorToken] = useState<{ token: string; nonce: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(updatedAt ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'html' | 'text' | 'preview'>(initialTab);
  const [showAdvanced, setShowAdvanced] = useState(initialTab === 'html' || initialTab === 'text');
  const statusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    statusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!showAdvanced && (activeTab === 'html' || activeTab === 'text')) {
      setActiveTab('visual');
    }
  }, [activeTab, showAdvanced]);

  const handleReset = () => {
    if (!window.confirm(`Reset "${templateLabel}" back to the system default content?`)) return;
    setHtml(defaultHtml);
    setText(defaultText);
    setVisualValue(visualValueFromPlainText(defaultText));
    setVisualEditorKey((value) => value + 1);
    setSuccess('');
    setError('');
  };

  const handleLoadVisualFromText = () => {
    setVisualValue(visualValueFromPlainText(text));
    setVisualEditorKey((value) => value + 1);
    setSuccess('Editor loaded from plain-text source.');
    setError('');
  };

  const handleApplyVisualToSource = () => {
    const nextText = visualValueToPlainText(visualValue);
    let nextHtml = visualValueToEmailHtml({
      value: visualValue,
      heading: `${templateLabel} Email`,
      previewText: nextText,
      siteNameToken: '{{siteName}}',
      appUrlToken: '{{appUrl}}',
      logoUrlToken: '{{logoUrl}}'
    });
    const unresolved = requiredTokens.filter(
      (token) => !nextHtml.includes(token) && !nextText.includes(token)
    );
    if (unresolved.length) {
      nextHtml += `\n<!-- required-tokens ${unresolved.join(' ')} -->`;
    }

    setText(nextText);
    setHtml(nextHtml);
    setSuccess('Editor content applied to HTML and plain-text source.');
    setError('');
    setActiveTab('preview');
  };

  const handleTokenClick = (token: string) => {
    if (activeTab === 'html') {
      setHtml((value) => `${value}${token}`);
      return;
    }
    if (activeTab === 'text') {
      setText((value) => `${value}${token}`);
      return;
    }

    setActiveTab('visual');
    setPendingEditorToken({ token, nonce: Date.now() });
    setSuccess(`${token} inserted in editor.`);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/email/templates/${encodeURIComponent(templateKey)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html, text })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Unable to save templates.');
      }
      setLastUpdated(payload?.updatedAt || null);
      setSavedHtml(html);
      setSavedText(text);
      setSuccess(`${templateLabel} template updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save templates.');
    } finally {
      setSaving(false);
    }
  };

  const updatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleString() : null;
  const previewHtml = useMemo(() => {
    if (isEventCampaignTemplateKey(templateKey)) {
      return buildEventCampaignPreviewHtml({
        campaignKind: eventCampaignTemplateKeyToKind(templateKey),
        subject: previewTokenValues['{{subject}}'] || templateLabel,
        preheader: previewTokenValues['{{preheader}}'] || '',
        htmlBody: html,
        values: previewTokenValues
      });
    }
    return applyTokenPreview(html, previewTokenValues, true);
  }, [html, previewTokenValues, templateKey, templateLabel]);
  const previewText = useMemo(() => {
    if (isEventCampaignTemplateKey(templateKey)) {
      return buildEventCampaignPreviewText({
        textBody: text,
        values: previewTokenValues
      });
    }
    return applyTokenPreview(text, previewTokenValues, false);
  }, [previewTokenValues, templateKey, text]);
  const htmlMissing = useMemo(
    () => requiredTokens.filter((token) => !html.includes(token)),
    [html, requiredTokens]
  );
  const textMissing = useMemo(
    () => requiredTokens.filter((token) => !text.includes(token)),
    [requiredTokens, text]
  );
  const unresolvedMissingTokens = useMemo(
    () => requiredTokens.filter((token) => !html.includes(token) && !text.includes(token)),
    [html, requiredTokens, text]
  );
  const hasMissingRequiredTokens = unresolvedMissingTokens.length > 0;
  const visualPlainText = useMemo(() => visualValueToPlainText(visualValue), [visualValue]);
  const visualTokensInUse = useMemo(
    () => tokens.filter((token) => visualPlainText.includes(token)),
    [tokens, visualPlainText]
  );
  const tokenUsageAudit = useMemo(
    () =>
      tokens.map((token) => ({
        token,
        required: requiredTokens.includes(token),
        inEditor: visualTokensInUse.includes(token),
        inHtml: html.includes(token),
        inText: text.includes(token)
      })),
    [html, requiredTokens, text, tokens, visualTokensInUse]
  );
  const isDirty = html !== savedHtml || text !== savedText;
  const isCustomized = html !== defaultHtml || text !== defaultText;
  const hasWarnings = unresolvedMissingTokens.length > 0 || htmlMissing.length > 0 || textMissing.length > 0;

  useEffect(() => {
    statusChangeRef.current?.({
      hasBlockingErrors: unresolvedMissingTokens.length > 0,
      hasWarnings,
      customized: isCustomized,
      dirty: isDirty
    });
  }, [hasWarnings, isCustomized, isDirty, unresolvedMissingTokens.length]);

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/30 p-3 text-xs text-[var(--vd-muted-fg)]">
        <div className="font-bold uppercase tracking-[0.2em] text-[var(--vd-fg)]">Available tokens</div>
        <p className="mt-1 text-[11px]">Click a token to insert it. Hover for description and sample value.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tokens.map((token) => (
            <Tooltip key={token}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleTokenClick(token)}
                  className="cursor-pointer rounded-full border border-[var(--vd-border)] bg-[var(--vd-card)] px-2 py-0.5 font-mono text-[10px] transition hover:border-[var(--vd-ring)] hover:bg-[var(--vd-muted)]"
                  aria-label={`Insert ${token}`}
                >
                  {token}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] leading-5">
                <p className="font-mono text-[11px]">{token}</p>
                <p className="mt-1">{toTokenDescription(token)}</p>
                <p className="mt-1 text-[11px] opacity-90">Sample: {previewTokenValues[token] || '(not set)'}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {requiredTokens.length ? (
        <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-3 text-xs text-[var(--vd-muted-fg)]">
          <p className="font-semibold text-[var(--vd-fg)]">Required tokens</p>
          <p className="mt-1">{requiredTokens.join(', ')}</p>
        </div>
      ) : null}

      {unresolvedMissingTokens.length ? (
        <div className="rounded-[var(--vd-radius)] border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            Required tokens missing in both HTML and plain text
          </p>
          <p className="mt-1">{unresolvedMissingTokens.join(', ')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setActiveTab('html')}>
              Open HTML
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setActiveTab('text')}>
              Open plain text
            </Button>
          </div>
        </div>
      ) : null}

      {!unresolvedMissingTokens.length && (htmlMissing.length || textMissing.length) ? (
        <div className="rounded-[var(--vd-radius)] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Token warnings
          </p>
          {htmlMissing.length ? <p className="mt-1">Missing in HTML source: {htmlMissing.join(', ')}</p> : null}
          {textMissing.length ? <p className="mt-1">Missing in plain-text source: {textMissing.join(', ')}</p> : null}
        </div>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'visual' | 'html' | 'text' | 'preview')}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <TabsList
            className={
              showAdvanced
                ? 'grid w-full grid-cols-4 gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/25 p-1 sm:flex-1'
                : 'grid w-full grid-cols-2 gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/25 p-1 sm:flex-1'
            }
          >
            <TabsTrigger
              value="visual"
              className={tabTriggerClass}
            >
              Editor
            </TabsTrigger>
            {showAdvanced ? (
              <TabsTrigger
                value="html"
                className={tabTriggerClass}
              >
                HTML
              </TabsTrigger>
            ) : null}
            {showAdvanced ? (
              <TabsTrigger
                value="text"
                className={tabTriggerClass}
              >
                Plain text
              </TabsTrigger>
            ) : null}
            <TabsTrigger
              value="preview"
              className={tabTriggerClass}
            >
              Preview
            </TabsTrigger>
          </TabsList>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced((value) => !value)}
            disabled={saving}
            className="sm:shrink-0"
          >
            {showAdvanced ? 'Hide HTML & Plain Text' : 'Show HTML & Plain Text'}
          </Button>
        </div>
        <TabsContent value="visual" className="space-y-3">
          <div className="flex flex-col gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-3 text-xs text-[var(--vd-muted-fg)] md:flex-row md:items-center md:justify-between">
            <p>
              Compose body content in Plate editor mode. Applying generates HTML and plain text, then wraps HTML with
              the branded shell (logo/header/footer) using
              <span className="mx-1 font-mono">{'{{siteName}}'}</span>,
              <span className="mx-1 font-mono">{'{{appUrl}}'}</span>, and
              <span className="mx-1 font-mono">{'{{logoUrl}}'}</span>.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleLoadVisualFromText} disabled={saving}>
                Load from plain text
              </Button>
              <Button type="button" size="sm" onClick={handleApplyVisualToSource} disabled={saving}>
                Apply to source
              </Button>
            </div>
          </div>
          <EmailTemplateVisualEditor
            editorKey={visualEditorKey}
            initialValue={visualValue}
            tokens={tokens}
            insertTokenRequest={pendingEditorToken}
            disabled={saving}
            onChange={setVisualValue}
          />
          <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-3">
            <p className="text-xs font-semibold text-[var(--vd-fg)]">Token Usage Audit</p>
            <p className="mt-1 text-[11px] text-[var(--vd-muted-fg)]">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> used in editor</span>
              <span className="mx-2 inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> missing required</span>
              <span className="inline-flex items-center gap-1"><Circle className="h-3.5 w-3.5 text-[var(--vd-muted-fg)]" /> not used</span>
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {tokenUsageAudit.map((entry) => {
                const missingRequired = entry.required && !entry.inEditor && !entry.inHtml && !entry.inText;
                return (
                  <div
                    key={entry.token}
                    className="flex items-center justify-between rounded-md border border-[var(--vd-border)] bg-[var(--vd-muted)]/15 px-2 py-1"
                  >
                    <span className="font-mono text-[11px]">{entry.token}</span>
                    {missingRequired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Missing
                      </span>
                    ) : entry.inEditor ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Used
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--vd-muted-fg)]">
                        <Circle className="h-3.5 w-3.5" />
                        Not used
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="html" className="space-y-2">
          <CodeMirror
            value={html}
            height="360px"
            editable={!saving}
            extensions={[htmlLanguage(), editorTheme, EditorView.lineWrapping]}
            onChange={(value) => setHtml(value)}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              autocompletion: true
            }}
          />
        </TabsContent>
        <TabsContent value="text" className="space-y-2">
          <CodeMirror
            value={text}
            height="360px"
            editable={!saving}
            extensions={[editorTheme, EditorView.lineWrapping]}
            onChange={(value) => setText(value)}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true
            }}
          />
        </TabsContent>
        <TabsContent value="preview" className="space-y-4">
          <p className="text-xs text-[var(--vd-muted-fg)]">Preview uses sample token values.</p>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]">
              <p className="border-b border-[var(--vd-border)] px-3 py-2 text-xs font-semibold text-[var(--vd-fg)]">
                HTML preview
              </p>
              <iframe
                title="Email HTML preview"
                srcDoc={previewHtml}
                className="h-[420px] w-full bg-white"
              />
            </div>
            <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]">
              <p className="border-b border-[var(--vd-border)] px-3 py-2 text-xs font-semibold text-[var(--vd-fg)]">
                Plain-text preview
              </p>
              <pre className="h-[420px] overflow-auto whitespace-pre-wrap p-3 text-xs text-[var(--vd-fg)]">{previewText}</pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {updatedLabel ? (
        <p className="text-xs text-[var(--vd-muted-fg)]">Last updated {updatedLabel}</p>
      ) : null}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      {success ? <p className="text-xs text-[var(--vd-primary)]">{success}</p> : null}

      <div className="sticky bottom-2 z-10 flex flex-col gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]/95 p-2 backdrop-blur sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <Button type="button" variant="destructive" onClick={handleReset} disabled={saving}>
            Reset to default
          </Button>
        </div>
        <Button type="button" onClick={handleSave} disabled={saving || hasMissingRequiredTokens}>
          {saving ? 'Saving…' : 'Save template'}
        </Button>
      </div>
    </div>
  );
}
