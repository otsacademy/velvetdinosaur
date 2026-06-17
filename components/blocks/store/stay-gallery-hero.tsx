import Link from 'next/link';
import type { ComponentConfig } from '@measured/puck';
import { getStayBySlug } from '@/lib/content/stays';
import { ChevronLeft } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

export type StayGalleryHeroProps = {
  staySlug?: string;
  backHref?: string;
  buttonLabel?: string;
};

export async function StayGalleryHero(props: StayGalleryHeroProps) {
  const stay = props.staySlug ? await getStayBySlug(props.staySlug) : null;
  if (!stay) return null;

  const gallery = stay.gallery || [];
  const hero = stay.heroImage || gallery[0];
  const first = gallery[0] || hero;
  const second = gallery[1] || hero;
  const third = gallery[2] || hero;
  const fourth = stay.heroImage || hero;

  return (
    <div className="relative h-[60vh] bg-neutral-100 overflow-hidden group">
      <div className="grid grid-cols-4 h-full gap-1">
        <div className="col-span-2 h-full relative">
          {first ? (
            <OptimizedImage
              src={first}
              alt={stay.name}
              fill
              priority
              className="object-cover"
              sizes="50vw"
              imageOptions={{ width: 960, height: 600, fit: 'cover' }}
            />
          ) : null}
          <div className="absolute top-6 left-6 z-20">
            <Link
              href={props.backHref || '/stays'}
              className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg hover:scale-105"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="col-span-1 h-full flex flex-col gap-1">
          {second ? (
            <div className="relative w-full h-1/2">
              <OptimizedImage
                src={second}
                alt="Detail 1"
                fill
                className="object-cover"
                sizes="25vw"
                imageOptions={{ width: 480, height: 300, fit: 'cover' }}
              />
            </div>
          ) : null}
          {third ? (
            <div className="relative w-full h-1/2">
              <OptimizedImage
                src={third}
                alt="Detail 2"
                fill
                className="object-cover"
                sizes="25vw"
                imageOptions={{ width: 480, height: 300, fit: 'cover' }}
              />
            </div>
          ) : null}
        </div>
        <div className="col-span-1 h-full relative">
          {fourth ? (
            <OptimizedImage
              src={fourth}
              alt="Detail 3"
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              sizes="25vw"
              imageOptions={{ width: 480, height: 600, fit: 'cover' }}
            />
          ) : null}
          {props.buttonLabel ? (
            <div className="absolute bottom-6 right-6">
              <button className="px-6 py-3 bg-white/90 backdrop-blur rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-white hover:-translate-y-1 transition-all" type="button">
                {props.buttonLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const stayGalleryHeroConfig: ComponentConfig<StayGalleryHeroProps> = {
  fields: {
    staySlug: { type: 'text' },
    backHref: { type: 'text' },
    buttonLabel: { type: 'text' }
  },
  defaultProps: {
    staySlug: '',
    backHref: '',
    buttonLabel: ''
  },
  render: (props) => StayGalleryHero(props) as any
};
