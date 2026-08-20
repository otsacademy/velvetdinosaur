'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const RELOAD_KEY = 'vd:chunk-reload';
const RELOAD_COOLDOWN_MS = 15000;
const RELOAD_WINDOW_MS = 120000;
const RELOAD_MAX_ATTEMPTS = 1;

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
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Failed to fetch RSC payload|stale|status (?:code )?410/i.test(
    message
  );
}

function isServerActionMessage(message: string) {
  if (!message) return false;
  return /Failed to find Server Action|server action/i.test(message);
}

function isScriptChunkError(event: Event) {
  const target = event.target;
  if (!target || !(target instanceof HTMLScriptElement)) return false;
  if (target.ownerDocument !== document) return false;
  const src = target.src || '';
  if (typeof window !== 'undefined') {
    const ownChunkPrefix = `${window.location.origin}/_next/static/chunks/`;
    return src.startsWith(ownChunkPrefix);
  }
  return src.includes('/_next/static/chunks/');
}

function isStaticStyleError(event: Event) {
  const target = event.target;
  if (!target || !(target instanceof HTMLLinkElement)) return false;
  const href = target.href || '';
  if (typeof window !== 'undefined') {
    const ownAssetPrefix = `${window.location.origin}/_next/static/`;
    if (!href.startsWith(ownAssetPrefix)) return false;
  } else if (!href.includes('/_next/static/')) {
    return false;
  }
  // Ignore stylesheet failures from extension-controlled frames/documents.
  if (target.ownerDocument !== document) return false;
  const rel = (target.rel || '').toLowerCase();
  if (!rel.includes('stylesheet') && !rel.includes('preload')) return false;
  if (rel.includes('stylesheet') && target.getAttribute('data-precedence') !== 'next') return false;
  return true;
}

function isWebpackRuntimeMessage(message: string, filename = '', stack = '') {
  if (!message) return false;
  const runtimeMismatch =
    /Cannot read properties of undefined \(reading 'call'\)/i.test(message) ||
    /undefined is not an object \(evaluating .*\.call\)/i.test(message);
  if (!runtimeMismatch) return false;
  const combined = `${filename}\n${stack}`;
  return /webpack|\/_next\/static\/chunks\//i.test(combined);
}

function isIgnorableEditorMessage(message: string, filename = '') {
  if (!message) return false;
  if (/AutoFrame couldn't load a stylesheet/i.test(message)) return true;
  if (/ResizeObserver loop limit exceeded/i.test(message)) return true;
  if (/^chrome-extension:|^moz-extension:/i.test(filename)) return true;
  return false;
}

function shouldReloadNow() {
  if (typeof sessionStorage === 'undefined') return true;
  const currentPath = window.location.pathname;
  const raw = sessionStorage.getItem(RELOAD_KEY);
  let storedTs = 0;
  let attempts = 0;
  let storedPath = '';
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { ts?: unknown; attempts?: unknown; path?: unknown };
      storedTs = typeof parsed.ts === 'number' ? parsed.ts : 0;
      attempts = typeof parsed.attempts === 'number' ? parsed.attempts : 0;
      storedPath = typeof parsed.path === 'string' ? parsed.path : '';
    } catch {
      storedTs = 0;
      attempts = 0;
      storedPath = '';
    }
  }
  const now = Date.now();
  if (storedTs && now - storedTs < RELOAD_COOLDOWN_MS) {
    return false;
  }
  const withinWindow = storedPath === currentPath && storedTs && now - storedTs < RELOAD_WINDOW_MS;
  const nextAttempts = withinWindow ? attempts + 1 : 1;
  if (nextAttempts > RELOAD_MAX_ATTEMPTS) {
    return false;
  }
  sessionStorage.setItem(
    RELOAD_KEY,
    JSON.stringify({
      ts: now,
      attempts: nextAttempts,
      path: currentPath
    })
  );
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
      if (isStaticStyleError(event)) {
        triggerReload();
        return;
      }
      const errorEvent = event as ErrorEvent;
      const message = getMessage(errorEvent?.error ?? errorEvent?.message);
      const filename = errorEvent?.filename || '';
      const stack =
        errorEvent?.error && typeof (errorEvent.error as { stack?: unknown }).stack === 'string'
          ? ((errorEvent.error as { stack: string }).stack ?? '')
          : '';
      if (isIgnorableEditorMessage(message, filename)) {
        return;
      }
      if (
        isChunkLoadMessage(message) ||
        isServerActionMessage(message) ||
        isWebpackRuntimeMessage(message, filename, stack)
      ) {
        triggerReload();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const message = getMessage(event.reason);
      const filename =
        event.reason && typeof event.reason === 'object' && 'fileName' in event.reason
          ? String((event.reason as { fileName?: unknown }).fileName || '')
          : '';
      const stack =
        event.reason && typeof event.reason === 'object' && 'stack' in event.reason
          ? String((event.reason as { stack?: unknown }).stack || '')
          : '';
      if (isIgnorableEditorMessage(message, filename)) {
        return;
      }
      if (
        isChunkLoadMessage(message) ||
        isServerActionMessage(message) ||
        isWebpackRuntimeMessage(message, '', stack)
      ) {
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
