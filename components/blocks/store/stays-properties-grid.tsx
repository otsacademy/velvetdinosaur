/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Heart, Home, MapPin } from 'lucide-react';
import type { ComponentConfig } from '@measured/puck';
import { listStays } from '@/lib/content/stays';

export type StaysPropertiesGridProps = {
  title?: string;
  accent?: string;
};

function formatPrice(price?: number, startingFrom?: boolean) {
  if (!price) return '';
  const prefix = startingFrom ? 'Starting From ' : '';
  return `${prefix}£${price}`;
}

export async function StaysPropertiesGrid(props: StaysPropertiesGridProps) {
  const stays = await listStays();
  if (!stays.length) return null;

  return (
    <section className="mb-32">
      <div className="flex items-center gap-4 mb-12">
        {props.title || props.accent ? (
          <h3 className="text-3xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">
            {props.title}{' '}
            {props.accent ? (
              <span className="text-[var(--vd-primary)] italic font-display font-normal lowercase">
                {props.accent}
              </span>
            ) : null}
          </h3>
        ) : null}
        <div className="h-[2px] flex-1 bg-[var(--vd-muted)]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stays.map((stay) => (
          <Link
            key={stay.slug}
            href={`/stays/${stay.slug}`}
            className="group bg-white rounded-[2.5rem] overflow-hidden border border-[var(--vd-border)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {stay.heroImage ? (
                <img
                  src={stay.heroImage}
                  alt={stay.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-[var(--vd-muted)]" />
              )}
              {stay.price ? (
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider text-[var(--vd-fg)] shadow-lg">
                  {formatPrice(stay.price, stay.isStartingFrom)}
                  <span className="text-[var(--vd-muted-fg)] font-normal ml-1">/night</span>
                </div>
              ) : null}
              <div className="absolute top-4 right-4 p-3 bg-white/50 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-[var(--vd-primary)] transition-all">
                <Heart className="h-4 w-4" />
              </div>
            </div>
            <div className="p-8 space-y-4">
              <h4 className="font-black text-lg text-[var(--vd-fg)] leading-tight group-hover:text-[var(--vd-primary)] transition-colors h-14 line-clamp-2">
                {stay.name}
              </h4>
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--vd-border)]">
                {stay.location ? (
                  <p className="flex items-center gap-2 text-xs text-[var(--vd-muted-fg)] font-bold uppercase tracking-widest">
                    <MapPin className="h-3.5 w-3.5" /> {stay.location}
                  </p>
                ) : null}
                {stay.type ? (
                  <p className="flex items-center gap-2 text-xs text-[var(--vd-muted-fg)] font-bold uppercase tracking-widest">
                    <Home className="h-3.5 w-3.5" /> {stay.type}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export const staysPropertiesGridConfig: ComponentConfig<StaysPropertiesGridProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' }
  },
  defaultProps: {
    title: '',
    accent: ''
  },
  render: (props) => StaysPropertiesGrid(props) as any
};
