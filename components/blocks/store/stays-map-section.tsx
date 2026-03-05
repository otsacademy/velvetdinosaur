/* eslint-disable @next/next/no-img-element */
import { ChevronRight, Pin } from 'lucide-react';
import type { ComponentConfig } from '@measured/puck';

export type StaysMapSectionProps = {
  buttonLabel?: string;
};

export function StaysMapSection(props: StaysMapSectionProps) {
  if (!props.buttonLabel) return null;
  return (
    <section className="relative h-[500px] w-full bg-[var(--vd-muted)] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl group">
      <div className="absolute inset-0 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop"
          className="w-full h-full object-cover"
          alt="World Map"
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          <div className="absolute top-1/2 left-[48%] animate-bounce">
            <div className="w-10 h-10 bg-[var(--vd-primary)] rounded-full border-4 border-white shadow-xl flex items-center justify-center text-[var(--vd-primary-fg)]">
              <Pin className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-[45%] left-[52%] animate-bounce delay-75">
            <div className="w-10 h-10 bg-[var(--vd-primary)] rounded-full border-4 border-white shadow-xl flex items-center justify-center text-[var(--vd-primary-fg)]">
              <Pin className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <button className="px-10 py-4 bg-white/90 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.3em] text-[var(--vd-fg)] hover:text-[var(--vd-primary)] hover:bg-white shadow-2xl transition-all border border-white/50 hover:-translate-y-1" type="button">
          <span className="flex items-center gap-3">
            {props.buttonLabel} <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </section>
  );
}

export const staysMapSectionConfig: ComponentConfig<StaysMapSectionProps> = {
  fields: {
    buttonLabel: { type: 'text' }
  },
  defaultProps: {
    buttonLabel: ''
  },
  render: (props) => StaysMapSection(props) as any
};
