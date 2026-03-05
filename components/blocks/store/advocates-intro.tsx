import type { ComponentConfig } from '@measured/puck';
import { Leaf } from 'lucide-react';

export type AdvocatesIntroProps = {
  title?: string;
  accent?: string;
  description?: string;
  missionLabel?: string;
  mission?: string;
};

export function AdvocatesIntro(props: AdvocatesIntroProps) {
  const hasHeader = Boolean(props.title || props.accent || props.description);
  const hasMission = Boolean(props.mission || props.missionLabel);

  if (!hasHeader && !hasMission) return null;

  return (
    <section className="mb-12 max-w-4xl mx-auto">
      {hasHeader ? (
        <div className="space-y-4 mb-8">
          {props.title || props.accent ? (
            <h3 className="text-4xl font-black uppercase tracking-tighter text-[var(--vd-fg)] leading-[0.9]">
              {props.title}{' '}
              {props.accent ? (
                <span className="text-[var(--vd-primary)] italic font-display font-normal">{props.accent}</span>
              ) : null}
            </h3>
          ) : null}
          {props.description ? (
            <p className="text-xl font-bold text-[var(--vd-fg)]/90 leading-tight">{props.description}</p>
          ) : null}
        </div>
      ) : null}

      {props.mission ? (
        <div className="p-8 md:p-12 bg-[var(--vd-fg)] text-white rounded-[2.5rem] relative overflow-hidden border border-[var(--vd-fg)] shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Leaf className="h-10 w-10" />
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
      ) : null}
    </section>
  );
}

export const advocatesIntroConfig: ComponentConfig<AdvocatesIntroProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' },
    description: { type: 'textarea' },
    missionLabel: { type: 'text' },
    mission: { type: 'textarea' }
  },
  defaultProps: {
    title: '',
    accent: '',
    description: '',
    missionLabel: '',
    mission: ''
  },
  render: (props) => AdvocatesIntro(props) as any
};
