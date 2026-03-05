import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ComponentConfig } from '@measured/puck';
import { getLucideIcon } from '@/lib/lucide';

type AdvocacyCta = {
  label: string;
  description?: string;
  href: string;
  icon?: string;
};

export type AdvocacyCtasProps = {
  title?: string;
  lead?: string;
  ctas?: AdvocacyCta[];
};

export function AdvocacyCtas(props: AdvocacyCtasProps) {
  const ctas = props.ctas || [];
  if (!props.title && !props.lead && ctas.length === 0) return null;
  return (
    <section className="px-6 sm:px-12 pb-20 max-w-7xl mx-auto">
      <div className="rounded-[2.5rem] border border-[var(--vd-border)] bg-[var(--vd-muted)]/30 p-8 md:p-10 shadow-sm">
        <div className="space-y-2 max-w-3xl">
          {props.title ? (
            <h3 className="text-3xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">{props.title}</h3>
          ) : null}
          {props.lead ? <p className="text-sm text-[var(--vd-muted-fg)]">{props.lead}</p> : null}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {ctas.map((cta) => {
            const Icon = getLucideIcon(cta.icon || '');
            return (
              <Link
                key={cta.href}
                href={cta.href}
                className="group flex items-start gap-4 rounded-[2rem] border border-[var(--vd-border)] bg-white px-5 py-5 hover:border-[var(--vd-primary)] hover:shadow-lg transition-all"
              >
                <div className="mt-1 rounded-full bg-[var(--vd-muted)] p-3 text-[var(--vd-primary)]">
                  {Icon ? <Icon className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="font-black uppercase tracking-widest text-[var(--vd-fg)] text-xs">{cta.label}</p>
                  {cta.description ? (
                    <p className="text-sm text-[var(--vd-muted-fg)] mt-2">{cta.description}</p>
                  ) : null}
                  <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--vd-primary)]">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const advocacyCtasConfig: ComponentConfig<AdvocacyCtasProps> = {
  fields: {
    title: { type: 'text' },
    lead: { type: 'textarea' },
    ctas: {
      type: 'array',
      arrayFields: {
        label: { type: 'text' },
        description: { type: 'textarea' },
        href: { type: 'text' },
        icon: { type: 'text' }
      }
    }
  },
  defaultProps: {
    title: '',
    lead: '',
    ctas: []
  },
  render: (props) => AdvocacyCtas(props) as any
};
