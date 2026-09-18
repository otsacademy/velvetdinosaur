/* eslint-disable @next/next/no-img-element -- newsletter images have immutable media URLs */
'use client';

import { restoreNewsletterDialogFocus } from './dialog-focus';
import { createContext, useContext, useRef, useState } from 'react';
import { ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { PlateElement, useEditorRef, type PlateElementProps } from 'platejs/react';
import type { EmailTemplateVisualNode } from '@/lib/email-template-visual';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsletterMediaPicker } from './newsletter-media-picker';
import { newsletterImageCaption, safeNewsletterImageLink } from '@/lib/newsletter/visual-image';
import { newsletterMediaDisplayUrl, type NewsletterMediaItem } from '@/lib/newsletter/media-client-types';

export const NewsletterImageContext = createContext({ demo: false, disabled: false });
function imageNode(item: NewsletterMediaItem): EmailTemplateVisualNode {
  return { type: 'img', assetKey: item.assetKey, renditionId: item.renditionId, url: item.url, alt: item.alt || '', decorative: false, caption: [{ text: item.caption || '' }], width: Math.min(item.width || 560, 560), initialWidth: item.width, initialHeight: item.height, align: 'center', children: [{ text: '' }] };
}
function replaceImage(node: EmailTemplateVisualNode, item: NewsletterMediaItem) {
  return { ...node, ...imageNode(item), alt: node.alt || item.alt, caption: node.caption, decorative: node.decorative, align: node.align, link: node.link, width: node.width };
}
function ImageDetails({ node, onSave, onCancel, onReplace }: { node: EmailTemplateVisualNode; onSave: (node: EmailTemplateVisualNode) => void; onCancel: () => void; onReplace: (node: EmailTemplateVisualNode) => void }) {
  const [alt, setAlt] = useState(String(node.alt || ''));
  const [decorative, setDecorative] = useState(node.decorative === true);
  const [caption, setCaption] = useState(newsletterImageCaption(node));
  const [link, setLink] = useState(String(node.link || ''));
  const [width, setWidth] = useState(String(node.width || 560));
  const [align, setAlign] = useState(String(node.align || 'center'));
  const [error, setError] = useState('');
  return <div className="space-y-4">
    <img src={newsletterMediaDisplayUrl(String(node.url || ''))} alt={alt} className="mx-auto max-h-48 max-w-full object-contain" />
    <div className="space-y-2"><Label htmlFor="newsletter-image-alt">Alternative text</Label><Input id="newsletter-image-alt" value={alt} disabled={decorative} onChange={(event) => setAlt(event.target.value)} /><p className="text-xs text-muted-foreground">Describe the information the image adds to this email.</p></div>
    <div className="flex items-center gap-2"><Checkbox id="newsletter-image-decorative" checked={decorative} onCheckedChange={(checked) => setDecorative(checked === true)} /><Label htmlFor="newsletter-image-decorative">Decorative image (empty alternative text)</Label></div>
    <div className="space-y-2"><Label htmlFor="newsletter-image-caption">Caption</Label><Input id="newsletter-image-caption" value={caption} onChange={(event) => setCaption(event.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="newsletter-image-link">Image link (optional)</Label><Input id="newsletter-image-link" type="url" placeholder="https://" value={link} onChange={(event) => setLink(event.target.value)} /></div>
    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="newsletter-image-width">Width (1–560 px)</Label><Input id="newsletter-image-width" type="number" min={1} max={560} value={width} onChange={(event) => setWidth(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="newsletter-image-align">Alignment</Label><Select value={align} onValueChange={setAlign}><SelectTrigger id="newsletter-image-align"><SelectValue /></SelectTrigger><SelectContent>{['left', 'center', 'right'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div></div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => onReplace({ ...node, alt, decorative, caption: [{ text: caption }], link, width: Number(width) || 560, align })}>Replace image</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="button" onClick={() => {
      if (!decorative && !alt.trim()) { setError('Add alternative text or mark the image as decorative.'); return; }
      if (link.trim() && !safeNewsletterImageLink(link)) { setError('Use an https, http or mailto link.'); return; }
      const numericWidth = Number(width);
      if (!Number.isFinite(numericWidth) || numericWidth < 1 || numericWidth > 560) { setError('Choose a width between 1 and 560 pixels.'); return; }
      onSave({ ...node, alt: decorative ? '' : alt.trim(), decorative, caption: [{ text: caption }], link: link.trim(), width: Math.round(numericWidth), align });
    }}>Save image</Button></div>
  </div>;
}
function ImageDialog({ node, onSave, onCancel, onReplace, onReturnFocus }: Parameters<typeof ImageDetails>[0] & { onReturnFocus: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}><DialogContent onCloseAutoFocus={(event) => restoreNewsletterDialogFocus(event, onReturnFocus)} className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Newsletter image</DialogTitle><DialogDescription>Set the image description and its appearance in email.</DialogDescription></DialogHeader><ImageDetails node={node} onSave={onSave} onCancel={onCancel} onReplace={onReplace} /></DialogContent></Dialog>;
}
export function NewsletterImageButton() {
  const editor = useEditorRef();
  const { demo, disabled } = useContext(NewsletterImageContext);
  const selection = useRef(editor.selection);
  const trigger = useRef<HTMLButtonElement>(null);
  const inserted = useRef(false);
  const replacement = useRef<EmailTemplateVisualNode | null>(null);
  const returnFocus = () => { if (inserted.current) editor.tf.focus(); else trigger.current?.focus(); };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EmailTemplateVisualNode | null>(null);
  return <>
    <Button ref={trigger} type="button" variant="outline" size="sm" aria-label="Insert image" disabled={disabled} onMouseDown={(event) => { event.preventDefault(); selection.current = editor.selection; }} onClick={() => { selection.current = editor.selection; inserted.current = false; replacement.current = null; setOpen(true); }}><ImagePlus className="size-4" />Image</Button>
    <NewsletterMediaPicker onReturnFocus={returnFocus} kind="image" demo={demo} open={open} onOpenChange={setOpen} onSelect={(item) => setDraft(replacement.current ? replaceImage(replacement.current, item) : imageNode(item))} />
    {draft ? <ImageDialog key={String(draft.url)} node={draft} onReturnFocus={returnFocus} onCancel={() => setDraft(null)} onReplace={(current) => { replacement.current = current; setDraft(null); setOpen(true); }} onSave={(node) => {
      if (selection.current) editor.tf.select(selection.current);
      inserted.current = true;
      editor.tf.insertNodes(node as never);
      editor.tf.focus(); setDraft(null);
    }} /> : null}
  </>;
}
export function NewsletterImageElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const { demo, disabled } = useContext(NewsletterImageContext);
  const node = props.element as EmailTemplateVisualNode;
  const [draft, setDraft] = useState<EmailTemplateVisualNode | null>(null);
  const [replace, setReplace] = useState(false);
  const replacement = useRef<EmailTemplateVisualNode | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const returnFocus = () => trigger.current?.focus();
  const align = node.align === 'left' ? 'mr-auto' : node.align === 'right' ? 'ml-auto' : 'mx-auto';
  return <PlateElement {...props}><div contentEditable={false} className="my-4">
    <figure className={align} style={{ width: Math.min(Number(node.width) || 560, 560), maxWidth: '100%' }}>
      <img src={newsletterMediaDisplayUrl(String(node.url || ''))} alt={String(node.alt || '')} className="h-auto max-w-full" width={Number(node.width) || 560} />
      {newsletterImageCaption(node) ? <figcaption className="mt-2 text-sm text-muted-foreground">{newsletterImageCaption(node)}</figcaption> : null}
      {!disabled ? <div className="mt-2 flex gap-2"><Button ref={trigger} type="button" variant="outline" size="sm" onClick={() => setDraft(node)}><Pencil className="size-3" />Edit image</Button><Button type="button" variant="ghost" size="sm" aria-label="Remove image" onClick={() => { const at = editor.api.findPath(props.element); if (at) editor.tf.removeNodes({ at }); }}><Trash2 className="size-4" /></Button></div> : null}
    </figure>
    {draft ? <ImageDialog key={String(draft.url)} node={draft} onReturnFocus={returnFocus} onCancel={() => setDraft(null)} onReplace={(current) => { replacement.current = current; setDraft(null); setReplace(true); }} onSave={(updated) => { const at = editor.api.findPath(props.element); if (at) editor.tf.setNodes(updated as never, { at }); setDraft(null); }} /> : null}
    <NewsletterMediaPicker onReturnFocus={returnFocus} open={replace} onOpenChange={setReplace} kind="image" demo={demo} onSelect={(item) => setDraft(replaceImage(replacement.current || node, item))} />
  </div>{props.children}</PlateElement>;
}
