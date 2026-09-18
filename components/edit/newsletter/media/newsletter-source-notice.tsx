'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { NewsletterBodySource } from '@/lib/newsletter/media-client-types';
export function NewsletterSourceNotice({ source, disabled = false, onResume, onConvert }: { source: NewsletterBodySource; disabled?: boolean; onResume: () => void; onConvert: () => void }) {
  const [action, setAction] = useState<'resume' | 'convert' | null>(null);
  if (source === 'visual') return null;
  return <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
    <p>The {source === 'html' ? 'HTML' : 'plain-text'} version is used for delivery. Your visual document is preserved. Switching tabs does not change the delivery version.</p>
    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setAction('resume')}>Resume saved visual version</Button><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setAction('convert')}>Convert plain text to visual</Button></div>
    <AlertDialog open={Boolean(action)} onOpenChange={(open) => { if (!open) setAction(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{action === 'resume' ? 'Use the saved visual document?' : 'Replace the visual document with plain text?'}</AlertDialogTitle><AlertDialogDescription>{action === 'resume' ? 'HTML and plain-text delivery content will be regenerated from your preserved visual document. Copy any source edits you want to keep first.' : 'This replaces the visual document and HTML with the current plain text. Images and formatting in the saved visual version will be removed. HTML is not imported.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep current version</AlertDialogCancel><AlertDialogAction onClick={() => { if (action === 'resume') onResume(); else onConvert(); setAction(null); }}>Continue</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
