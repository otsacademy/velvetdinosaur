'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const RELOAD_KEY = 'vd:chunk-reload';
const RELOAD_COOLDOWN_MS = 15000;

function getMessage(reason: unknown) {
  if (typeof reason === 'string') return reason;
  if (reason instanceof Error) return reason.message;
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const message = (reason as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
}

function isChunkLoadMessage(message: string) {
  if (!message) return false;
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(message);
}

function isServerActionMessage(message: string) {
  if (!message) return false;
  return /Failed to find Server Action|server action/i.test(message);
}

function isScriptChunkError(event: Event) {
  const target = event.target;
  if (!target || !(target instanceof HTMLScriptElement)) return false;
  const src = target.src || '';
  return src.includes('/_next/static/chunks/');
}

function shouldReloadNow() {
  if (typeof sessionStorage === 'undefined') return true;
  const stored = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
  const now = Date.now();
  if (stored && now - stored < RELOAD_COOLDOWN_MS) {
    return false;
  }
  sessionStorage.setItem(RELOAD_KEY, String(now));
  return true;
}

function triggerReload() {
  if (!shouldReloadNow()) return;
  toast.message('Editor updated. Reloading…');
  setTimeout(() => {
    window.location.reload();
  }, 700);
}

export function ChunkReloadGuard() {
  useEffect(() => {
    const onError = (event: Event) => {
      if (isScriptChunkError(event)) {
        triggerReload();
        return;
      }
      const errorEvent = event as ErrorEvent;
      const message = getMessage(errorEvent?.error ?? errorEvent?.message);
      if (isChunkLoadMessage(message) || isServerActionMessage(message)) {
        triggerReload();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const message = getMessage(event.reason);
      if (isChunkLoadMessage(message) || isServerActionMessage(message)) {
        triggerReload();
      }
    };

    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
