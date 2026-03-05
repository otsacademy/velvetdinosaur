/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef, useState } from 'react';
import { Play } from 'lucide-react';

type VideoItem = {
  slug: string;
  title: string;
  videoId?: string;
};

type AdvocatesVideoCarouselViewProps = {
  title?: string;
  accent?: string;
  videos: VideoItem[];
};

function getPoster(video: VideoItem) {
  if (!video.videoId) return '';
  return `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
}

export function AdvocatesVideoCarouselView({
  title,
  accent,
  videos
}: AdvocatesVideoCarouselViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  if (videos.length === 0) return null;
  const hasHeader = Boolean(title || accent);

  const togglePlay = (slug: string) => {
    setActiveSlug((current) => (current === slug ? null : slug));
  };

  return (
    <section className="mb-16">
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

      <div className="relative -mx-6 sm:-mx-12 overflow-hidden">
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
    </section>
  );
}
