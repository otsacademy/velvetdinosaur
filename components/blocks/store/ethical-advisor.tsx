'use client';

import { useState } from 'react';
import type { ComponentConfig } from '@measured/puck';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export type EthicalAdvisorProps = {
  title?: string;
  promptLabel?: string;
  placeholder?: string;
  ctaLabel?: string;
  puck?: { mode?: string };
};

export function EthicalAdvisorBlock(props: EthicalAdvisorProps) {
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_ETHICAL_ADVISOR === '1' ||
    process.env.NEXT_PUBLIC_ENABLE_ETHICAL_ADVISOR === 'true';

  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!enabled) {
    if (props.puck?.mode === 'edit') {
      return (
        <div className="rounded-[var(--vd-radius)] border border-dashed border-[var(--vd-border)] bg-[var(--vd-muted)]/40 p-4 text-sm text-[var(--vd-muted-fg)]">
          Ethical Advisor is disabled. Enable with NEXT_PUBLIC_ENABLE_ETHICAL_ADVISOR=1 to show in production.
        </div>
      );
    }
    return null;
  }

  const handleAsk = () => {
    setLoading(true);
    setTimeout(() => {
      setResponse(
        "Thanks for asking. This lightweight advisor is a placeholder; wire it to your preferred AI backend to respond with ethical guidance."
      );
      setLoading(false);
    }, 400);
  };

  return (
    <section className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-white/85 p-6 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--vd-muted-fg)]">AI Ethical Advisor</p>
        <h3 className="text-xl font-semibold">{props.title || 'Gut-check your idea'}</h3>
        <p className="text-sm text-[var(--vd-muted-fg)]">
          {props.promptLabel || 'Ask a quick question about ethics, equity, or accessibility.'}
        </p>
      </div>
      <Textarea
        placeholder={props.placeholder || 'How do we ensure this trip respects the local community?'}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleAsk} disabled={loading || !question.trim()}>
          {loading ? 'Thinking…' : props.ctaLabel || 'Ask advisor'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setQuestion('')} disabled={loading && !question}>
          Clear
        </Button>
      </div>
      {response ? (
        <div className="rounded-[var(--vd-radius)] bg-[var(--vd-muted)]/50 p-3 text-sm text-[var(--vd-fg)]">{response}</div>
      ) : null}
    </section>
  );
}

export const ethicalAdvisorConfig: ComponentConfig<EthicalAdvisorProps> = {
  fields: {
    title: { type: 'text' },
    promptLabel: { type: 'text' },
    placeholder: { type: 'textarea' },
    ctaLabel: { type: 'text' }
  },
  defaultProps: {
    title: 'Ethical Advisor',
    promptLabel: 'Sense-check a decision before you publish.',
    placeholder: 'What should we disclose to guests about local customs?',
    ctaLabel: 'Ask advisor'
  },
  render: (props) => EthicalAdvisorBlock(props) as any
};
