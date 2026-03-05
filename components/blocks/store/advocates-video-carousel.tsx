import type { ComponentConfig } from '@measured/puck';
import { listVideos } from '@/lib/content/videos';
import type { VideoAsset } from '@/lib/content/types';
import { AdvocatesVideoCarouselView } from './advocates-video-carousel.client';

export type AdvocatesVideoCarouselProps = {
  title?: string;
  accent?: string;
  videoSlugs?: string[];
};

export async function AdvocatesVideoCarousel(props: AdvocatesVideoCarouselProps) {
  if (!props.videoSlugs || props.videoSlugs.length === 0) return null;
  const allVideos = await listVideos();
  const selected: VideoAsset[] = props.videoSlugs
    .map((slug) => allVideos.find((video) => video.slug === slug))
    .filter((video): video is VideoAsset => Boolean(video));

  const videos = selected.map((video) => ({
    slug: video.slug,
    title: video.title,
    videoId: video.videoId
  }));

  return <AdvocatesVideoCarouselView title={props.title} accent={props.accent} videos={videos} />;
}

export const advocatesVideoCarouselConfig: ComponentConfig<AdvocatesVideoCarouselProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' },
    videoSlugs: { type: 'array', arrayFields: { value: { type: 'text' } } }
  },
  defaultProps: {
    title: '',
    accent: '',
    videoSlugs: []
  },
  render: (props) => AdvocatesVideoCarousel(props) as any
};
