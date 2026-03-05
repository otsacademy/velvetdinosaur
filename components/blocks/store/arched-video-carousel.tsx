import type { ComponentConfig } from '@measured/puck';
import { listVideos } from '@/lib/content/videos';
import type { VideoAsset } from '@/lib/content/types';
import { ArchedVideoCarouselView } from './arched-video-carousel.client';

export type ArchedVideoCarouselProps = {
  title?: string;
  accent?: string;
  lead?: string;
  videoSlugs?: string[];
  category?: VideoAsset['category'];
  useShortsOverlay?: boolean | 'true' | 'false';
  showOnMobile?: boolean | 'true' | 'false';
};

export async function ArchedVideoCarousel(props: ArchedVideoCarouselProps) {
  const allVideos = await listVideos(props.category);
  const selected =
    props.videoSlugs && props.videoSlugs.length
      ? props.videoSlugs
          .map((slug) => allVideos.find((video) => video.slug === slug))
          .filter((video): video is VideoAsset => Boolean(video))
      : allVideos;

  const useShortsOverlay = props.useShortsOverlay === true || props.useShortsOverlay === 'true';
  const showOnMobile =
    props.showOnMobile === true || props.showOnMobile === 'true'
      ? true
      : props.showOnMobile === 'false'
        ? false
        : true;

  return (
    <ArchedVideoCarouselView
      title={props.title}
      accent={props.accent}
      lead={props.lead}
      videos={selected}
      useShortsOverlay={useShortsOverlay}
      showOnMobile={showOnMobile}
    />
  );
}

export const archedVideoCarouselConfig: ComponentConfig<ArchedVideoCarouselProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' },
    lead: { type: 'textarea' },
    category: {
      type: 'select',
      options: [
        { label: 'About', value: 'about' },
        { label: 'Short', value: 'short' },
        { label: 'Showcase', value: 'showcase' }
      ]
    },
    videoSlugs: { type: 'array', arrayFields: { value: { type: 'text' } } },
    useShortsOverlay: {
      type: 'select',
      options: [
        { label: 'Enable overlay', value: 'true' },
        { label: 'Disable overlay', value: 'false' }
      ]
    },
    showOnMobile: {
      type: 'select',
      options: [
        { label: 'Show on mobile', value: 'true' },
        { label: 'Hide on mobile', value: 'false' }
      ]
    }
  },
  defaultProps: {
    title: '',
    accent: '',
    lead: '',
    category: 'about',
    useShortsOverlay: true,
    showOnMobile: true
  },
  render: (props) => ArchedVideoCarousel(props) as any
};
