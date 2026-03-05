/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { VideoAsset } from '@/lib/content/types';
import { cn } from '@/lib/utils';
import { openShorts } from '@/lib/shorts/store';

type ArchedVideoCarouselViewProps = {
  title?: string;
  accent?: string;
  lead?: string;
  videos: VideoAsset[];
  useShortsOverlay?: boolean;
  showOnMobile?: boolean;
};

function getPoster(video: VideoAsset) {
  if (video.thumbnail) return video.thumbnail;
  if (video.videoId) return `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
  return '';
}

export function ArchedVideoCarouselView({
  title,
  accent,
  lead,
  videos,
  useShortsOverlay,
  showOnMobile = true
}: ArchedVideoCarouselViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasHeader = Boolean(title || accent || lead);
  const showSeriesLabel = videos.length > 0 && videos.every((video) => video.category === 'about');

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const target = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
    scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
  };

  const openOverlay = (slug?: string) => {
    if (!useShortsOverlay) return;
    openShorts({ shorts: videos, startSlug: slug });
  };

  if (videos.length === 0) return null;

  return (
    <section
      className={cn(
        'px-6 sm:px-12 mb-20 overflow-hidden max-w-7xl mx-auto pt-6',
        showOnMobile ? '' : 'hidden md:block'
      )}
    >
      {hasHeader ? (
        <>
          <div className="mb-8 flex items-end gap-4 px-2">
            {title || accent ? (
              <h3 className="text-3xl font-black uppercase tracking-tighter text-[var(--vd-fg)] leading-none">
                {title}{' '}
                {accent ? (
                  <span className="text-[var(--vd-primary)] italic font-display font-normal lowercase">
                    {accent}
                  </span>
                ) : null}
              </h3>
            ) : null}
            <div className="h-[2px] flex-1 bg-[var(--vd-muted)] mb-2" />
          </div>
          {lead ? <p className="text-sm text-[var(--vd-muted-fg)] max-w-2xl mb-6">{lead}</p> : null}
        </>
      ) : null}

      <div className="relative -mx-6 sm:-mx-12 overflow-hidden group">
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute -left-4 top-[40%] -translate-y-1/2 z-30 p-3 bg-white text-[var(--vd-fg)] rounded-full transition-all opacity-0 group-hover:opacity-100 hidden sm:block shadow-xl border border-[var(--vd-border)] active:scale-90"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute -right-4 top-[40%] -translate-y-1/2 z-30 p-3 bg-white text-[var(--vd-fg)] rounded-full transition-all opacity-0 group-hover:opacity-100 hidden sm:block shadow-xl border border-[var(--vd-border)] active:scale-90"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar snap-x-mandatory gap-6 px-6 sm:px-12 pb-16 pt-4"
        >
          {videos.map((video, idx) => {
            const centerIdx = (videos.length - 1) / 2;
            const distanceFromCenter = idx - centerIdx;
            const rotation = distanceFromCenter * 3;
            const translationY = Math.abs(distanceFromCenter) * 8;
            const poster = getPoster(video);
            const seriesId = showSeriesLabel ? `a${idx + 1}` : null;
            return (
              <div
                key={video.slug}
                className="flex-shrink-0 w-[220px] sm:w-[280px] snap-center group/card transition-all duration-500 ease-out"
                style={{ transform: `rotate(${rotation}deg) translateY(${translationY}px)` }}
              >
                <button
                  type="button"
                  onClick={() => openOverlay(video.slug)}
                  className={cn(
                    'relative aspect-[9/16] rounded-[2.5rem] overflow-hidden bg-[var(--vd-muted)] border-4 border-white shadow-2xl transition-all duration-300 origin-bottom',
                    useShortsOverlay ? 'cursor-pointer' : 'cursor-default',
                    'group-hover/card:scale-105 group-hover/card:rotate-0 group-hover/card:-translate-y-4 group-hover/card:z-50'
                  )}
                  aria-label={useShortsOverlay ? `Play ${video.title}` : undefined}
                  disabled={!useShortsOverlay}
                >
                  {poster ? (
                    <img
                      src={poster}
                      alt={video.title}
                      className="w-full h-full object-cover transition-all duration-500 group-hover/card:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[var(--vd-muted-fg)]">
                      <Play className="h-6 w-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover/card:bg-black/0 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <div className="p-4 bg-[var(--vd-primary)] rounded-full text-[var(--vd-primary-fg)] shadow-2xl mb-3 scale-110">
                      <Play className="h-5 w-5" />
                    </div>
                  </div>
                  {video.title ? (
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest leading-tight">
                          {video.title}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </button>

                <div className="mt-8 px-2 text-center transition-all duration-300 group-hover/card:opacity-100 opacity-60">
                  <div className="flex flex-col gap-1">
                    {showSeriesLabel && seriesId ? (
                      <span className="text-[10px] text-[var(--vd-primary)] font-black uppercase tracking-[0.2em] mb-1">
                        The Brave / {seriesId}
                      </span>
                    ) : null}
                    <h5 className="text-base font-black text-[var(--vd-fg)] tracking-tight mb-1">
                      {video.title}
                    </h5>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
