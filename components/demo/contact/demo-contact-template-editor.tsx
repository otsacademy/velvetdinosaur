'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Circle, RotateCcw, Save, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import type { DemoEmailTemplate } from '@/lib/demo-email-templates-seed';

export type DemoContactTemplateRecord = DemoEmailTemplate & {
  html: string;
  text: string;
  savedHtml: string;
  savedText: string;
};

type ContactTemplateEditorStatus = {
  hasBlockingErrors: boolean;
  hasWarnings: boolean;
  customized: boolean;
  dirty: boolean;
  unresolvedMissingTokens: string[];
  htmlMissing: string[];
  textMissing: string[];
};

type DemoContactTemplateEditorProps = {
  template: DemoContactTemplateRecord;
  onChange: (next: DemoContactTemplateRecord) => void;
};

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

export function getContactTemplateStatus(template: DemoContactTemplateRecord): ContactTemplateEditorStatus {
  const unresolvedMissingTokens = template.requiredTokens.filter(
    (token) => !template.html.includes(token) && !template.text.includes(token)
  );
  const htmlMissing = template.requiredTokens.filter((token) => !template.html.includes(token));
  const textMissing = template.requiredTokens.filter((token) => !template.text.includes(token));

  return {
    hasBlockingErrors: unresolvedMissingTokens.length > 0,
    hasWarnings: unresolvedMissingTokens.length > 0 || htmlMissing.length > 0 || textMissing.length > 0,
    customized: template.html !== template.defaultHtml || template.text !== template.defaultText,
    dirty: template.html !== template.savedHtml || template.text !== template.savedText,
    unresolvedMissingTokens,
    htmlMissing,
    textMissing
  };
}

function toTokenLabel(token: string) {
  return token.replace(/[{}]/g, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

function formatUpdatedAt(value: string | null) {
  if (!value) return 'Not yet saved in this demo session';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet saved in this demo session';
  return `Last changed ${date.toLocaleString()}`;
}

function StatusRow({ status }: { status: ContactTemplateEditorStatus }) {
  if (!status.hasWarnings) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4 text-sm text-emerald-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">All required tokens are present.</p>
          <p>The preview and source tabs include every token needed for this template.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-800">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            {status.hasBlockingErrors ? 'One or more required tokens are missing completely.' : 'Some required tokens are missing in one source tab.'}
          </p>
          <p>Use the token buttons to insert the missing placeholders before you save this demo draft.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Missing everywhere</p>
          <p className="mt-2 text-xs leading-5">
            {status.unresolvedMissingTokens.length ? status.unresolvedMissingTokens.join(', ') : 'None'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Missing in HTML</p>
          <p className="mt-2 text-xs leading-5">{status.htmlMissing.length ? status.htmlMissing.join(', ') : 'None'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Missing in text</p>
          <p className="mt-2 text-xs leading-5">{status.textMissing.length ? status.textMissing.join(', ') : 'None'}</p>
        </div>
      </div>
    </div>
  );
}

export function DemoContactTemplateEditor({ template, onChange }: DemoContactTemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'text'>('preview');

  const status = useMemo(() => getContactTemplateStatus(template), [template]);
  const previewHtml = useMemo(() => applyTokenPreview(template.html, template.sampleValues, true), [template]);
  const previewText = useMemo(() => applyTokenPreview(template.text, template.sampleValues, false), [template]);

  function updateTemplate(patch: Partial<DemoContactTemplateRecord>) {
    onChange({ ...template, ...patch });
  }

  function insertToken(token: string) {
    if (activeTab === 'text') {
      updateTemplate({ text: `${template.text}${template.text.endsWith('\n') ? '' : '\n'}${token}` });
      return;
    }

    updateTemplate({ html: `${template.html}${token}` });
    if (activeTab === 'preview') {
      setActiveTab('html');
    }
  }

  function restoreSavedVersion() {
    updateTemplate({ html: template.savedHtml, text: template.savedText });
    toast.info('The saved demo draft has been restored.');
  }

  function resetToDefault() {
    updateTemplate({ html: template.defaultHtml, text: template.defaultText });
    toast.info('The system default has been loaded into this demonstration tab.');
  }

  function saveDraft() {
    const nextUpdatedAt = new Date().toISOString();
    updateTemplate({
      savedHtml: template.html,
      savedText: template.text,
      updatedAt: nextUpdatedAt
    });
    toast.info('This is a demonstration workspace, so template changes are not saved permanently.');
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card className="border-[var(--vd-border)] shadow-none">
        <CardHeader className="gap-4 border-b border-[var(--vd-border)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{template.label}</CardTitle>
                {status.hasBlockingErrors ? (
                  <Badge variant="destructive">Needs attention</Badge>
                ) : status.dirty ? (
                  <Badge variant="outline">Unsaved changes</Badge>
                ) : status.customized ? (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Customised</Badge>
                ) : (
                  <Badge variant="secondary">Default</Badge>
                )}
              </div>
              <CardDescription className="max-w-3xl text-sm leading-6">{template.description}</CardDescription>
              <p className="text-xs text-[var(--vd-muted-fg)]">{formatUpdatedAt(template.updatedAt)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <DemoHelpTooltip content="Revert the current editor back to the last demo save so you can compare a clean and edited version.">
                <Button variant="outline" onClick={restoreSavedVersion} disabled={!status.dirty}>
                  <Undo2 className="h-4 w-4" />
                  Restore saved
                </Button>
              </DemoHelpTooltip>
              <DemoHelpTooltip content="Load the original system template copy and structure back into this demo tab.">
                <Button variant="outline" onClick={resetToDefault}>
                  <RotateCcw className="h-4 w-4" />
                  Reset to default
                </Button>
              </DemoHelpTooltip>
              <DemoHelpTooltip content="Save the edited HTML and plain-text sources for this browser session only. No real system emails are changed.">
                <Button onClick={saveDraft}>
                  <Save className="h-4 w-4" />
                  Save changes
                </Button>
              </DemoHelpTooltip>
            </div>
          </div>

          <StatusRow status={status} />
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'html' | 'text')} className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl border border-[var(--vd-border)] bg-[var(--vd-muted)]/50 p-1">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Plain text</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="overflow-hidden rounded-[1.5rem] border border-[var(--vd-border)] bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">Rendered email preview</p>
                    <p className="mt-1 text-xs text-slate-500">Sample token values are applied automatically in this panel.</p>
                  </div>
                  <div className="p-5">
                    <div
                      className="prose prose-sm max-w-none text-slate-800"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--vd-muted-fg)]">Plain-text preview</p>
                  <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--vd-fg)]">{previewText}</pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="html">
              <Textarea
                rows={18}
                value={template.html}
                onChange={(event) => updateTemplate({ html: event.target.value })}
                className="font-mono text-xs leading-6"
              />
            </TabsContent>

            <TabsContent value="text">
              <Textarea
                rows={18}
                value={template.text}
                onChange={(event) => updateTemplate({ text: event.target.value })}
                className="font-mono text-xs leading-6"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Available tokens</CardTitle>
            <CardDescription>Click a token to insert it into the current source tab.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {template.tokens.map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => insertToken(token)}
                className="flex w-full items-center justify-between rounded-2xl border border-[var(--vd-border)] bg-[var(--vd-bg)] px-3 py-2 text-left transition-colors hover:border-[var(--vd-ring)] hover:bg-[var(--vd-muted)]/60"
              >
                <span className="font-mono text-xs text-[var(--vd-fg)]">{token}</span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">{toTokenLabel(token)}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Sample values</CardTitle>
            <CardDescription>These values are injected into the preview so prospects can see the email in context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(template.sampleValues).map(([token, value]) => (
              <div key={token} className="rounded-2xl border border-[var(--vd-border)] bg-[var(--vd-bg)] p-3">
                <p className="font-mono text-[11px] text-[var(--vd-muted-fg)]">{token}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--vd-fg)]">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
            <CardDescription>The same template can sit in default, customised, unsaved, or warning states.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--vd-muted-fg)]">
            <div className="flex items-center gap-3">
              <Circle className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>Unsaved changes in the current demo session</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Customised from the system default</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Required tokens need attention before the template is considered complete</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
