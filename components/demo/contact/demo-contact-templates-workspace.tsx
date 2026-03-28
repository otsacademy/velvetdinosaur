'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { createDemoEmailTemplates } from '@/lib/demo-email-templates-seed';
import {
  DemoContactTemplateEditor,
  getContactTemplateStatus,
  type DemoContactTemplateRecord
} from '@/components/demo/contact/demo-contact-template-editor';

function buildInitialTemplates(): DemoContactTemplateRecord[] {
  return createDemoEmailTemplates().map((template) => ({
    ...template,
    html: template.initialHtml,
    text: template.initialText,
    savedHtml: template.initialHtml,
    savedText: template.initialText
  }));
}

function TemplateStatusMarker({ template }: { template: DemoContactTemplateRecord }) {
  const status = getContactTemplateStatus(template);
  if (status.hasBlockingErrors) {
    return <AlertCircle className="h-4 w-4 text-rose-600" />;
  }
  if (status.dirty) {
    return <Circle className="h-4 w-4 fill-amber-500 text-amber-500" />;
  }
  if (status.customized) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  }
  return <span className="h-2.5 w-2.5 rounded-full bg-[var(--vd-border)]" />;
}

export function DemoContactTemplatesWorkspace() {
  const initialTemplates = useMemo(() => buildInitialTemplates(), []);
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedKey, setSelectedKey] = useState(initialTemplates[0]?.key ?? '');

  const selectedTemplate = templates.find((template) => template.key === selectedKey) ?? templates[0] ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="border-[var(--vd-border)] shadow-none">
        <CardHeader className="border-b border-[var(--vd-border)]">
          <CardTitle className="text-xl">Email templates</CardTitle>
          <CardDescription>
            This mirrors the system email workbench with fictional templates, token previews, and demo-only saves.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-18rem)] min-h-[480px]">
            <div className="space-y-2 p-3">
              {templates.map((template) => {
                const status = getContactTemplateStatus(template);
                return (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => setSelectedKey(template.key)}
                    className={cn(
                      'w-full rounded-[1.25rem] border px-4 py-4 text-left transition-colors',
                      selectedTemplate?.key === template.key
                        ? 'border-[var(--vd-ring)] bg-[var(--vd-muted)]/60'
                        : 'border-[var(--vd-border)] bg-[var(--vd-card)] hover:bg-[var(--vd-muted)]/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <TemplateStatusMarker template={template} />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-semibold text-[var(--vd-fg)]">{template.label}</p>
                          <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">
                            {status.hasBlockingErrors ? 'Issue' : status.dirty ? 'Unsaved' : status.customized ? 'Custom' : 'Default'}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">{template.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedTemplate ? (
        <DemoContactTemplateEditor
          template={selectedTemplate}
          onChange={(nextTemplate) =>
            setTemplates((current) =>
              current.map((template) => (template.key === nextTemplate.key ? nextTemplate : template))
            )
          }
        />
      ) : null}
    </div>
  );
}
