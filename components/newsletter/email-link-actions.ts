'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { UnsubscribePageState } from '@/lib/newsletter/unsubscribe-state';

// Behaviour shared by the pages that emailed links open. Opening a link (GET or
// HEAD, as mail scanners do) only shows a page; nothing changes until the
// person presses the button, which sends one POST with `confirmed: true`.
// Each site draws these states with its own layout and components.

export type ConfirmKind = 'newsletter' | 'event';

const CONFIRM_ENDPOINTS: Record<ConfirmKind, string> = {
  newsletter: '/api/newsletter/confirm',
  event: '/api/events/registration/confirm'
};

function post(url: string, token: string) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, confirmed: true }),
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(15_000)
  });
}

export type ConfirmLinkState = {
  busy: boolean;
  confirmed: boolean;
  /** 'expired' when the server refused the link, 'failed' when the request did not complete. */
  error: '' | 'expired' | 'failed';
  confirm: () => Promise<void>;
};

export function useConfirmLink(kind: ConfirmKind, token: string): ConfirmLinkState {
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<ConfirmLinkState['error']>('');
  const inFlight = useRef(false);

  async function confirm() {
    if (inFlight.current || confirmed) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await post(CONFIRM_ENDPOINTS[kind], token);
      if (!response.ok) {
        setError(response.status === 400 ? 'expired' : 'failed');
        return;
      }
      setConfirmed(true);
    } catch {
      setError('failed');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return { busy, confirmed, error, confirm };
}

export type UnsubscribeView = UnsubscribePageState['status'] | 'unsubscribed' | 'kept';

export function useUnsubscribeConfirmation(token: string, initialState: UnsubscribePageState) {
  const [view, setView] = useState<UnsubscribeView>(initialState.status);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const acted = useRef(false);
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const error = useRef<HTMLDivElement>(null);
  const email = 'email' in initialState ? initialState.email : '';

  // After an action, move focus to the new heading (or the error) for keyboard and screen-reader users.
  useEffect(() => { if (acted.current) heading.current?.focus(); }, [view]);
  useEffect(() => { if (failed) error.current?.focus(); }, [failed]);

  async function unsubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    acted.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const response = await post('/api/newsletter/unsubscribe', token);
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if (result.error === 'invalid-token' || result.error === 'expired-token') {
          setView(result.error === 'expired-token' ? 'expired' : 'invalid');
          return;
        }
        throw new Error('Request failed');
      }
      setView(result.updated > 0 ? 'unsubscribed' : 'already');
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // Keeping the subscription makes no request: it cannot resubscribe anyone.
  function keep() {
    acted.current = true;
    setView('kept');
  }

  return { view, busy, failed, email, heading, error, unsubscribe, keep };
}
