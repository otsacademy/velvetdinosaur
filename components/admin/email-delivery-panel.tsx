'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Item = { id: string; resource: string; kind: string; email: string; status: string; attempts: number; error: string };
export function EmailDeliveryPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [review, setReview] = useState<Item | null>(null);
  const [evidence, setEvidence] = useState('');
  const [messageId, setMessageId] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/email-deliveries', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load email deliveries.');
      const data = await response.json(); setItems(data.items); setCounts(data.counts); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load deliveries.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function resolve(resolution: 'accepted' | 'not-accepted') {
    if (!review || busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/admin/email-deliveries', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id, resource: review.resource, resolution, evidence, messageId }) });
      if (!response.ok) throw new Error((await response.json()).error || 'Review failed.');
      setReview(null); setEvidence(''); setMessageId(''); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Review failed.'); }
    finally { setBusy(false); }
  }
  return <Card className="my-6"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Email delivery follow-up</CardTitle><Button variant="outline" onClick={() => void load()}>Refresh</Button></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Confirmation emails: {counts.pending || 0} queued, {counts.sent || 0} accepted by Postmark, {counts.failed || 0} failed, {counts.needs_review || 0} need review.</p>
      {error && <p role="alert">{error}</p>}
      {!items.length && <p className="text-sm">No outstanding deliveries.</p>}
      {items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
        <div><p>{item.email} · {item.kind} · {item.status.replaceAll('_', ' ')}</p><p className="text-muted-foreground">{item.error}</p></div>
        {['failed', 'needs_review'].includes(item.status) && <Button variant="outline" onClick={() => { setReview(item); setEvidence(''); setMessageId(''); }}>Review delivery</Button>}
      </div>)}
      {review && <div className="space-y-3 rounded border p-4">
        <p>Check Postmark activity for {review.email} before deciding whether this email can be retried.</p>
        <label className="block text-sm">Evidence from Postmark<Input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Record when and what you checked" /></label>
        <label className="block text-sm">Postmark message ID, if accepted<Input value={messageId} onChange={(event) => setMessageId(event.target.value)} /></label>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || evidence.trim().length < 8 || !messageId.trim()} onClick={() => void resolve('accepted')}>Mark accepted</Button>
          <Button variant="outline" disabled={busy || evidence.trim().length < 8} onClick={() => void resolve('not-accepted')}>Verified not sent — retry</Button>
          <Button variant="ghost" disabled={busy} onClick={() => setReview(null)}>Cancel</Button>
        </div>
      </div>}
    </CardContent></Card>;
}
