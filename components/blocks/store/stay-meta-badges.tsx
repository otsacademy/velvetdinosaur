import { getStayBySlug } from '@/lib/content/stays';
import type { ComponentConfig } from '@measured/puck';
import { Bath, Bed, Home, MapPin, Users } from 'lucide-react';

export type StayMetaBadgesProps = {
  staySlug?: string;
  title?: string;
  subtitle?: string;
  badges?: string[];
  usePolicies?: boolean | 'true' | 'false';
};

export async function StayMetaBadges(props: StayMetaBadgesProps) {
  const stay = props.staySlug ? await getStayBySlug(props.staySlug) : null;
  const usePolicies =
    props.usePolicies === true || props.usePolicies === 'true'
      ? true
      : props.usePolicies === 'false'
        ? false
        : false;
  const badgeSource = usePolicies ? stay?.policies : stay?.badges || stay?.amenities;
  const badges = (props.badges && props.badges.length > 0 ? props.badges : badgeSource) || [];

  if (
    !props.title &&
    !props.subtitle &&
    !stay?.name &&
    !stay?.location &&
    !stay?.type &&
    !stay?.details &&
    badges.length === 0
  ) {
    return null;
  }

  return (
    <section className="border-b border-[var(--vd-border)] pb-10">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-display font-black text-[var(--vd-fg)] leading-tight">
          {props.title || stay?.name || ''}
        </h1>
        {props.subtitle || stay?.location ? (
          <p className="text-sm text-[var(--vd-muted-fg)]">{props.subtitle || stay?.location}</p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--vd-muted-fg)] font-bold uppercase tracking-wide">
        {stay?.type ? (
          <span className="flex items-center gap-2 px-3 py-1 bg-[var(--vd-muted)] rounded-full">
            <Home className="h-4 w-4" /> {stay.type}
          </span>
        ) : null}
        {stay?.details?.guests ? (
          <span className="flex items-center gap-2 px-3 py-1 bg-[var(--vd-muted)] rounded-full">
            <Users className="h-4 w-4" /> {stay.details.guests} Guests
          </span>
        ) : null}
        {stay?.details?.bedrooms ? (
          <span className="flex items-center gap-2 px-3 py-1 bg-[var(--vd-muted)] rounded-full">
            <Bed className="h-4 w-4" /> {stay.details.bedrooms} Bedrooms
          </span>
        ) : null}
        {stay?.details?.bathrooms ? (
          <span className="flex items-center gap-2 px-3 py-1 bg-[var(--vd-muted)] rounded-full">
            <Bath className="h-4 w-4" /> {stay.details.bathrooms} Baths
          </span>
        ) : null}
        {stay?.location ? (
          <span className="flex items-center gap-2 px-3 py-1 bg-[var(--vd-muted)] rounded-full">
            <MapPin className="h-4 w-4" /> {stay.location}
          </span>
        ) : null}
      </div>

      {badges.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[var(--vd-border)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--vd-muted-fg)]"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export const stayMetaBadgesConfig: ComponentConfig<StayMetaBadgesProps> = {
  fields: {
    staySlug: { type: 'text' },
    title: { type: 'text' },
    subtitle: { type: 'textarea' },
    badges: { type: 'array', arrayFields: { value: { type: 'text' } } },
    usePolicies: {
      type: 'select',
      options: [
        { label: 'Use policies', value: 'true' },
        { label: 'Use badges/amenities', value: 'false' }
      ]
    }
  },
  defaultProps: {
    title: '',
    subtitle: '',
    badges: [],
    usePolicies: false
  },
  render: (props) => StayMetaBadges(props) as any
};
