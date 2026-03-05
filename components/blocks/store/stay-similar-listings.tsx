/* eslint-disable @next/next/no-img-element */
import type { ComponentConfig } from '@measured/puck';
import { getSimilarStays } from '@/lib/content/stays';
import { Home, MapPin } from 'lucide-react';

export type StaySimilarListingsProps = {
  staySlug?: string;
  title?: string;
};

export async function StaySimilarListings(props: StaySimilarListingsProps) {
  const similar = await getSimilarStays({ staySlug: props.staySlug, limit: 3 });
  if (!similar.length) return null;

  return (
    <section className="mt-24 border-t border-neutral-100 pt-16">
      <h3 className="text-3xl font-black uppercase tracking-tighter text-[var(--vd-fg)] mb-10">{props.title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
        {similar.map((listing) => (
          <div key={listing.slug} className="group cursor-pointer">
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 relative shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
              {listing.heroImage ? (
                <img src={listing.heroImage} alt={listing.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : null}
              {listing.price ? (
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[var(--vd-fg)] text-xs font-black uppercase tracking-wider">
                  £{listing.price}{' '}
                  <span className="font-normal opacity-60 normal-case">/night</span>
                </div>
              ) : null}
            </div>
            <h4 className="font-black text-lg text-[var(--vd-fg)] group-hover:text-[var(--vd-primary)] transition-colors mb-2">
              {listing.name}
            </h4>
            <div className="flex flex-col gap-1">
              {listing.location ? (
                <p className="text-xs text-[var(--vd-muted-fg)] font-bold uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> {listing.location}
                </p>
              ) : null}
              {listing.type ? (
                <p className="text-xs text-[var(--vd-muted-fg)] font-bold uppercase tracking-widest flex items-center gap-2">
                  <Home className="h-3.5 w-3.5" /> {listing.type}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export const staySimilarListingsConfig: ComponentConfig<StaySimilarListingsProps> = {
  fields: {
    staySlug: { type: 'text' },
    title: { type: 'text' }
  },
  defaultProps: {
    staySlug: '',
    title: 'Similar Listings'
  },
  render: (props) => StaySimilarListings(props) as any
};
