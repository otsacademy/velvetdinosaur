'use client';
import type { ComponentConfig } from '@puckeditor/core';
import {
  AdvocatesCharitiesPreview as _AdvocatesCharities,
  AdvocatesDirectoryPreview as _AdvocatesDirectory,
  AdvocatesGridPreview as _AdvocatesGrid,
  AdvocatesVideoCarouselPreview as _AdvocatesVideoCarousel,
  ArchedVideoCarouselPreview as _ArchedVideoCarousel,
  BackgroundReelsPreview as _BackgroundReels,
  CtaLinksPreview as _CtaLinks,
  GuestNotesPreview as _GuestNotes,
  PricePanelPreview as _PricePanel,
  StayDetailBodyPreview as _StayDetailBody,
  StayDetailMapPreview as _StayDetailMap,
  StayGalleryHeroPreview as _StayGalleryHero,
  StayMetaBadgesPreview as _StayMetaBadges,
  StaySimilarListingsPreview as _StaySimilarListings,
  StaysIndexPreview as _StaysIndex,
  StaysPropertiesGridPreview as _StaysPropertiesGrid,
  StaysVideoCarouselPreview as _StaysVideoCarousel,
  TestimonialsListPreview as _TestimonialsList,
  VerticalFeedScrollerPreview as _VerticalFeedScroller
} from './index.stub';

type PreviewProps = Record<string, unknown>;
type PreviewRender = NonNullable<ComponentConfig<PreviewProps>['render']>;

const asPreviewRender = (render: (props: PreviewProps) => unknown) =>
  render as unknown as PreviewRender;

/** Site-owned map of store-block preview renders consumed by puck/registry.client. */
export const storeBlockPreviewRenders: Record<string, PreviewRender> = {
  ArchedVideoCarousel: asPreviewRender(_ArchedVideoCarousel),
  VerticalFeedScroller: asPreviewRender(_VerticalFeedScroller),
  BackgroundReels: asPreviewRender(_BackgroundReels),
  AdvocatesVideoCarousel: asPreviewRender(_AdvocatesVideoCarousel),
  StaysVideoCarousel: asPreviewRender(_StaysVideoCarousel),
  AdvocatesGrid: asPreviewRender(_AdvocatesGrid),
  AdvocatesDirectory: asPreviewRender(_AdvocatesDirectory),
  AdvocatesCharities: asPreviewRender(_AdvocatesCharities),
  TestimonialsList: asPreviewRender(_TestimonialsList),
  GuestNotes: asPreviewRender(_GuestNotes),
  StaysIndex: asPreviewRender(_StaysIndex),
  StaysPropertiesGrid: asPreviewRender(_StaysPropertiesGrid),
  StayGalleryHero: asPreviewRender(_StayGalleryHero),
  StayMetaBadges: asPreviewRender(_StayMetaBadges),
  StayDetailBody: asPreviewRender(_StayDetailBody),
  StayDetailMap: asPreviewRender(_StayDetailMap),
  PricePanel: asPreviewRender(_PricePanel),
  CtaLinks: asPreviewRender(_CtaLinks),
  StaySimilarListings: asPreviewRender(_StaySimilarListings)
};
