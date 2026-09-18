'use client';

import { restoreNewsletterDialogFocus } from './dialog-focus';
import { useState } from 'react';
import { AssetPickerField } from '@/components/puck/fields/asset-picker-field';
import type { AssetPickerListItem } from '@/components/puck/fields/asset-picker-field/shared';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { resolveDemoEditorAssetUrl } from '@/lib/demo-editor-assets';
import { NEWSLETTER_ATTACHMENT_MIMES, NEWSLETTER_IMAGE_MIMES, type NewsletterMediaItem } from '@/lib/newsletter/media-client-types';

export function NewsletterMediaPicker({ open, onOpenChange, kind, demo = false, maxUploadBytes, onSelect, onReturnFocus }: {
  open: boolean; onOpenChange: (open: boolean) => void; kind: 'image' | 'attachment'; demo?: boolean;
  onReturnFocus?: () => void;
  maxUploadBytes?: number; onSelect: (item: NewsletterMediaItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryItem, setRetryItem] = useState<AssetPickerListItem | null>(null);
  const allowed = kind === 'image' ? NEWSLETTER_IMAGE_MIMES : NEWSLETTER_ATTACHMENT_MIMES;
  async function select(item: AssetPickerListItem) {
    setBusy(true); setError(''); setRetryItem(item);
    try {
      let prepared: NewsletterMediaItem;
      if (demo) {
        prepared = { assetKey: item.key, name: item.name || item.key, mime: item.mime || '', size: item.size || 0, url: resolveDemoEditorAssetUrl(item.key) || item.key, alt: item.alt, caption: item.caption, width: item.width, height: item.height };
      } else {
        const response = await fetch('/api/admin/newsletter/media', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify({ assetKey: item.key, kind }) });
        const payload = await response.json();
        if (!response.ok || !payload.item) throw new Error(payload.error || 'Unable to prepare this file.');
        prepared = payload.item;
      }
      onSelect(prepared); onOpenChange(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to select this file.'); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
    <DialogContent onCloseAutoFocus={(event) => restoreNewsletterDialogFocus(event, onReturnFocus)} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{kind === 'image' ? 'Choose newsletter image' : 'Add attachment'}</DialogTitle><DialogDescription>{kind === 'image' ? 'Upload or choose a JPEG, PNG or WebP image. Email images are prepared at a maximum of 1120 pixels.' : 'Choose a PDF or image. Up to five files and 5 MiB total.'}{demo ? ' Files stay in this demo session.' : ''}</DialogDescription></DialogHeader>
      <div className={busy ? 'pointer-events-none opacity-60' : ''}>
        <AssetPickerField value="" onChange={() => undefined} onSelectAsset={(item) => void select(item)} accept={allowed.join(',')} allowedMimeTypes={allowed} maxUploadBytes={maxUploadBytes} demo={demo} compact showUrlInput={false} showAdvancedOptions={false} showSelectedAssetMeta={false} testIdBase={`newsletter-${kind}`} />
      </div>
      {busy ? <p role="status">Preparing file…</p> : null}
      {error ? <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p>{retryItem ? <Button type="button" variant="outline" onClick={() => void select(retryItem)}>Retry preparation</Button> : null}</div> : null}
    </DialogContent>
  </Dialog>;
}
