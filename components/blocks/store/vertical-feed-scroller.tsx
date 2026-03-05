import type { ComponentConfig } from '@measured/puck';
import { listVideos } from '@/lib/content/videos';
import type { VideoAsset } from '@/lib/content/types';
import { VerticalFeedScrollerView } from './vertical-feed-scroller.client';

export type VerticalFeedScrollerProps = {
  title?: string;
  lead?: string;
  videoSlugs?: string[];
  category?: VideoAsset['category'];
  height?: number;
  useShortsOverlay?: boolean | 'true' | 'false';
  showOnDesktop?: boolean | 'true' | 'false';
};

export async function VerticalFeedScroller(props: VerticalFeedScrollerProps) {
  const all = await listVideos(props.category || 'short');
  const selected =
    props.videoSlugs && props.videoSlugs.length
      ? props.videoSlugs
          .map((slug) => all.find((video) => video.slug === slug))
          .filter((video): video is VideoAsset => Boolean(video))
      : all;

  const height = props.height || 600;
  const useShortsOverlay = props.useShortsOverlay === true || props.useShortsOverlay === 'true';
  const showOnDesktop =
    props.showOnDesktop === true || props.showOnDesktop === 'true'
      ? true
      : props.showOnDesktop === 'false'
        ? false
        : false;

  return (
    <VerticalFeedScrollerView
      title={props.title}
      lead={props.lead}
      videos={selected}
      height={height}
      useShortsOverlay={useShortsOverlay}
      showOnDesktop={showOnDesktop}
    />
  );
}

export const verticalFeedScrollerConfig: ComponentConfig<VerticalFeedScrollerProps> = {
  fields: {
    title: { type: 'text' },
    lead: { type: 'textarea' },
    category: {
      type: 'select',
      options: [
        { label: 'Short', value: 'short' },
        { label: 'About', value: 'about' },
        { label: 'Showcase', value: 'showcase' }
      ]
    },
    videoSlugs: { type: 'array', arrayFields: { value: { type: 'text' } } },
    height: { type: 'number' },
    useShortsOverlay: {
      type: 'select',
      options: [
        { label: 'Enable overlay', value: 'true' },
        { label: 'Disable overlay', value: 'false' }
      ]
    },
    showOnDesktop: {
      type: 'select',
      options: [
        { label: 'Mobile only', value: 'false' },
        { label: 'Show on desktop', value: 'true' }
      ]
    }
  },
  defaultProps: {
    title: '',
    lead: '',
    category: 'short',
    height: 600,
    useShortsOverlay: true,
    showOnDesktop: false
  },
  render: (props) => VerticalFeedScroller(props) as any
};
