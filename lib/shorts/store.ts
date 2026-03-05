import { useSyncExternalStore } from 'react';
import type { ShortsOpenPayload, VideoAsset } from '@/lib/content/types';

type ShortsState = {
  open: boolean;
  shorts: VideoAsset[];
  startSlug?: string;
};

let state: ShortsState = {
  open: false,
  shorts: [],
  startSlug: undefined
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function openShorts(payload: ShortsOpenPayload) {
  state = {
    open: true,
    shorts: payload.shorts || [],
    startSlug: payload.startSlug
  };
  emit();
}

export function closeShorts() {
  if (!state.open) return;
  state = { ...state, open: false };
  emit();
}

export function useShortsStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state
  );
}

