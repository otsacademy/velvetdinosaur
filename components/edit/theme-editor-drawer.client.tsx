'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { Render, type Data } from '@measured/puck';
import { toast } from 'sonner';
import { ThemeEditorView } from '@/components/admin/theme/theme-editor-view.client';
import { editorConfig } from '@/puck/editor-config';
import { defaultData } from '@/puck/defaults';
import { sanitizeData } from '@/puck/validate';

type PageOption = {
  slug: string;
  title?: string | null;
};

type ThemeEditorDrawerProps = {
  initialSlug: string;
};

type Listener = () => void;

type PagesState = {
  pages: PageOption[];
  loading: boolean;
};

type PreviewState = {
  data: Data;
  loading: boolean;
};

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      ...(options?.headers ?? {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error || 'Request failed';
    throw new Error(message);
  }
  return payload;
}

function normalizePages(rawPages: unknown): PageOption[] {
  if (!Array.isArray(rawPages)) return [];
  return rawPages
    .map((page) => ({
      slug: typeof page?.slug === 'string' ? page.slug : '',
      title: typeof page?.title === 'string' ? page.title : null
    }))
    .filter((page) => Boolean(page.slug));
}

class PagesStore {
  private state: PagesState = {
    pages: [{ slug: 'home', title: 'Home' }],
    loading: true
  };
  private listeners = new Set<Listener>();
  private started = false;

  getSnapshot = () => this.state;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    if (!this.started) {
      this.started = true;
      void this.load();
    }

    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private async load() {
    try {
      const payload = await requestJson('/api/pages/list');
      const nextPages = normalizePages(payload?.pages);
      const withHome = nextPages.some((page) => page.slug === 'home')
        ? nextPages
        : [{ slug: 'home', title: 'Home' }, ...nextPages];
      this.state = { pages: withHome, loading: false };
      this.emit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load pages';
      toast.error(message);
      this.state = { ...this.state, loading: false };
      this.emit();
    }
  }
}

class PreviewStore {
  private state: PreviewState;
  private listeners = new Set<Listener>();
  private started = false;

  constructor(private readonly slug: string) {
    this.state = { data: sanitizeData(defaultData(slug)), loading: true };
  }

  getSnapshot = () => this.state;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    if (!this.started) {
      this.started = true;
      void this.load();
    }

    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private async load() {
    this.state = { ...this.state, loading: true };
    this.emit();
    try {
      const payload = await requestJson(`/api/cms/pages/${encodeURIComponent(this.slug)}`);
      const nextData = payload?.draftData ?? payload?.publishedData ?? defaultData(this.slug);
      this.state = { data: sanitizeData(nextData), loading: false };
      this.emit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load page preview';
      toast.error(message);
      this.state = { data: sanitizeData(defaultData(this.slug)), loading: false };
      this.emit();
    }
  }
}

const pagesStore = new PagesStore();
const previewStores = new Map<string, PreviewStore>();

function getPreviewStore(slug: string) {
  const existing = previewStores.get(slug);
  if (existing) return existing;
  const created = new PreviewStore(slug);
  previewStores.set(slug, created);
  return created;
}

export function ThemeEditorDrawer({ initialSlug }: ThemeEditorDrawerProps) {
  const [selectedSlug, setSelectedSlug] = useState(initialSlug || 'home');
  const pagesState = useSyncExternalStore(
    pagesStore.subscribe,
    pagesStore.getSnapshot,
    pagesStore.getSnapshot
  );
  const previewStore = useMemo(() => getPreviewStore(selectedSlug), [selectedSlug]);
  const previewState = useSyncExternalStore(
    previewStore.subscribe,
    previewStore.getSnapshot,
    previewStore.getSnapshot
  );

  const handlePageChange = useCallback((slug: string) => {
    setSelectedSlug(slug);
  }, []);

  const preview = useMemo(() => {
    if (previewState.loading) {
      return (
        <div className="p-6 text-sm text-[var(--vd-muted-fg)]">
          Loading page preview…
        </div>
      );
    }
    return <Render config={editorConfig} data={previewState.data} />;
  }, [previewState.data, previewState.loading]);

  const pages = pagesState.pages.length
    ? pagesState.pages
    : [{ slug: 'home', title: 'Home' }];

  return (
    <ThemeEditorView pages={pages} selectedSlug={selectedSlug} onPageChange={handlePageChange}>
      <main className="mx-auto w-full max-w-[1500px] space-y-16 px-8 py-12">{preview}</main>
    </ThemeEditorView>
  );
}
