'use client';
import { useRef, useState } from 'react';
import { Download, ExternalLink, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildAssetUrl } from '@/lib/uploads-url';
import { resolveDemoEditorAssetUrl } from '@/lib/demo-editor-assets';
import { NewsletterMediaPicker } from './newsletter-media-picker';
import { NEWSLETTER_ATTACHMENT_LIMIT, validateNewsletterAttachments, type NewsletterAttachment } from '@/lib/newsletter/media-client-types';

export function NewsletterAttachments({ value, onChange, disabled = false, demo = false }: {
  value: NewsletterAttachment[]; onChange: (value: NewsletterAttachment[]) => void; disabled?: boolean; demo?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const total = value.reduce((size, item) => size + item.size, 0);
  return <section aria-label="Newsletter attachments" className="space-y-3 rounded-lg border border-border p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="font-medium">Attachments</p><p className="text-xs text-muted-foreground">{value.length}/5 files · {(total / 1024 / 1024).toFixed(2)} of 5 MiB</p></div>
      <Button ref={trigger} type="button" variant="outline" disabled={disabled || value.length >= 5} onClick={() => setOpen(true)}><Paperclip className="size-4" />Add attachment</Button>
    </div>
    {value.length ? <ul className="space-y-2">{value.map((item) => {
      const sourceUrl = demo ? resolveDemoEditorAssetUrl(item.assetKey) : buildAssetUrl(item.assetKey);
      return <li key={item.assetKey} className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="min-w-0 break-all">{item.name} <span className="text-muted-foreground">({Math.ceil(item.size / 1024)} KiB)</span></span>
        <div className="flex items-center gap-1">
          {sourceUrl && !disabled ? <>
            <Button type="button" variant="ghost" size="icon" asChild><a href={sourceUrl} target="_blank" rel="noreferrer" aria-label={`Preview source file ${item.name}`}><ExternalLink className="size-4" /></a></Button>
            <Button type="button" variant="ghost" size="icon" asChild><a href={sourceUrl} download={item.name} aria-label={`Download source file ${item.name}`}><Download className="size-4" /></a></Button>
          </> : null}
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.name}`} disabled={disabled} onClick={() => { onChange(value.filter((entry) => entry.assetKey !== item.assetKey)); setError(''); }}><X className="size-4" /></Button>
        </div>
      </li>;
    })}</ul> : <p className="text-sm text-muted-foreground">No attachments. PDF, JPEG, PNG and WebP are supported.</p>}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <NewsletterMediaPicker open={open} onOpenChange={setOpen} onReturnFocus={() => trigger.current?.focus()} kind="attachment" demo={demo} maxUploadBytes={Math.max(0, NEWSLETTER_ATTACHMENT_LIMIT - total)} onSelect={(item) => {
      const next = [...value, { assetKey: item.assetKey, name: item.name, mime: item.mime, size: item.size }];
      const problem = validateNewsletterAttachments(next);
      if (problem) { setError(problem); return; }
      setError(''); onChange(next);
    }} />
  </section>;
}
