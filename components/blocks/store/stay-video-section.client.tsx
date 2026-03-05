/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

export type StayVideoSectionViewProps = {
  videoId?: string;
  poster?: string;
};

export function StayVideoSectionView({ videoId, poster }: StayVideoSectionViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (videoId) {
    return (
      <div className="space-y-6">
        <div className="hidden md:block relative aspect-video rounded-[2rem] overflow-hidden bg-black group shadow-2xl">
          {isPlaying ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&controls=1`}
              title="Property tour"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 w-full h-full text-left"
              aria-label="Play property tour"
              type="button"
            >
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                alt="Video cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform shadow-xl">
                  <Play className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 text-white text-sm font-black uppercase tracking-widest">
                Watch Property Tour
              </div>
            </button>
          )}
        </div>

        <div className="md:hidden relative aspect-video rounded-[2rem] overflow-hidden bg-black shadow-2xl">
          {isPlaying ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&controls=0`}
              title="Property tour"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 w-full h-full text-left"
              aria-label="Play property tour"
              type="button"
            >
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                className="w-full h-full object-cover opacity-80"
                alt="Video cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-[var(--vd-primary)]/90 backdrop-blur-md rounded-full flex items-center justify-center text-[var(--vd-primary-fg)] shadow-2xl animate-pulse">
                  <Play className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--vd-primary)]/80">Video</p>
                <p className="text-lg font-black uppercase tracking-tight">Property Tour</p>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-black group shadow-2xl">
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform cursor-pointer shadow-xl">
          <Play className="h-6 w-6" />
        </div>
      </div>
      {poster ? (
        <img
          src={poster}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-60 transition-opacity"
          alt="Video cover"
        />
      ) : (
        <div className="w-full h-full bg-neutral-900" />
      )}
      <div className="absolute bottom-6 left-6 text-white text-sm font-black uppercase tracking-widest z-10">
        Watch Property Tour
      </div>
    </div>
  );
}
