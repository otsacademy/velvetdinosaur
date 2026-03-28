'use client';

import {
  createDemoNewsSeedDocument,
  DEMO_NEWS_STORAGE_KEY,
  type DemoNewsDocument,
  type DemoNewsHistoryItem,
} from '@/lib/demo-news-seed';

export type DemoNewsStorageState = {
  draft: DemoNewsDocument;
  live: DemoNewsDocument | null;
  history: DemoNewsHistoryItem[];
};

function cloneValue<T>(value: T): T {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }
  } catch {
    // Fall through to JSON clone.
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function createDefaultState(): DemoNewsStorageState {
  return {
    draft: createDemoNewsSeedDocument(),
    live: null,
    history: [],
  };
}

function readRawState() {
  if (!canUseStorage()) {
    return createDefaultState();
  }

  try {
    const stored = window.localStorage.getItem(DEMO_NEWS_STORAGE_KEY);
    if (!stored) {
      return createDefaultState();
    }

    const parsed = JSON.parse(stored) as Partial<DemoNewsStorageState>;
    return {
      draft: parsed.draft ? cloneValue(parsed.draft) : createDemoNewsSeedDocument(),
      live: parsed.live ? cloneValue(parsed.live) : null,
      history: Array.isArray(parsed.history) ? cloneValue(parsed.history) : [],
    };
  } catch {
    return createDefaultState();
  }
}

function writeRawState(state: DemoNewsStorageState) {
  if (!canUseStorage()) {
    return state;
  }

  window.localStorage.setItem(DEMO_NEWS_STORAGE_KEY, JSON.stringify(state));
  return state;
}

function createHistoryItem(snapshot: DemoNewsDocument): DemoNewsHistoryItem {
  return {
    id: `demo-news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: snapshot.status,
    title: snapshot.title,
    slug: snapshot.slug,
    snapshot: cloneValue(snapshot),
  };
}

export function clearDemoNewsState() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(DEMO_NEWS_STORAGE_KEY);
}

export function readDemoNewsState() {
  return cloneValue(readRawState());
}

export function resetDemoNewsState() {
  const state = createDefaultState();
  writeRawState(state);
  return cloneValue(state);
}

export function saveDemoNewsSnapshot(snapshot: DemoNewsDocument, status: DemoNewsDocument['status']) {
  const current = readRawState();
  const nextSnapshot = cloneValue({
    ...snapshot,
    status,
  });
  const nextHistory = [createHistoryItem(nextSnapshot), ...current.history].slice(0, 12);
  const nextState: DemoNewsStorageState = {
    draft: nextSnapshot,
    live: status === 'published' ? cloneValue(nextSnapshot) : current.live,
    history: nextHistory,
  };

  writeRawState(nextState);
  return cloneValue(nextState);
}

export function updateDemoNewsDraftPreview(snapshot: DemoNewsDocument) {
  const current = readRawState();
  const nextState: DemoNewsStorageState = {
    ...current,
    draft: cloneValue(snapshot),
  };

  writeRawState(nextState);
  return cloneValue(nextState);
}

export function restoreDemoNewsHistoryItem(historyId: string) {
  const current = readRawState();
  const match = current.history.find((item) => item.id === historyId);
  if (!match) {
    return cloneValue(current);
  }

  const nextState: DemoNewsStorageState = {
    ...current,
    draft: cloneValue(match.snapshot),
  };

  writeRawState(nextState);
  return cloneValue(nextState);
}

export function readDemoNewsPreviewDocument(slug: string, mode: 'draft' | 'live') {
  const state = readRawState();
  const candidate = mode === 'live' ? state.live : state.draft;
  if (candidate && candidate.slug === slug) {
    return cloneValue(candidate);
  }

  const seed = createDemoNewsSeedDocument();
  if (seed.slug === slug) {
    return cloneValue(mode === 'live' ? state.live ?? seed : state.draft ?? seed);
  }

  return null;
}
