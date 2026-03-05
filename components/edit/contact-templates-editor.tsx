'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type ContactTemplatesEditorProps = {
  initialHtml: string;
  initialText: string;
  defaultHtml: string;
  defaultText: string;
  updatedAt?: string | null;
};

const tokens = ['{{name}}', '{{email}}', '{{topic}}', '{{message}}', '{{sentAt}}'];

export function ContactTemplatesEditor({
  initialHtml,
  initialText,
  defaultHtml,
  defaultText,
  updatedAt
}: ContactTemplatesEditorProps) {
  const [html, setHtml] = useState(initialHtml);
  const [text, setText] = useState(initialText);
  const [lastUpdated, setLastUpdated] = useState<string | null>(updatedAt ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = () => {
    setHtml(defaultHtml);
    setText(defaultText);
    setSuccess('');
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/contact/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html, text })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Unable to save templates.');
      }
      setLastUpdated(payload?.updatedAt || null);
      setSuccess('Templates updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save templates.');
    } finally {
      setSaving(false);
    }
  };

  const updatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleString() : null;

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/30 p-3 text-xs text-[var(--vd-muted-fg)]">
        <div className="font-bold uppercase tracking-[0.2em] text-[var(--vd-fg)]">Available tokens</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {tokens.map((token) => (
            <span
              key={token}
              className="rounded-full border border-[var(--vd-border)] bg-[var(--vd-card)] px-2 py-0.5 font-mono text-[10px]"
            >
              {token}
            </span>
          ))}
        </div>
      </div>

      <Tabs defaultValue="html">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="text">Plain text</TabsTrigger>
        </TabsList>
        <TabsContent value="html" className="space-y-2">
          <Textarea
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            rows={14}
            placeholder="HTML template"
            disabled={saving}
          />
        </TabsContent>
        <TabsContent value="text" className="space-y-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={14}
            placeholder="Plain text template"
            disabled={saving}
          />
        </TabsContent>
      </Tabs>

      {updatedLabel ? (
        <p className="text-xs text-[var(--vd-muted-fg)]">Last updated {updatedLabel}</p>
      ) : null}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      {success ? <p className="text-xs text-[var(--vd-primary)]">{success}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
            Reset to default
          </Button>
        </div>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save templates'}
        </Button>
      </div>
    </div>
  );
}
