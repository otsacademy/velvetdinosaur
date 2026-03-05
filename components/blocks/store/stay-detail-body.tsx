/* eslint-disable @next/next/no-img-element */
import type { ComponentConfig } from '@measured/puck';
import { getLatestStays, getStayBySlug } from '@/lib/content/stays';
import {
  Bath,
  Bed,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Info,
  Linkedin,
  MapPin,
  Music,
  Pin,
  User,
  Youtube,
  Instagram
} from 'lucide-react';
import { StayVideoSectionView } from './stay-video-section.client';

export type StayDetailBodyProps = {
  staySlug?: string;
};

function formatPrice(price?: number) {
  if (!price) return '';
  return `£${price}`;
}

export async function StayDetailBody(props: StayDetailBodyProps) {
  const stay = props.staySlug ? await getStayBySlug(props.staySlug) : null;
  if (!stay) return null;

  const latestListings = await getLatestStays({ excludeSlug: stay.slug, limit: 3 });
  const videoPoster = stay.gallery?.[0] || stay.heroImage;

  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <div className="border-b border-neutral-100 pb-10">
            <h1 className="text-4xl sm:text-5xl font-display font-black text-[var(--vd-fg)] mb-6 leading-tight">
              {stay.name}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm text-[var(--vd-muted-fg)] font-bold uppercase tracking-wide">
              {stay.type ? (
                <span className="flex items-center gap-2 px-3 py-1 bg-neutral-50 rounded-full">
                  <Home className="h-4 w-4" /> {stay.type}
                </span>
              ) : null}
              {stay.details?.guests ? (
                <span className="flex items-center gap-2 px-3 py-1 bg-neutral-50 rounded-full">
                  <User className="h-4 w-4" /> {stay.details.guests} Guests
                </span>
              ) : null}
              {stay.details?.bedrooms ? (
                <span className="flex items-center gap-2 px-3 py-1 bg-neutral-50 rounded-full">
                  <Bed className="h-4 w-4" /> {stay.details.bedrooms} Bedrooms
                </span>
              ) : null}
            </div>
          </div>

          {stay.description ? (
            <div className="prose prose-neutral prose-lg max-w-none text-[var(--vd-muted-fg)] leading-relaxed whitespace-pre-wrap font-medium">
              <h3 className="text-xl font-black text-[var(--vd-fg)] mb-6 uppercase tracking-tight">Description</h3>
              {stay.description}
            </div>
          ) : null}

          {stay.gallery && stay.gallery.length > 1 ? (
            <div className="grid grid-cols-1 gap-8">
              {stay.gallery.slice(1).map((img, i) => (
                <div key={`${stay.slug}-gallery-${i}`} className="rounded-3xl overflow-hidden aspect-video shadow-lg">
                  <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          ) : null}

          <StayVideoSectionView videoId={stay.videoId} poster={videoPoster} />

          <div className="space-y-8">
            {stay.address ? (
              <div className="p-8 bg-white rounded-3xl border border-neutral-100 shadow-lg hover:shadow-xl transition-shadow">
                <h4 className="flex items-center gap-3 font-black uppercase text-xs text-[var(--vd-primary)] mb-6 tracking-widest">
                  <span className="p-2 bg-[var(--vd-primary)]/15 rounded-lg text-[var(--vd-primary)]">
                    <MapPin className="h-4 w-4" />
                  </span>{' '}
                  Address Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base text-[var(--vd-muted-fg)]">
                  <div>
                    <span className="font-bold text-[var(--vd-fg)] block mb-1">Address</span>{' '}
                    {stay.address.address}, {stay.address.city}, {stay.address.country}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--vd-fg)] block mb-1">Area</span> {stay.address.area}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--vd-fg)] block mb-1">Zip Code</span> {stay.address.zip}
                  </div>
                </div>
              </div>
            ) : null}

            {stay.amenities && stay.amenities.length > 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-neutral-100 shadow-lg hover:shadow-xl transition-shadow">
                <h4 className="flex items-center gap-3 font-black uppercase text-xs text-[var(--vd-primary)] mb-6 tracking-widest">
                  <span className="p-2 bg-[var(--vd-primary)]/15 rounded-lg text-[var(--vd-primary)]">
                    <Check className="h-4 w-4" />
                  </span>{' '}
                  Property Features
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {stay.amenities.map((feature, i) => (
                    <div key={`${stay.slug}-feature-${i}`} className="flex items-center gap-3 text-base text-[var(--vd-muted-fg)] font-medium">
                      <span className="text-[var(--vd-primary)] bg-[var(--vd-primary)]/15 rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </span>{' '}
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {stay.policies && stay.policies.length > 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-neutral-100 shadow-lg hover:shadow-xl transition-shadow">
                <h4 className="flex items-center gap-3 font-black uppercase text-xs text-[var(--vd-primary)] mb-6 tracking-widest">
                  <span className="p-2 bg-[var(--vd-primary)]/15 rounded-lg text-[var(--vd-primary)]">
                    <Info className="h-4 w-4" />
                  </span>{' '}
                  Terms & Conditions
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {stay.policies.map((policy, i) => (
                    <div key={`${stay.slug}-policy-${i}`} className="flex items-center gap-3 text-base text-[var(--vd-muted-fg)] font-medium">
                      <span className="text-neutral-400 bg-neutral-50 rounded-full p-1">
                        <Info className="h-3 w-3" />
                      </span>{' '}
                      {policy}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="p-8 bg-white rounded-3xl border border-neutral-100 shadow-lg">
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--vd-fg)] mb-8">Availability</h3>
            <div className="flex items-center justify-between mb-6">
              <button className="p-3 hover:bg-neutral-100 rounded-full transition-colors" type="button">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-lg text-[var(--vd-fg)]">December 2025</span>
              <button className="p-3 hover:bg-neutral-100 rounded-full transition-colors" type="button">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
                <span key={day} className="text-xs font-black text-neutral-400 uppercase">
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day) => (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm border ${
                    day > 22
                      ? 'bg-neutral-50 text-neutral-300 border-transparent'
                      : 'bg-white border-neutral-100 hover:border-[var(--vd-primary)] hover:shadow-md cursor-pointer transition-all'
                  }`}
                >
                  <span className="font-bold">{day}</span>
                  {day <= 22 && stay.price ? (
                    <span className="text-[10px] font-bold text-[var(--vd-primary)]">£{stay.price}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-8">
            <div className="bg-white border border-neutral-100 shadow-2xl rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
              <div className="bg-[var(--vd-primary)] text-[var(--vd-primary-fg)] p-6 text-center">
                <p className="font-black text-2xl">
                  {stay.isStartingFrom ? 'From ' : ''}{formatPrice(stay.price)}{' '}
                  <span className="text-sm font-bold opacity-80 uppercase tracking-wide">/ night</span>
                </p>
              </div>
              <div className="p-8 space-y-5">
                <h4 className="font-black text-sm uppercase tracking-widest text-[var(--vd-fg)]">Check Availability</h4>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-4 text-sm font-medium bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[var(--vd-primary)] focus:ring-2 focus:ring-[var(--vd-primary)]/20 transition-all"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full p-4 text-sm font-medium bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[var(--vd-primary)] focus:ring-2 focus:ring-[var(--vd-primary)]/20 transition-all"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Check-in"
                      className="w-full pl-10 p-4 text-sm font-medium bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[var(--vd-primary)] focus:ring-2 focus:ring-[var(--vd-primary)]/20 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Check-out"
                      className="w-full pl-10 p-4 text-sm font-medium bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[var(--vd-primary)] focus:ring-2 focus:ring-[var(--vd-primary)]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Guests"
                    className="w-full pl-10 p-4 text-sm font-medium bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[var(--vd-primary)] focus:ring-2 focus:ring-[var(--vd-primary)]/20 transition-all"
                  />
                </div>

                <textarea
                  placeholder="Your message"
                  rows={3}
                  className="w-full p-4 text-sm font-medium bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[var(--vd-primary)] focus:ring-2 focus:ring-[var(--vd-primary)]/20 transition-all resize-none"
                />

                <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl">
                  <input type="checkbox" id="gdpr" className="rounded text-[var(--vd-primary)] focus:ring-[var(--vd-primary)] w-4 h-4" />
                  <label htmlFor="gdpr" className="text-xs font-bold text-neutral-500">
                    I consent to the GDPR Terms
                  </label>
                </div>

                <button className="w-full py-4 bg-neutral-900 hover:bg-[var(--vd-primary)] text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1" type="button">
                  Send Message
                </button>
                <button className="w-full py-4 bg-white border border-neutral-200 text-neutral-900 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neutral-50 transition-colors" type="button">
                  Add to Favorites
                </button>

                <div className="flex items-center justify-center gap-6 pt-4 text-neutral-400">
                  <span className="text-xs font-black uppercase tracking-widest">Share</span>
                  {[
                    { icon: Linkedin, href: 'https://www.linkedin.com/in/thebrave/' },
                    { icon: Pin, href: 'https://uk.pinterest.com/fayethebrave/' },
                    { icon: Youtube, href: 'https://www.youtube.com/@faye.thebrave' },
                    { icon: Instagram, href: 'https://www.instagram.com/faye.thebrave/' },
                    { icon: Music, href: 'https://www.tiktok.com/@the.brave.travels' }
                  ].map(({ icon: Icon, href }, i) => (
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--vd-primary)] hover:scale-110 transition-all">
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-lg">
              <h4 className="font-black text-sm uppercase tracking-widest text-[var(--vd-fg)] mb-6">Advanced Search</h4>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Where do you want to go?"
                    className="w-full pl-10 p-4 text-sm font-medium border border-neutral-200 rounded-xl focus:border-[var(--vd-primary)] focus:ring-2 focus:ring-[var(--vd-primary)]/20 outline-none transition-all"
                  />
                </div>
                <button className="w-full py-4 bg-[var(--vd-primary)] text-[var(--vd-primary-fg)] font-black text-xs rounded-xl uppercase tracking-widest hover:shadow-lg transition-all" type="button">
                  Search
                </button>
              </div>
            </div>

            <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-lg">
              <h4 className="font-black text-sm uppercase tracking-widest text-[var(--vd-fg)] mb-6">Latest Listings</h4>
              <div className="space-y-6">
                {latestListings.map((listing) => (
                  <div key={listing.slug} className="flex gap-4 group cursor-pointer hover:bg-neutral-50 p-2 -mx-2 rounded-xl transition-colors">
                    {listing.heroImage ? <img src={listing.heroImage} alt="" className="w-20 h-16 object-cover rounded-xl shadow-sm" /> : null}
                    <div>
                      <h5 className="text-sm font-bold text-[var(--vd-fg)] group-hover:text-[var(--vd-primary)] transition-colors line-clamp-1">
                        {listing.name}
                      </h5>
                      {listing.location ? (
                        <p className="text-xs text-[var(--vd-muted-fg)] font-medium mb-1">{listing.location}</p>
                      ) : null}
                      {listing.price ? (
                        <p className="text-xs font-black text-[var(--vd-fg)] bg-[var(--vd-primary)]/10 inline-block px-2 py-0.5 rounded">
                          £{listing.price} <span className="font-normal text-[var(--vd-muted-fg)]">/night</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const stayDetailBodyConfig: ComponentConfig<StayDetailBodyProps> = {
  fields: {
    staySlug: { type: 'text' }
  },
  defaultProps: {
    staySlug: ''
  },
  render: (props) => StayDetailBody(props) as any
};
