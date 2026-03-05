/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { VideoAsset } from '@/lib/content/types';
import { cn } from '@/lib/utils';
import { openShorts } from '@/lib/shorts/store';

type VerticalFeedScrollerViewProps = {
  title?: string;
  lead?: string;
  videos: VideoAsset[];
  height?: number;
  useShortsOverlay?: boolean;
  showOnDesktop?: boolean;
};

function getPoster(video: VideoAsset) {
  if (video.thumbnail) return video.thumbnail;
  if (video.videoId) return `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
  return '';
}

export function VerticalFeedScrollerView({
  title,
  lead,
  videos,
  height = 600,
  useShortsOverlay,
  showOnDesktop
}: VerticalFeedScrollerViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasHeader = Boolean(title || lead);

  const scroll = (direction: 'up' | 'down') => {
    if (!scrollRef.current) return;
    const { scrollTop, clientHeight } = scrollRef.current;
    const target = direction === 'up' ? scrollTop - clientHeight : scrollTop + clientHeight;
    scrollRef.current.scrollTo({ top: target, behavior: 'smooth' });
  };

  const openOverlay = (slug?: string) => {
    if (!useShortsOverlay) return;
    openShorts({ shorts: videos, startSlug: slug });
  };

  if (videos.length === 0) return null;

  return (
    <section
      className={cn(
        'px-6 sm:px-12 mb-20 max-w-7xl mx-auto',
        showOnDesktop ? '' : 'md:hidden'
      )}
    >
      {hasHeader ? (
        <div className="mb-6">
          {title ? (
            <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--vd-fg)] leading-none">
              {title}
            </h3>
          ) : null}
          {lead ? <p className="text-sm text-[var(--vd-muted-fg)] mt-2 max-w-2xl">{lead}</p> : null}
        </div>
      ) : null}

      <div
        className="relative w-full aspect-[9/16] max-h-[650px] rounded-[2.5rem] overflow-hidden bg-black shadow-2xl mx-auto border-4 border-white"
        style={{ maxHeight: height }}
      >
        <button
          type="button"
          onClick={() => scroll('up')}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 p-3 bg-black/20 backdrop-blur-lg text-white rounded-full hover:bg-black/40 transition-all border border-white/10 shadow-lg active:scale-90"
          aria-label="Scroll up"
        >
          <div className="rotate-90">
            <ChevronLeft className="h-4 w-4" />
          </div>
        </button>

        <div ref={scrollRef} className="h-full overflow-y-auto snap-y-mandatory no-scrollbar scroll-smooth">
          {videos.map((video) => {
            const poster = getPoster(video);
            return (
              <div key={video.slug} className="w-full h-full snap-center relative bg-neutral-900 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openOverlay(video.slug)}
                  className={cn('relative w-full h-full text-left', useShortsOverlay ? 'cursor-pointer' : 'cursor-default')}
                  aria-label={useShortsOverlay ? `Play ${video.title}` : undefined}
                  disabled={!useShortsOverlay}
                >
                  {poster ? (
                    <img src={poster} alt={video.title} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-white/70">
                      <Play className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-6 bg-[var(--vd-primary)]/90 backdrop-blur-sm rounded-full text-[var(--vd-primary-fg)] shadow-2xl scale-110 animate-pulse">
                      <Play className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="absolute bottom-16 left-6 right-6">
                    <p className="text-white text-xl font-black uppercase tracking-tight leading-tight mb-2 drop-shadow-md">
                      {video.title}
                    </p>
                    {video.description ? (
                      <p className="text-white/80 text-xs line-clamp-2 mb-3">{video.description}</p>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur rounded text-[10px] font-bold text-white uppercase tracking-wider">
                        Watch Now
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll('down')}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 p-3 bg-black/20 backdrop-blur-lg text-white rounded-full hover:bg-black/40 transition-all border border-white/10 shadow-lg active:scale-90"
          aria-label="Scroll down"
        >
          <div className="rotate-90">
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>
    </section>
  );
}
