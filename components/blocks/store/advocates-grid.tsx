import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import type { ComponentConfig } from '@measured/puck';
import { listAdvocates } from '@/lib/content/advocates';
import type { Advocate } from '@/lib/content/types';
import { cn } from '@/lib/utils';

export type AdvocatesGridProps = {
  title?: string;
  accent?: string;
  description?: string;
  mission?: string;
  missionLabel?: string;
  variant?: 'compact' | 'page';
  mode?: 'all' | 'slugs';
  advocateSlugs?: string[];
  columns?: number;
  showCategory?: boolean | 'true' | 'false';
};

function categoryLabel(category?: Advocate['category']) {
  if (!category) return '';
  const map: Record<string, string> = {
    cultural: 'Culture',
    nature: 'Nature',
    wellbeing: 'Wellbeing',
    tour: 'Tours',
    stays: 'Places to stay',
    charity: 'Charity'
  };
  return map[category] || category;
}

export async function AdvocatesGrid(props: AdvocatesGridProps) {
  const all = await listAdvocates();
  const selected =
    props.mode === 'slugs' && props.advocateSlugs?.length
      ? all.filter((advocate) => props.advocateSlugs!.includes(advocate.slug))
      : all;

  const variant = props.variant || 'compact';
  const columns = Math.min(Math.max(props.columns || 2, 1), 3);
  const columnClass =
    columns === 3 ? 'md:grid-cols-3' : columns === 1 ? 'md:grid-cols-1' : 'md:grid-cols-2';
  const showCategory =
    props.showCategory === true || props.showCategory === 'true'
      ? true
      : props.showCategory === 'false'
        ? false
        : true;

  const categories = [
    { id: 'cultural', label: 'Cultural experience providers' },
    { id: 'nature', label: 'Nature-based experience providers' },
    { id: 'wellbeing', label: 'Well-being experience providers' },
    { id: 'tour', label: 'Tour guiding services' },
    { id: 'stays', label: 'Places to stay' },
    { id: 'charity', label: 'Charity partners' }
  ] as const;

  const grouped =
    variant === 'page'
      ? categories
          .map((cat) => ({
            ...cat,
            items: selected.filter((advocate) => advocate.category === cat.id)
          }))
          .filter((cat) => cat.items.length > 0)
      : [{ id: 'all', label: 'All', items: selected }];

  if (!props.title && !props.accent && !props.description && !props.mission && selected.length === 0) {
    return null;
  }

  return (
    <section className={cn('px-6 sm:px-12', variant === 'page' ? 'pb-20' : 'pb-12')}>
      {props.title || props.accent || props.description ? (
        <div className="max-w-4xl mx-auto text-left mb-8">
          {props.title || props.accent ? (
            <h3 className="text-4xl font-black uppercase tracking-tighter text-[var(--vd-fg)] leading-[0.9]">
              {props.title}{' '}
              {props.accent ? (
                <span className="text-[var(--vd-primary)] italic font-display font-normal lowercase">
                  {props.accent}
                </span>
              ) : null}
            </h3>
          ) : null}
          {props.description ? (
            <p className="text-lg font-bold text-[var(--vd-fg)]/90 leading-tight mt-3">{props.description}</p>
          ) : null}
        </div>
      ) : null}

      {props.mission ? (
        <div className="max-w-5xl mx-auto mb-12">
          <div className="p-8 md:p-12 bg-[var(--vd-fg)] text-white rounded-[2.5rem] relative overflow-hidden border border-[var(--vd-fg)] shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="h-10 w-10" />
            </div>
            {props.missionLabel ? (
              <p className="text-white/60 text-xs font-black uppercase tracking-[0.2em] mb-6">
                {props.missionLabel}
              </p>
            ) : null}
            <p className="text-xl md:text-2xl leading-relaxed italic font-display font-medium text-white">
              {props.mission}
            </p>
          </div>
        </div>
      ) : null}

      {selected.length === 0 ? null : variant === 'page' ? (
        <div className="space-y-16 max-w-7xl mx-auto">
          {grouped.map((group) => (
            <div key={group.id} className="space-y-8">
              <div className="flex items-center gap-4 border-b border-[var(--vd-border)] pb-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">
                  {group.label}
                </h3>
                <div className="h-[1px] flex-1 bg-[var(--vd-muted)]" />
              </div>
              <div className="grid grid-cols-1 gap-6">
                {group.items.map((advocate) => (
                  <article
                    key={advocate.slug}
                    className="group flex flex-col md:flex-row gap-8 p-8 md:p-10 rounded-[2rem] bg-white border border-[var(--vd-border)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="md:w-1/4 min-w-[200px]">
                      <h4 className="text-xl font-black text-[var(--vd-fg)] group-hover:text-[var(--vd-primary)] transition-colors leading-tight mb-3">
                        {advocate.name}
                      </h4>
                      {advocate.location ? (
                        <div className="flex items-start gap-2 text-[var(--vd-muted-fg)]">
                          <MapPin className="h-4 w-4" />
                          <p className="text-xs font-bold uppercase tracking-[0.2em] pt-0.5">
                            {advocate.location}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-1 space-y-4">
                      {showCategory && advocate.category ? (
                        <span className="inline-flex rounded-full bg-[var(--vd-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--vd-muted-fg)]">
                          {categoryLabel(advocate.category)}
                        </span>
                      ) : null}
                      {advocate.description ? (
                        <p className="text-sm text-[var(--vd-muted-fg)] leading-relaxed whitespace-pre-wrap">
                          {advocate.description}
                        </p>
                      ) : null}
                      {advocate.tags?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {advocate.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[var(--vd-border)] px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--vd-muted-fg)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="md:w-40 flex items-start">
                      {advocate.website ? (
                        <Link
                          href={advocate.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--vd-primary)] hover:underline underline-offset-4"
                        >
                          Visit <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn('grid gap-4 max-w-6xl mx-auto', columnClass)}>
          {selected.map((advocate) => (
            <article
              key={advocate.slug}
              className="rounded-[2rem] border border-[var(--vd-border)] bg-white/80 p-6 shadow-sm hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black text-[var(--vd-fg)]">{advocate.name}</h4>
                  {advocate.location ? (
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--vd-muted-fg)]">
                      {advocate.location}
                    </p>
                  ) : null}
                </div>
                {showCategory && advocate.category ? (
                  <span className="rounded-full bg-[var(--vd-muted)] px-3 py-1 text-xs text-[var(--vd-muted-fg)]">
                    {categoryLabel(advocate.category)}
                  </span>
                ) : null}
              </div>
              {advocate.description ? (
                <p className="mt-3 text-sm text-[var(--vd-muted-fg)] whitespace-pre-wrap">{advocate.description}</p>
              ) : null}
              <div className="mt-4 flex items-center justify-between">
                {advocate.website ? (
                  <Link
                    href={advocate.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--vd-primary)]"
                  >
                    Visit <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export const advocatesGridConfig: ComponentConfig<AdvocatesGridProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' },
    description: { type: 'textarea' },
    mission: { type: 'textarea' },
    missionLabel: { type: 'text' },
    variant: {
      type: 'select',
      options: [
        { label: 'Compact grid', value: 'compact' },
        { label: 'Full advocates page', value: 'page' }
      ]
    },
    mode: {
      type: 'select',
      options: [
        { label: 'All advocates', value: 'all' },
        { label: 'Select by slug', value: 'slugs' }
      ]
    },
    advocateSlugs: { type: 'array', arrayFields: { value: { type: 'text' } } },
    columns: { type: 'number' },
    showCategory: {
      type: 'select',
      options: [
        { label: 'Show', value: 'true' },
        { label: 'Hide', value: 'false' }
      ]
    }
  },
  defaultProps: {
    title: '',
    accent: '',
    description: '',
    mission: '',
    missionLabel: '',
    variant: 'compact',
    mode: 'all',
    columns: 2,
    showCategory: false
  },
  render: (props) => AdvocatesGrid(props) as any
};
