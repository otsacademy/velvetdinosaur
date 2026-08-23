'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type WidgetService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  pricePence: number | null;
};

export type WidgetResource = {
  id: string;
  name: string;
  serviceIds: string[];
};

type Slot = { startAt: string; endAt: string };

type Step = 'service' | 'when' | 'details' | 'done';

function formatSlotTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function formatPrice(pricePence: number | null) {
  if (pricePence === null) return '';
  return `£${(pricePence / 100).toFixed(pricePence % 100 === 0 ? 0 : 2)}`;
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function BookingWidgetClient({
  heading,
  intro,
  initialServiceSlug,
  showPrices,
  services,
  resourcesByService
}: {
  heading: string;
  intro: string;
  initialServiceSlug: string;
  showPrices: boolean;
  services: WidgetService[];
  resourcesByService: Record<string, WidgetResource[]>;
}) {
  const [step, setStep] = useState<Step>(initialServiceSlug ? 'when' : 'service');
  const [service, setService] = useState<WidgetService | null>(
    services.find((item) => item.slug === initialServiceSlug) ?? null
  );
  const [resourceId, setResourceId] = useState('');
  const [date, setDate] = useState(todayPlus(1));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedStatus, setConfirmedStatus] = useState<'requested' | 'confirmed'>('requested');
  const formStartedAt = useRef(Date.now());

  const eligibleResources = useMemo(
    () => (service ? (resourcesByService[service.id] ?? []) : []),
    [service, resourcesByService]
  );

  useEffect(() => {
    if (!service || !date) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    const params = new URLSearchParams({ service: service.slug, date });
    if (resourceId) params.set('resource', resourceId);
    fetch(`/api/bookings/availability?${params.toString()}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { slots: [] }))
      .then((payload: { slots?: Slot[] }) => setSlots(payload.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [service, date, resourceId]);

  function chooseService(next: WidgetService) {
    setService(next);
    setResourceId('');
    setSelectedSlot(null);
    setStep('when');
  }

  async function submit() {
    if (!service || !selectedSlot) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: service.slug,
          resourceId: resourceId || undefined,
          startAt: selectedSlot.startAt,
          name,
          email,
          phone: phone || undefined,
          notes: notes || undefined,
          honeypot,
          formStartedAt: formStartedAt.current
        })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        booking?: { status: 'requested' | 'confirmed' };
      };
      if (!response.ok) {
        setError(payload.error || 'Could not create the booking — please try another time.');
        return;
      }
      setConfirmedStatus(payload.booking?.status === 'confirmed' ? 'confirmed' : 'requested');
      setStep('done');
    } catch {
      setError('Could not create the booking — please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-6 md:p-8">
      {heading ? (
        <h3 className="mb-2 text-2xl font-bold tracking-tight text-[var(--vd-fg)]">{heading}</h3>
      ) : null}
      {intro ? <p className="mb-6 text-sm leading-relaxed text-[var(--vd-muted-fg)]">{intro}</p> : null}

      {step === 'service' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseService(item)}
              className="rounded-md border border-[var(--vd-border)] bg-[var(--vd-surface,transparent)] p-4 text-left transition-colors hover:border-[var(--vd-primary)]"
            >
              <span className="block text-sm font-semibold text-[var(--vd-fg)]">{item.name}</span>
              <span className="mt-1 block text-xs text-[var(--vd-muted-fg)]">
                {item.durationMinutes} minutes
                {showPrices && item.pricePence !== null ? ` · ${formatPrice(item.pricePence)}` : ''}
              </span>
              {item.description ? (
                <span className="mt-1 block text-xs text-[var(--vd-muted-fg)]">{item.description}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {step === 'when' && service ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--vd-fg)]">
              {service.name} · {service.durationMinutes} minutes
            </p>
            <button
              type="button"
              onClick={() => setStep('service')}
              className="text-xs font-medium text-[var(--vd-primary)] underline-offset-4 hover:underline"
            >
              Change service
            </button>
          </div>
          {eligibleResources.length > 0 ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-[var(--vd-muted-fg)]">With</span>
              <select
                value={resourceId}
                onChange={(event) => setResourceId(event.target.value)}
                className="rounded-md border border-[var(--vd-border)] bg-transparent px-3 py-2 text-sm"
              >
                <option value="">No preference</option>
                {eligibleResources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-[var(--vd-muted-fg)]">Date</span>
            <input
              type="date"
              value={date}
              min={todayPlus(0)}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-md border border-[var(--vd-border)] bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <div>
            <span className="mb-2 block text-xs font-medium text-[var(--vd-muted-fg)]">Available times</span>
            {slotsLoading ? (
              <p className="text-sm text-[var(--vd-muted-fg)]">Checking availability…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-[var(--vd-muted-fg)]">
                No times available on this date — please try another day.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {slots.map((slot) => (
                  <button
                    key={slot.startAt}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-md border px-2 py-2 text-sm transition-colors ${
                      selectedSlot?.startAt === slot.startAt
                        ? 'border-[var(--vd-primary)] bg-[var(--vd-primary)] text-[var(--vd-primary-fg,#fff)]'
                        : 'border-[var(--vd-border)] hover:border-[var(--vd-primary)]'
                    }`}
                  >
                    {formatSlotTime(slot.startAt)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep('details')}
              className="rounded-md bg-[var(--vd-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--vd-primary-fg,#fff)] disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 'details' && service && selectedSlot ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--vd-fg)]">
            <strong>{service.name}</strong> on{' '}
            {new Intl.DateTimeFormat('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(selectedSlot.startAt))}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-[var(--vd-muted-fg)]">Your name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-md border border-[var(--vd-border)] bg-transparent px-3 py-2 text-sm"
                autoComplete="name"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-[var(--vd-muted-fg)]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-md border border-[var(--vd-border)] bg-transparent px-3 py-2 text-sm"
                autoComplete="email"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-[var(--vd-muted-fg)]">Phone (optional)</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-md border border-[var(--vd-border)] bg-transparent px-3 py-2 text-sm"
                autoComplete="tel"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-[var(--vd-muted-fg)]">Notes (optional)</span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="rounded-md border border-[var(--vd-border)] bg-transparent px-3 py-2 text-sm"
              />
            </label>
          </div>
          <input
            type="text"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('when')}
              className="text-sm font-medium text-[var(--vd-muted-fg)] underline-offset-4 hover:underline"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting || !name.trim() || !email.trim()}
              onClick={submit}
              className="rounded-md bg-[var(--vd-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--vd-primary-fg,#fff)] disabled:opacity-50"
            >
              {submitting ? 'Booking…' : 'Book now'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="rounded-md border border-[var(--vd-border)] p-5">
          <h4 className="mb-2 text-lg font-bold text-[var(--vd-fg)]">
            {confirmedStatus === 'confirmed' ? 'Your booking is confirmed' : 'We have your booking request'}
          </h4>
          <p className="text-sm leading-relaxed text-[var(--vd-muted-fg)]">
            {confirmedStatus === 'confirmed'
              ? 'A confirmation email is on its way to you, with a link to change or cancel your booking if you need to.'
              : 'We will confirm your booking shortly by email. The email includes a link to change or cancel if you need to.'}
          </p>
        </div>
      ) : null}
    </section>
  );
}
