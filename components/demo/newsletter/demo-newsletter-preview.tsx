'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DemoNewsletterPreviewProps = {
  htmlBody: string;
  textBody: string;
  recipientEmail: string;
  onRefresh?: () => void;
};

export function DemoNewsletterPreview({
  htmlBody,
  textBody,
  recipientEmail,
  onRefresh
}: DemoNewsletterPreviewProps) {
  const [mode, setMode] = useState<'html' | 'text'>('html');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--vd-muted-fg)]">
          Delivery preview for <span className="font-mono">{recipientEmail || 'recipient'}</span>. This uses the same
          demo render pipeline as the composer source.
        </p>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/25 p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === 'html' ? 'default' : 'ghost'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setMode('html')}
            >
              HTML
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'text' ? 'default' : 'ghost'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setMode('text')}
            >
              Plain Text
            </Button>
          </div>
          {onRefresh ? (
            <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh preview
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]">
        <p className="border-b border-[var(--vd-border)] px-3 py-2 text-xs font-semibold text-[var(--vd-fg)]">
          {mode === 'html' ? 'HTML preview' : 'Plain-text preview'}
        </p>
        {mode === 'html' ? (
          <iframe
            title="Newsletter HTML preview"
            srcDoc={htmlBody || '<p style="font-family:Arial,sans-serif;padding:16px">No preview content yet.</p>'}
            className="h-[620px] w-full bg-white"
          />
        ) : (
          <pre className="h-[620px] overflow-auto whitespace-pre-wrap p-3 text-xs text-[var(--vd-fg)]">
            {textBody || 'No preview content yet.'}
          </pre>
        )}
      </div>
    </div>
  );
}
