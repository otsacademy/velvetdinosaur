'use client';

import { useCallback, useEffect, useState } from 'react';

type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  resourceName: string;
  customer: { name: string; email: string; phone: string };
  startAt: string;
  endAt: string;
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
};

type Slot = { startAt: string; endAt: string };

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function ManageBookingClient({ token }: { token: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [date, setDate] = useState(todayPlus(1));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setError('This link is missing its booking token.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/bookings/manage?token=${encodeURIComponent(token)}`, {
        cache: 'no-store'
      });
      const payload = (await response.json().catch(() => ({}))) as {
        booking?: Booking;
        error?: string;
      };
      if (!response.ok || !payload.booking) {
        setError(payload.error || 'Booking not found or this link has expired.');
      } else {
        setBooking(payload.booking);
      }
    } catch {
      setError('Could not load your booking — please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!rescheduling || !booking) return;
    setSlotsLoading(true);
    const params = new URLSearchParams({ service: booking.serviceId, date });
    fetch(`/api/bookings/availability?${params.toString()}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { slots: [] }))
      .then((payload: { slots?: Slot[] }) => setSlots(payload.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [rescheduling, booking, date]);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/bookings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...body })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        booking?: Booking;
        error?: string;
      };
      if (!response.ok || !payload.booking) {
        setError(payload.error || 'Could not update the booking.');
        return null;
      }
      setBooking(payload.booking);
      return payload.booking;
    } catch {
      setError('Could not update the booking — please try again.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const updated = await postAction({ action: 'cancel' });
    if (updated) setMessage('Your booking has been cancelled. A confirmation email is on its way.');
  }

  async function reschedule(slot: Slot) {
    const updated = await postAction({ action: 'reschedule', startAt: slot.startAt });
    if (updated) {
      setMessage('Your booking has been moved. A confirmation email is on its way.');
      setRescheduling(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your booking…</p>;
  }

  if (error && !booking) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!booking) return null;

  const changeable = booking.status === 'requested' || booking.status === 'confirmed';

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{booking.serviceName}</h2>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
            {booking.status.replace('_', ' ')}
          </span>
        </div>
        <dl className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div>
            <dt className="inline font-medium text-foreground">When: </dt>
            <dd className="inline">{formatWhen(booking.startAt)}</dd>
          </div>
          {booking.resourceName ? (
            <div>
              <dt className="inline font-medium text-foreground">With: </dt>
              <dd className="inline">{booking.resourceName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="inline font-medium text-foreground">Name: </dt>
            <dd className="inline">{booking.customer.name}</dd>
          </div>
        </dl>
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {changeable ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRescheduling((current) => !current)}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {rescheduling ? 'Hide new times' : 'Reschedule'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={cancel}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Cancel booking'}
          </button>
        </div>
      ) : null}

      {rescheduling && changeable ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">New date</span>
            <input
              type="date"
              value={date}
              min={todayPlus(0)}
              onChange={(event) => setDate(event.target.value)}
              className="w-fit rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
          {slotsLoading ? (
            <p className="text-sm text-muted-foreground">Checking availability…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No times available on this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((slot) => (
                <button
                  key={slot.startAt}
                  type="button"
                  disabled={busy}
                  onClick={() => reschedule(slot)}
                  className="rounded-md border border-border px-2 py-2 text-sm transition-colors hover:border-primary disabled:opacity-50"
                >
                  {new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
                    new Date(slot.startAt)
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
