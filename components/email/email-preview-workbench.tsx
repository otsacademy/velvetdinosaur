'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ContactTemplatesEditor,
  type ContactTemplateEditorStatus
} from '@/components/edit/contact-templates-editor';

type EmailPreviewTemplate = {
  key: string;
  label: string;
  description: string;
  tokens: string[];
  requiredTokens: string[];
  sampleValues: Record<string, string>;
  initialHtml: string;
  initialText: string;
  defaultHtml: string;
  defaultText: string;
  updatedAt: string | null;
};

type EmailPreviewWorkbenchProps = {
  templates: EmailPreviewTemplate[];
};

function computeInitialStatus(template: EmailPreviewTemplate): ContactTemplateEditorStatus {
  const unresolvedMissingTokens = template.requiredTokens.filter(
    (token) => !template.initialHtml.includes(token) && !template.initialText.includes(token)
  );
  const htmlMissing = template.requiredTokens.filter((token) => !template.initialHtml.includes(token));
  const textMissing = template.requiredTokens.filter((token) => !template.initialText.includes(token));
  return {
    hasBlockingErrors: unresolvedMissingTokens.length > 0,
    hasWarnings: unresolvedMissingTokens.length > 0 || htmlMissing.length > 0 || textMissing.length > 0,
    customized: template.initialHtml !== template.defaultHtml || template.initialText !== template.defaultText,
    dirty: false
  };
}

export function EmailPreviewWorkbench({ templates }: EmailPreviewWorkbenchProps) {
  const firstTemplate = templates[0]?.key ?? 'invite';
  const [selected, setSelected] = useState(firstTemplate);
  const [statusByKey, setStatusByKey] = useState<Record<string, ContactTemplateEditorStatus>>(() =>
    Object.fromEntries(templates.map((template) => [template.key, computeInitialStatus(template)]))
  );
  const handleStatusChange = useCallback((templateKey: string, status: ContactTemplateEditorStatus) => {
    setStatusByKey((previous) => {
      const current = previous[templateKey];
      if (
        current &&
        current.hasBlockingErrors === status.hasBlockingErrors &&
        current.hasWarnings === status.hasWarnings &&
        current.customized === status.customized &&
        current.dirty === status.dirty
      ) {
        return previous;
      }

      return {
        ...previous,
        [templateKey]: status
      };
    });
  }, []);
  const current = templates.find((template) => template.key === selected) || templates[0];
  const templatesWithStatus = useMemo(
    () =>
      templates.map((template) => ({
        ...template,
        status: statusByKey[template.key] || computeInitialStatus(template)
      })),
    [statusByKey, templates]
  );

  if (!current) {
    return <p className="text-sm text-muted-foreground">No email templates available.</p>;
  }

  return (
    <Tabs
      value={selected}
      onValueChange={(value) => setSelected(value)}
      className="space-y-4"
    >
      <TabsList className="grid h-auto w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {templatesWithStatus.map((template) => {
          const status = template.status;
          const marker = status.hasBlockingErrors ? 'error' : status.dirty ? 'dirty' : status.customized ? 'customized' : 'default';
          const isActive = selected === template.key;
          return (
            <TabsTrigger
              key={template.key}
              value={template.key}
              className="relative border border-[var(--vd-border)] bg-[var(--vd-card)] text-xs text-[var(--vd-fg)] data-[state=active]:border-[hsl(212_100%_14%)] data-[state=active]:bg-[hsl(212_100%_14%)] data-[state=active]:text-white"
              title={
                marker === 'error'
                  ? `${template.label}: required token issue`
                  : marker === 'dirty'
                    ? `${template.label}: unsaved changes`
                    : marker === 'customized'
                      ? `${template.label}: customized from default`
                      : `${template.label}: default`
              }
            >
              <span className="truncate">{template.label}</span>
              <span className="absolute right-1.5 top-1.5">
                {marker === 'error' ? (
                  <AlertCircle className={isActive ? 'h-3.5 w-3.5 text-white' : 'h-3.5 w-3.5 text-rose-500'} />
                ) : marker === 'dirty' ? (
                  <Circle
                    className={
                      isActive ? 'h-3.5 w-3.5 fill-white text-white' : 'h-3.5 w-3.5 fill-amber-500 text-amber-500'
                    }
                  />
                ) : marker === 'customized' ? (
                  <CheckCircle2 className={isActive ? 'h-3.5 w-3.5 text-white' : 'h-3.5 w-3.5 text-emerald-600'} />
                ) : null}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {templates.map((template) => {
        return (
          <TabsContent key={template.key} value={template.key} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">{template.label}</h2>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>

            <section className="rounded-lg border bg-background p-4">
              <ContactTemplatesEditor
                templateKey={template.key}
                templateLabel={template.label}
                initialHtml={template.initialHtml}
                initialText={template.initialText}
                defaultHtml={template.defaultHtml}
                defaultText={template.defaultText}
                tokens={template.tokens}
                requiredTokens={template.requiredTokens}
                previewTokenValues={template.sampleValues}
                updatedAt={template.updatedAt}
                initialTab="visual"
                onStatusChange={(status) => {
                  handleStatusChange(template.key, status);
                }}
              />
            </section>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
