/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

export type StaysVideo = {
  slug: string;
  title: string;
  videoId?: string;
};

export type StaysVideoCarouselViewProps = {
  title?: string;
  accent?: string;
  videos: StaysVideo[];
};

function getPoster(video: StaysVideo) {
  if (!video.videoId) return '';
  return `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
}

export function StaysVideoCarouselView({ title, accent, videos }: StaysVideoCarouselViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  if (videos.length === 0) return null;
  const hasHeader = Boolean(title || accent);

  const togglePlay = (slug: string) => {
    setActiveSlug((current) => (current === slug ? null : slug));
  };

  const scrollMobile = (direction: 'up' | 'down') => {
    if (!mobileScrollRef.current) return;
    const { scrollTop, clientHeight } = mobileScrollRef.current;
    const target = direction === 'up' ? scrollTop - clientHeight : scrollTop + clientHeight;
    mobileScrollRef.current.scrollTo({ top: target, behavior: 'smooth' });
  };

  return (
    <section className="mb-24">
      {hasHeader ? (
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
      ) : null}

      <div className="hidden md:block relative -mx-6 sm:-mx-12 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-6 px-6 sm:px-12 pb-16 pt-4"
        >
          {videos.map((video, idx) => {
            const rotation = idx % 2 === 0 ? 1 : -1;
            const poster = getPoster(video);
            const isActive = activeSlug === video.slug;
            return (
              <div
                key={video.slug}
                className="flex-shrink-0 w-[220px] sm:w-[280px] snap-center transition-transform duration-500 hover:z-10"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div
                  className="relative aspect-[9/16] rounded-[2.5rem] overflow-hidden bg-[var(--vd-muted)] border-4 border-white shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group/vid"
                  onClick={() => togglePlay(video.slug)}
                >
                  {isActive && video.videoId ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&modestbranding=1&rel=0&controls=1`}
                      title={video.title}
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay"
                    />
                  ) : (
                    <>
                      {poster ? (
                        <img
                          src={poster}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/vid:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-[var(--vd-muted-fg)]">
                          <Play className="h-6 w-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover/vid:bg-black/0 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-5 bg-[var(--vd-primary)] rounded-full text-[var(--vd-primary-fg)] shadow-2xl scale-110 transition-transform group-hover/vid:scale-125 border-2 border-white/20">
                          <Play className="h-5 w-5" />
                        </div>
                      </div>
                      {video.title ? (
                        <div className="absolute bottom-6 left-6 right-6 opacity-100 transition-opacity">
                          <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
                            <p className="text-white text-[10px] font-black uppercase tracking-widest leading-tight">
                              {video.title}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden relative w-full aspect-[9/16] max-h-[650px] rounded-[2.5rem] overflow-hidden bg-black shadow-2xl mx-auto border-4 border-white">
        <button
          onClick={() => scrollMobile('up')}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 p-3 bg-black/20 backdrop-blur-lg text-white rounded-full hover:bg-black/40 transition-all border border-white/10 shadow-lg active:scale-90"
          type="button"
        >
          <div className="rotate-90">
            <ChevronLeft className="h-4 w-4" />
          </div>
        </button>

        <div ref={mobileScrollRef} className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth">
          {videos.map((video) => {
            const poster = getPoster(video);
            const isActive = activeSlug === video.slug;
            return (
              <div key={video.slug} className="w-full h-full snap-center relative bg-neutral-900 flex-shrink-0">
                {isActive && video.videoId ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&modestbranding=1&rel=0&controls=0`}
                    title={video.title}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay"
                  />
                ) : (
                  <div className="relative w-full h-full cursor-pointer group" onClick={() => togglePlay(video.slug)}>
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
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur rounded text-[10px] font-bold text-white uppercase tracking-wider">
                          Watch Now
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scrollMobile('down')}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 p-3 bg-black/20 backdrop-blur-lg text-white rounded-full hover:bg-black/40 transition-all border border-white/10 shadow-lg active:scale-90"
          type="button"
        >
          <div className="rotate-90">
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>
    </section>
  );
}
