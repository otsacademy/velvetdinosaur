/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Quote } from 'lucide-react';
import type { ComponentConfig } from '@measured/puck';
import { Button } from '@/components/ui/button';

export type FounderNarrativeProps = {
  headline?: string;
  lead?: string;
  story?: string;
  quote?: string;
  name?: string;
  role?: string;
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function FounderNarrative(props: FounderNarrativeProps) {
  if (
    !props.headline &&
    !props.lead &&
    !props.story &&
    !props.quote &&
    !props.name &&
    !props.role &&
    !props.image &&
    !props.ctaLabel &&
    !props.ctaHref
  ) {
    return null;
  }

  return (
    <section className="px-6 sm:px-12 pt-8 mb-16 max-w-4xl mx-auto">
      <div className="relative mb-10 p-8 md:p-10 bg-[var(--vd-muted)]/40 rounded-[3rem] border border-[var(--vd-border)]">
        <span className="absolute -left-2 -top-4 text-[var(--vd-primary)] font-display text-7xl opacity-20">
          “
        </span>
        {props.headline ? (
          <p className="font-bold text-[var(--vd-fg)] text-xl md:text-2xl leading-snug mb-6 relative z-10">
            {props.headline}
          </p>
        ) : null}
        {props.lead ? <p className="text-[var(--vd-fg)] font-semibold mb-4">{props.lead}</p> : null}
        {props.story ? (
          <div className="space-y-4 text-[var(--vd-muted-fg)] text-base md:text-lg leading-relaxed relative z-10 whitespace-pre-line">
            {props.story}
          </div>
        ) : null}
        {props.quote ? (
          <p className="mt-6 flex items-start gap-2 text-sm italic text-[var(--vd-fg)]">
            <Quote className="h-4 w-4 text-[var(--vd-muted-fg)]" />
            {props.quote}
          </p>
        ) : null}
        {(props.name || props.role) && (
          <div className="mt-4">
            {props.name ? <p className="text-sm font-semibold">{props.name}</p> : null}
            {props.role ? (
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--vd-muted-fg)]">{props.role}</p>
            ) : null}
          </div>
        )}
        {props.ctaHref && props.ctaLabel ? (
          <Button asChild size="sm" className="mt-6">
            <Link href={props.ctaHref}>{props.ctaLabel}</Link>
          </Button>
        ) : null}
      </div>

      {props.image ? (
        <div className="rounded-[2.5rem] overflow-hidden border border-[var(--vd-border)] shadow-lg">
          <img
            src={props.image}
            alt={props.name || 'Founder portrait'}
            className="h-64 w-full object-cover"
          />
        </div>
      ) : null}
    </section>
  );
}

export const founderNarrativeConfig: ComponentConfig<FounderNarrativeProps> = {
  fields: {
    headline: { type: 'text' },
    lead: { type: 'textarea' },
    story: { type: 'textarea' },
    quote: { type: 'textarea' },
    name: { type: 'text' },
    role: { type: 'text' },
    image: { type: 'text' },
    ctaLabel: { type: 'text' },
    ctaHref: { type: 'text' }
  },
  defaultProps: {
    headline: '',
    lead: '',
    story: '',
    quote: '',
    name: '',
    role: '',
    image: '',
    ctaLabel: '',
    ctaHref: ''
  },
  render: (props) => FounderNarrative(props) as any
};
