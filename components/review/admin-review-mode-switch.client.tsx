'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { addDays, endOfDay, format, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarRange, Copy, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { pathnameToReviewSlug } from '@/lib/review/pathname-slug';
import {
  clearStoredReviewToken,
  getStoredReviewToken,
  REVIEW_TOKEN_STORAGE_EVENT,
  setReviewModeSuppressed,
  setStoredReviewToken
} from '@/lib/review/review-token-storage';
import { cn } from '@/lib/utils';

type AdminReviewModeSwitchProps = {
  className?: string;
  variant?: 'inline' | 'sidebar';
};

type ReviewCreateResponse = {
  reviewUrl?: string;
  error?: string;
  draftSent?: boolean;
  notifiedUsers?: number;
  emailFailureCount?: number;
  reviewTaskEvent?: {
    id: string;
    title: string;
    startsOn: string;
    deadlineOn: string;
    calendarId: string;
  } | null;
};

function buildShareUrl(reviewToken: string) {
  if (!reviewToken || typeof window === 'undefined') return '';
  return new URL(`/review/${encodeURIComponent(reviewToken)}`, window.location.origin).toString();
}

function defaultWindowRange() {
  const from = startOfDay(new Date());
  const to = endOfDay(addDays(from, 7));
  return { from, to } as DateRange;
}

function formatWindowLabel(range: DateRange | undefined) {
  const from = range?.from;
  const to = range?.to || range?.from;
  if (!from || !to) return 'Pick review window';
  return `${format(from, 'MMM d')} to ${format(to, 'MMM d, yyyy')}`;
}

function extractReviewToken(reviewUrl: string) {
  try {
    const pathname = new URL(reviewUrl).pathname;
    const marker = '/review/';
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return '';
    return decodeURIComponent(pathname.slice(markerIndex + marker.length).split('/')[0] || '').trim();
  } catch {
    return '';
  }
}

export function AdminReviewModeSwitch({ className, variant = 'inline' }: AdminReviewModeSwitchProps) {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewToken = (searchParams.get('review') || '').trim();
  const reviewSlug = useMemo(() => pathnameToReviewSlug(pathname), [pathname]);
  const [busy, setBusy] = useState(false);
  const [recentShareUrl, setRecentShareUrl] = useState('');
  const [storedReviewToken, setStoredReviewTokenState] = useState('');
  const [windowRange, setWindowRange] = useState<DateRange | undefined>(defaultWindowRange);
  const [createTaskEvent, setCreateTaskEvent] = useState(true);
  const [sendDraftEmail, setSendDraftEmail] = useState(true);
  const [draftRecipientEmail, setDraftRecipientEmail] = useState('iwickens@gmail.com');
  const effectiveReviewToken = reviewToken || storedReviewToken;

  useEffect(() => {
    if (!effectiveReviewToken) {
      setRecentShareUrl('');
      return;
    }
    if (!recentShareUrl) return;
    if (!recentShareUrl.includes(effectiveReviewToken)) {
      setRecentShareUrl('');
    }
  }, [effectiveReviewToken, recentShareUrl]);

  useEffect(() => {
    if (!reviewSlug) {
      setStoredReviewTokenState('');
      return;
    }
    if (reviewToken) {
      setStoredReviewToken(reviewSlug, reviewToken);
      setStoredReviewTokenState(reviewToken);
      return;
    }
    setStoredReviewTokenState(getStoredReviewToken(reviewSlug));
  }, [reviewSlug, reviewToken]);

  useEffect(() => {
    if (!reviewSlug) return;
    const handleStorageEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ slug?: string }>).detail;
      if (detail?.slug && detail.slug !== reviewSlug) return;
      if (reviewToken) return;
      setStoredReviewTokenState(getStoredReviewToken(reviewSlug));
    };
    window.addEventListener(REVIEW_TOKEN_STORAGE_EVENT, handleStorageEvent as EventListener);
    return () => {
      window.removeEventListener(REVIEW_TOKEN_STORAGE_EVENT, handleStorageEvent as EventListener);
    };
  }, [reviewSlug, reviewToken]);

  const shareUrl = useMemo(() => {
    if (recentShareUrl) return recentShareUrl;
    return buildShareUrl(effectiveReviewToken);
  }, [effectiveReviewToken, recentShareUrl]);

  const isInline = variant === 'inline';
  const switchDisabled = busy;
  const blockedPath = !reviewSlug;
  const windowLabel = formatWindowLabel(windowRange);

  async function createAndOpenReviewLink() {
    const from = windowRange?.from;
    const to = windowRange?.to || windowRange?.from;
    if (!from || !to) {
      toast.error('Select a review start and end date first.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/review-links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: pathname,
          startsAt: startOfDay(from).toISOString(),
          deadlineAt: endOfDay(to).toISOString(),
          createTaskEvent,
          // Enabling review mode should always notify all registered users.
          notifyAllUsers: true,
          draftRecipientEmail: sendDraftEmail ? draftRecipientEmail.trim() : ''
        })
      });
      const payload = (await response.json().catch(() => null)) as ReviewCreateResponse | null;
      if (!response.ok || !payload?.reviewUrl) {
        const message = payload?.error || 'Could not enable review mode for this page.';
        toast.error(message);
        return;
      }
      const createdToken = extractReviewToken(payload.reviewUrl);
      if (reviewSlug && createdToken) {
        setStoredReviewToken(reviewSlug, createdToken);
        setStoredReviewTokenState(createdToken);
      }
      setRecentShareUrl(payload.reviewUrl);
      if (payload.reviewTaskEvent) {
        toast.success(`Review mode enabled. Task created in ${payload.reviewTaskEvent.calendarId}.`);
      } else {
        toast.success('Review mode enabled.');
      }
      if (payload.draftSent) {
        toast.success(`Draft review email sent to ${draftRecipientEmail.trim()}.`);
      }
      if (typeof payload.notifiedUsers === 'number' && payload.notifiedUsers > 0) {
        toast.success(`Review request sent to ${payload.notifiedUsers} registered users.`);
      }
      if (typeof payload.emailFailureCount === 'number' && payload.emailFailureCount > 0) {
        toast.error(`${payload.emailFailureCount} review email deliveries failed.`);
      }
    } catch {
      toast.error('Could not enable review mode for this page.');
    } finally {
      setBusy(false);
    }
  }

  function disableReviewMode() {
    if (reviewSlug) {
      clearStoredReviewToken(reviewSlug);
      setReviewModeSuppressed(reviewSlug, true);
    }
    setStoredReviewTokenState('');
    setRecentShareUrl('');
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('review');
    const nextQuery = nextParams.toString();
    const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextHref, { scroll: false });
    toast.success('Review mode disabled.');
  }

  async function handleToggle(nextChecked: boolean) {
    if (switchDisabled) return;
    if (blockedPath) {
      toast.error('Review mode is not available on this route.');
      return;
    }
    if (nextChecked) {
      if (effectiveReviewToken) return;
      await createAndOpenReviewLink();
      return;
    }
    disableReviewMode();
  }

  async function copyShareUrl() {
    if (!shareUrl) {
      toast.error('Enable review mode first to generate a shareable link.');
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Review link copied.');
    } catch {
      toast.error('Could not copy review link.');
    }
  }

  if (blockedPath) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        isInline
          ? 'rounded-full border border-border/70 bg-background/95 px-3 py-1.5 shadow-sm'
          : 'rounded-xl bg-white/8 px-3 py-2 text-white',
        className
      )}
    >
      <div className={cn('flex items-center gap-2', isInline ? 'text-[var(--vd-fg)]' : 'text-white')}>
        <MessageSquare className="h-4 w-4 opacity-80" />
        <span className={cn('text-xs font-medium', isInline ? 'text-[var(--vd-fg)]' : 'text-white')}>Review mode</span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={isInline ? 'ghost' : 'secondary'}
            className={cn(
              'h-7 gap-1.5 px-2 text-[11px]',
              !isInline && 'bg-white/16 text-white hover:bg-white/24 hover:text-white'
            )}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            {windowLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[22rem] space-y-3 p-3" align="end">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--vd-fg)]">Review Window</p>
            <p className="text-xs text-[var(--vd-muted-fg)]">Choose start and end dates using the shadcn calendar.</p>
          </div>
          <Calendar
            mode="range"
            selected={windowRange}
            onSelect={setWindowRange}
            numberOfMonths={1}
            captionLayout="dropdown"
            className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-2"
          />
          <div className="space-y-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-2.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="review-task-event"
                checked={createTaskEvent}
                onCheckedChange={(checked) => setCreateTaskEvent(Boolean(checked))}
              />
              <Label htmlFor="review-task-event" className="text-xs font-medium text-[var(--vd-fg)]">
                Add review task event
              </Label>
            </div>
            <p className="text-xs font-medium text-[var(--vd-fg)]">Email all registered users automatically</p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="review-send-draft"
                checked={sendDraftEmail}
                onCheckedChange={(checked) => setSendDraftEmail(Boolean(checked))}
              />
              <Label htmlFor="review-send-draft" className="text-xs font-medium text-[var(--vd-fg)]">
                Send draft for approval
              </Label>
            </div>
            <Input
              value={draftRecipientEmail}
              onChange={(event) => setDraftRecipientEmail(event.target.value)}
              type="email"
              placeholder="reviewer@example.com"
              disabled={!sendDraftEmail}
              className="h-8 text-xs"
            />
          </div>
        </PopoverContent>
      </Popover>

      <Switch
        aria-label="Toggle review mode for this page"
        checked={Boolean(effectiveReviewToken)}
        onCheckedChange={(checked) => void handleToggle(checked)}
        disabled={switchDisabled}
        className={!isInline ? 'border-white/35 bg-white/20 data-[state=checked]:bg-white' : undefined}
      />
      <Button
        type="button"
        size="icon"
        variant={isInline ? 'ghost' : 'secondary'}
        className={cn('h-7 w-7', !isInline && 'bg-white/16 text-white hover:bg-white/24 hover:text-white')}
        onClick={() => void copyShareUrl()}
        disabled={busy || !effectiveReviewToken}
        title="Copy review link"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="sr-only">Copy review link</span>
      </Button>
    </div>
  );
}
