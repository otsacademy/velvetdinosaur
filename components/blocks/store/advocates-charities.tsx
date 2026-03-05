import type { ComponentConfig } from '@measured/puck';
import { ExternalLink } from 'lucide-react';
import { listAdvocates } from '@/lib/content/advocates';
import type { Advocate } from '@/lib/content/types';

export type AdvocatesCharitiesProps = {
  title?: string;
  accent?: string;
  lead?: string;
  ctaLabel?: string;
  charitySlugs?: string[];
};

function orderBySlugs(items: Advocate[], slugs?: string[]) {
  if (!slugs || slugs.length === 0) return items;
  const map = new Map(items.map((item) => [item.slug, item]));
  return slugs.map((slug) => map.get(slug)).filter(Boolean) as Advocate[];
}

export async function AdvocatesCharities(props: AdvocatesCharitiesProps) {
  const advocates = await listAdvocates();
  const charities = orderBySlugs(
    advocates.filter((advocate) => advocate.category === 'charity'),
    props.charitySlugs
  );

  const hasHeader = Boolean(props.title || props.accent || props.lead);
  if (!hasHeader && charities.length === 0) return null;

  return (
    <section className="mt-40">
      {hasHeader ? (
        <div className="flex items-end gap-6 mb-16">
          <div className="space-y-3">
            {props.title || props.accent ? (
              <h3 className="text-4xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">
                {props.title}{' '}
                {props.accent ? (
                  <span className="text-[var(--vd-primary)] italic font-display font-normal">
                    {props.accent}
                  </span>
                ) : null}
              </h3>
            ) : null}
            {props.lead ? (
              <p className="text-base text-[var(--vd-muted-fg)] font-medium tracking-tight">{props.lead}</p>
            ) : null}
          </div>
          <div className="h-[2px] flex-1 bg-[var(--vd-muted)] mb-6 hidden sm:block" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {charities.map((charity) => (
          <div
            key={charity.slug}
            className="p-12 rounded-[3rem] bg-[var(--vd-fg)] text-white flex flex-col justify-between group relative overflow-hidden border border-[var(--vd-fg)] shadow-2xl hover:translate-y-[-4px] transition-transform duration-500"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--vd-primary)] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
            <div>
              <h4 className="text-3xl font-black mb-3 group-hover:text-[var(--vd-primary)] transition-colors">
                {charity.name}
              </h4>
              {charity.location ? (
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/50 mb-10">
                  {charity.location}
                </p>
              ) : null}
              {charity.description ? (
                <p className="text-lg text-white/70 leading-relaxed mb-12 font-medium whitespace-pre-wrap">
                  {charity.description}
                </p>
              ) : null}
            </div>
            {charity.website && props.ctaLabel ? (
              <div className="flex items-center justify-between border-t border-white/10 pt-8">
                <a
                  href={charity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--vd-primary)] hover:text-white transition-all bg-white/5 px-6 py-3 rounded-full hover:bg-[var(--vd-primary)]"
                >
                  {props.ctaLabel} <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export const advocatesCharitiesConfig: ComponentConfig<AdvocatesCharitiesProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' },
    lead: { type: 'textarea' },
    ctaLabel: { type: 'text' },
    charitySlugs: { type: 'array', arrayFields: { value: { type: 'text' } } }
  },
  defaultProps: {
    title: '',
    accent: '',
    lead: '',
    ctaLabel: '',
    charitySlugs: []
  },
  render: (props) => AdvocatesCharities(props) as any
};
