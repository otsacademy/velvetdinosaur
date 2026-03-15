'use client';

import type { FormEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trackAnalyticsEvent } from '@/lib/analytics/client';
import { cn } from '@/lib/utils';

type ContactFormVariant = 'card' | 'inline';

type ContactFormProps = {
  variant?: ContactFormVariant;
  showName?: boolean;
  showTopic?: boolean;
  nameLabel?: string;
  namePlaceholder?: string;
  topicLabel?: string;
  topicPlaceholder?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  submitLabel?: string;
  successRedirect?: string;
  successDelayMs?: number;
  analyticsFormId?: string;
};

type StatusState = { type: 'idle' | 'loading' | 'success' | 'error'; message?: string };

function useStyles(variant: ContactFormVariant) {
  return useMemo(() => {
    if (variant === 'inline') {
      return {
        label: 'text-xs font-black uppercase tracking-widest text-[var(--vd-fg)]',
        input: 'w-full rounded-xl border border-[var(--vd-border)] bg-[var(--vd-card)] px-4 py-3 text-sm',
        textarea: 'min-h-[120px] w-full rounded-xl border border-[var(--vd-border)] bg-[var(--vd-card)] px-4 py-3 text-sm',
        button:
          'w-fit rounded-full border border-[var(--vd-border)] bg-[var(--vd-primary)] px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--vd-primary-fg)]'
      } as const;
    }
    return {
      label: 'text-xs font-black uppercase tracking-widest text-neutral-400 ml-1',
      input: 'rounded-xl bg-neutral-50 border-neutral-100 font-bold',
      textarea: 'rounded-xl bg-neutral-50 border-neutral-100 font-medium min-h-[140px]',
      button:
        'w-full py-6 bg-[var(--vd-fg)] text-white font-black rounded-xl shadow-lg hover:bg-[var(--vd-primary)] hover:-translate-y-1 transition-all duration-300 uppercase tracking-[0.2em] text-xs mt-2'
    } as const;
  }, [variant]);
}

export function ContactForm({
  variant = 'card',
  showName = variant === 'card',
  showTopic = variant === 'card',
  nameLabel = 'Your name',
  namePlaceholder = 'e.g. Alex Smith',
  topicLabel = 'Topic',
  topicPlaceholder = 'General enquiry',
  emailLabel = 'Email address',
  emailPlaceholder = 'name@company.com',
  messageLabel = 'Your message',
  messagePlaceholder = 'How can we help you today?',
  submitLabel = 'Send message',
  successRedirect,
  successDelayMs = 1800,
  analyticsFormId = 'contact_form'
}: ContactFormProps) {
  const router = useRouter();
  const styles = useStyles(variant);
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const hasTrackedStartRef = useRef(false);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const trackFormStart = () => {
    if (hasTrackedStartRef.current) return;
    hasTrackedStartRef.current = true;
    void trackAnalyticsEvent({
      eventType: 'engagement',
      eventName: 'form_start',
      eventCategory: 'form',
      formId: analyticsFormId
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !message.trim()) {
      setStatus({ type: 'error', message: 'Please add your email and message.' });
      return;
    }
    trackFormStart();
    setStatus({ type: 'loading' });
    void trackAnalyticsEvent({
      eventType: 'engagement',
      eventName: 'form_submit',
      eventCategory: 'form',
      formId: analyticsFormId
    });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          topic: topic.trim() || undefined,
          email: email.trim(),
          formId: analyticsFormId,
          message: message.trim()
        })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Unable to send message.');
      }
      setStatus({ type: 'success', message: 'Thanks, your message is on its way.' });
      setName('');
      setTopic('');
      setEmail('');
      setMessage('');
      hasTrackedStartRef.current = false;
      void trackAnalyticsEvent({
        eventType: 'conversion',
        eventName: 'form_submit_success',
        eventCategory: 'form',
        formId: analyticsFormId,
        conversionName: 'contact_submit_success'
      });
      if (successRedirect) {
        const resolved =
          successRedirect.startsWith('#') && typeof window !== 'undefined'
            ? `${window.location.pathname}${successRedirect}`
            : successRedirect;
        setTimeout(() => {
          router.push(resolved);
        }, successDelayMs);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to send message.'
      });
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} data-analytics-form={analyticsFormId}>
      {showName || showTopic ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {showName ? (
            <div className="space-y-2">
              <label className={styles.label}>{nameLabel}</label>
              <Input
                className={styles.input}
                value={name}
                onFocus={trackFormStart}
                onChange={(event) => {
                  trackFormStart();
                  setName(event.target.value);
                }}
                placeholder={namePlaceholder}
                disabled={status.type === 'loading'}
              />
            </div>
          ) : null}
          {showTopic ? (
            <div className="space-y-2">
              <label className={styles.label}>{topicLabel}</label>
              <Input
                className={styles.input}
                value={topic}
                onFocus={trackFormStart}
                onChange={(event) => {
                  trackFormStart();
                  setTopic(event.target.value);
                }}
                placeholder={topicPlaceholder}
                disabled={status.type === 'loading'}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-2">
        <label className={styles.label}>{emailLabel}</label>
        <Input
          className={styles.input}
          value={email}
          onFocus={trackFormStart}
          onChange={(event) => {
            trackFormStart();
            setEmail(event.target.value);
          }}
          placeholder={emailPlaceholder}
          type="email"
          required
          disabled={status.type === 'loading'}
        />
      </div>
      <div className="space-y-2">
        <label className={styles.label}>{messageLabel}</label>
        <Textarea
          className={styles.textarea}
          value={message}
          onFocus={trackFormStart}
          onChange={(event) => {
            trackFormStart();
            setMessage(event.target.value);
          }}
          placeholder={messagePlaceholder}
          required
          disabled={status.type === 'loading'}
        />
      </div>
      <Button
        type="submit"
        variant="ghost"
        className={styles.button}
        disabled={status.type === 'loading'}
      >
        {status.type === 'loading' ? 'Sending...' : submitLabel}
      </Button>
      {status.type === 'success' ? (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--vd-primary)]">
          {status.message}
        </p>
      ) : null}
      {status.type === 'error' ? (
        <p className={cn('text-xs font-bold uppercase tracking-[0.2em] text-rose-500')}>
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
