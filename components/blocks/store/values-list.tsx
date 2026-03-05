import type { ComponentConfig } from '@measured/puck';
import { getLucideIcon } from '@/lib/lucide';

type ValueItem = {
  title: string;
  description?: string;
  iconName?: string;
};

export type ValuesListProps = {
  title?: string;
  accent?: string;
  lead?: string;
  values?: ValueItem[];
  columns?: number;
};

export function ValuesList(props: ValuesListProps) {
  const values = props.values || [];
  if (values.length === 0) return null;
  const columns = Math.min(Math.max(props.columns || 4, 1), 4);
  const columnClass =
    columns === 4
      ? 'lg:grid-cols-4'
      : columns === 3
        ? 'lg:grid-cols-3'
        : columns === 2
          ? 'sm:grid-cols-2'
          : 'sm:grid-cols-1';
  const hasHeader = Boolean(props.title || props.accent || props.lead);

  return (
    <section className="px-6 sm:px-12 mb-20 max-w-7xl mx-auto">
      {hasHeader ? (
        <div className="mb-10 text-left border-b-2 border-[var(--vd-muted)] pb-6">
          {props.title || props.accent ? (
            <h3 className="text-3xl font-black uppercase text-[var(--vd-fg)] tracking-tighter mb-1">
              {props.title}{' '}
              {props.accent ? (
                <span className="text-[var(--vd-primary)] font-display lowercase font-normal italic">
                  {props.accent}
                </span>
              ) : null}
            </h3>
          ) : null}
          {props.lead ? <p className="text-sm text-[var(--vd-muted-fg)] max-w-2xl mt-2">{props.lead}</p> : null}
        </div>
      ) : null}

      <div className={`grid grid-cols-1 gap-4 ${columnClass}`}>
        {values.map((value) => {
          const Icon = getLucideIcon(value.iconName || '');
          return (
            <div
              key={value.title}
              className="p-6 bg-white rounded-2xl transition-all duration-300 group hover:bg-white hover:shadow-xl hover:-translate-y-1 border border-[var(--vd-border)] hover:border-[var(--vd-primary)]/30 h-full flex flex-col"
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--vd-fg)] group-hover:text-[var(--vd-primary)] transition-colors">
                {Icon ? (
                  <span className="rounded-full bg-[var(--vd-muted)] p-2 text-[var(--vd-primary)]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 bg-[var(--vd-primary)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <span>{value.title}</span>
              </div>
              {value.description ? (
                <p className="mt-3 text-sm text-[var(--vd-muted-fg)] leading-relaxed group-hover:text-[var(--vd-fg)]/80 transition-colors flex-1">
                  {value.description}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const valuesListConfig: ComponentConfig<ValuesListProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' },
    lead: { type: 'textarea' },
    columns: { type: 'number' },
    values: {
      type: 'array',
      arrayFields: {
        title: { type: 'text' },
        description: { type: 'textarea' },
        iconName: { type: 'text' }
      }
    }
  },
  defaultProps: {
    title: '',
    accent: '',
    lead: '',
    columns: 4,
    values: []
  },
  render: (props) => ValuesList(props) as any
};
