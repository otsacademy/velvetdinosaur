import type { ComponentConfig } from '@measured/puck';
import { Leaf, Star } from 'lucide-react';

export type StaysDifferenceProps = {
  title?: string;
  accent?: string;
  lead?: string;
  body?: string;
  commitmentTitle?: string;
  commitmentSubtitle?: string;
  commitmentItems?: string[];
};

export function StaysDifference(props: StaysDifferenceProps) {
  const items = props.commitmentItems || [];
  const hasHeader = Boolean(props.title || props.accent || props.lead || props.body);
  const hasCommitment = Boolean(props.commitmentTitle || props.commitmentSubtitle || items.length > 0);

  if (!hasHeader && !hasCommitment) return null;

  return (
    <section className="mb-32 max-w-5xl mx-auto text-center px-4">
      {props.title || props.accent ? (
        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[var(--vd-fg)] mb-10">
          {props.title}{' '}
          {props.accent ? (
            <span className="text-[var(--vd-primary)] italic font-display font-normal">{props.accent}</span>
          ) : null}
        </h3>
      ) : null}
      {hasHeader ? (
        <div className="space-y-8 text-[var(--vd-muted-fg)] leading-relaxed text-base md:text-lg text-left md:text-center font-medium">
          {props.lead ? (
            <p className="font-bold text-[var(--vd-fg)] text-xl">{props.lead}</p>
          ) : null}
          {props.body ? <p>{props.body}</p> : null}
        </div>
      ) : null}

      {hasCommitment ? (
        <div className="mt-16 bg-[var(--vd-muted)]/40 rounded-[2.5rem] p-8 md:p-12 border border-[var(--vd-border)] shadow-xl relative overflow-hidden text-left group hover:bg-white transition-colors duration-500">
          <div className="absolute -right-6 -bottom-6 text-[var(--vd-primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rotate-12 pointer-events-none transform scale-150">
            <Leaf className="h-12 w-12" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10 border-b border-[var(--vd-border)] pb-6">
              <div className="w-12 h-12 rounded-full bg-[var(--vd-primary)] flex items-center justify-center text-[var(--vd-primary-fg)] shadow-lg shadow-[var(--vd-primary)]/30">
                <Star className="h-5 w-5" />
              </div>
              <div>
                {props.commitmentTitle ? (
                  <h4 className="text-xl md:text-2xl font-black text-[var(--vd-fg)] uppercase tracking-tight leading-none">
                    {props.commitmentTitle}
                  </h4>
                ) : null}
                {props.commitmentSubtitle ? (
                  <p className="text-sm text-[var(--vd-muted-fg)] font-bold mt-1 uppercase tracking-wider">
                    {props.commitmentSubtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {items.map((item, i) => (
                  <div
                    key={`${item}-${i}`}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[var(--vd-border)] hover:border-[var(--vd-primary)]/30 hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--vd-primary)]/15 text-[var(--vd-primary)] flex items-center justify-center shrink-0 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-[var(--vd-muted-fg)] font-bold text-sm leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export const staysDifferenceConfig: ComponentConfig<StaysDifferenceProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' },
    lead: { type: 'textarea' },
    body: { type: 'textarea' },
    commitmentTitle: { type: 'text' },
    commitmentSubtitle: { type: 'text' },
    commitmentItems: { type: 'array', arrayFields: { value: { type: 'text' } } }
  },
  defaultProps: {
    title: '',
    accent: '',
    lead: '',
    body: '',
    commitmentTitle: '',
    commitmentSubtitle: '',
    commitmentItems: []
  },
  render: (props) => StaysDifference(props) as any
};
