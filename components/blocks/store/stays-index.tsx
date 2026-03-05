/* eslint-disable @next/next/no-img-element */
import { Heart, Home, MapPin } from 'lucide-react';
import type { ComponentConfig } from '@measured/puck';
import { listStays } from '@/lib/content/stays';

export type StaysIndexProps = {
  title?: string;
  description?: string;
  limit?: number;
  showPrice?: 'true' | 'false';
};

export async function StaysIndex(props: StaysIndexProps) {
  const stays = await listStays();
  const limit = props.limit && props.limit > 0 ? props.limit : stays.length;
  const visible = stays.slice(0, limit);
  const showPrice = props.showPrice === 'true';

  return (
    <section className="mb-32">
      <div className="flex items-center gap-4 mb-12">
        {props.title ? (
          <h3 className="text-3xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">
            {props.title}
          </h3>
        ) : null}
        <div className="h-[2px] flex-1 bg-[var(--vd-muted)]" />
      </div>
      {props.description ? (
        <p className="text-sm text-[var(--vd-muted-fg)] max-w-2xl mb-8">{props.description}</p>
      ) : null}
      {visible.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {visible.map((stay) => (
            <article
              key={stay.slug}
              className="group bg-white rounded-[2.5rem] overflow-hidden border border-[var(--vd-border)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {stay.heroImage ? (
                  <img
                    src={stay.heroImage}
                    alt={stay.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--vd-muted)]" />
                )}
                {showPrice && stay.price ? (
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider text-[var(--vd-fg)] shadow-lg">
                    {stay.isStartingFrom ? 'Starting From ' : ''}£{stay.price}
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
          </article>
        ))}
      </div>
    )}
    </section>
  );
}

export const staysIndexConfig: ComponentConfig<StaysIndexProps> = {
  fields: {
    title: { type: 'text' },
    description: { type: 'textarea' },
    limit: { type: 'number' },
    showPrice: {
      type: 'select',
      options: [
        { label: 'Show price', value: 'true' },
        { label: 'Hide price', value: 'false' }
      ]
    }
  },
  defaultProps: {
    title: '',
    description: '',
    limit: 0,
    showPrice: 'false'
  },
  render: (props) => StaysIndex(props) as any
};
