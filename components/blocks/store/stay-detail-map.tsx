/* eslint-disable @next/next/no-img-element */
import type { ComponentConfig } from '@measured/puck';
import { getStayBySlug } from '@/lib/content/stays';
import { Pin } from 'lucide-react';

export type StayDetailMapProps = {
  staySlug?: string;
};

export async function StayDetailMap(props: StayDetailMapProps) {
  const stay = props.staySlug ? await getStayBySlug(props.staySlug) : null;
  if (!stay) return null;
  return (
    <section className="mt-24">
      <div className="h-[450px] w-full bg-neutral-200 rounded-[3rem] overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl border-4 border-white">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop"
          className="w-full h-full object-cover"
          alt="Map Location"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-[var(--vd-primary)] rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-[var(--vd-primary-fg)] animate-bounce">
            <Pin className="h-6 w-6" />
          </div>
        </div>
        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-xl">
          <p className="text-sm font-black text-[var(--vd-fg)]">
            {stay.address?.city}, {stay.address?.country}
          </p>
        </div>
      </div>
    </section>
  );
}

export const stayDetailMapConfig: ComponentConfig<StayDetailMapProps> = {
  fields: {
    staySlug: { type: 'text' }
  },
  defaultProps: {
    staySlug: ''
  },
  render: (props) => StayDetailMap(props) as any
};
