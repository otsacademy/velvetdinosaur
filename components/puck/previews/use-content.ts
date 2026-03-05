"use client";

import { useEffect, useState } from 'react';

type ContentState<T> = {
  data: T;
  loading: boolean;
  error?: string;
};

export function useContent<T>(url: string, initial: T): ContentState<T> {
  const [state, setState] = useState<ContentState<T>>({
    data: initial,
    loading: true
  });

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    (async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const payload = res.ok ? await res.json() : null;
        if (!active) return;
        if (!payload) throw new Error('No data');
        setState({ data: payload, loading: false });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Load failed';
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    })();

    return () => {
      active = false;
    };
  }, [url]);

  return state as ContentState<T>;
}
