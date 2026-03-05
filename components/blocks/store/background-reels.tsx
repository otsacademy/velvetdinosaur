import type { ComponentConfig } from '@measured/puck';
import { listVideos } from '@/lib/content/videos';
import type { VideoAsset } from '@/lib/content/types';
import { BackgroundReelsView } from './background-reels.client';

export type BackgroundReelsProps = {
  title?: string;
  accent?: string;
  playLabel?: string;
  watchLabel?: string;
  videoSlugs?: Array<string | { value?: string }>;
};

export async function BackgroundReels(props: BackgroundReelsProps) {
  const videoSlugs = (props.videoSlugs || [])
    .map((item) => (typeof item === 'string' ? item : item?.value))
    .filter((item): item is string => Boolean(item));
  if (videoSlugs.length === 0) return null;
  const allVideos = await listVideos('about');
  const selected: VideoAsset[] = videoSlugs
    .map((slug) => allVideos.find((video) => video.slug === slug))
    .filter((video): video is VideoAsset => Boolean(video));

  const videos = selected.map((video) => ({
    slug: video.slug,
    title: video.title,
    videoId: video.videoId
  }));

  return (
    <BackgroundReelsView
      title={props.title}
      accent={props.accent}
      playLabel={props.playLabel}
      watchLabel={props.watchLabel}
      videos={videos}
    />
  );
}

export const backgroundReelsConfig: ComponentConfig<BackgroundReelsProps> = {
  fields: {
    title: { type: 'text' },
    accent: { type: 'text' },
    playLabel: { type: 'text' },
    watchLabel: { type: 'text' },
    videoSlugs: { type: 'array', arrayFields: { value: { type: 'text' } } }
  },
  defaultProps: {
    title: '',
    accent: '',
    playLabel: '',
    watchLabel: '',
    videoSlugs: []
  },
  render: (props) => BackgroundReels(props) as any
};
