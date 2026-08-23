// Client-side types and helpers for the bookings workspace.
// Mirrors the server types in lib/booking/shared.ts (which is server-only).

export type TimeRange = { start: string; end: string };
export type WeeklyHoursEntry = { day: number; ranges: TimeRange[] };
export type AvailabilityException = { date: string; available: boolean; ranges: TimeRange[] };

export type BookingServiceItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  pricePence: number | null;
  active: boolean;
  sortOrder: number;
};

export type BookingResourceItem = {
  id: string;
  name: string;
  email: string;
  serviceIds: string[];
  weeklyHours: WeeklyHoursEntry[];
  exceptions: AvailabilityException[];
  active: boolean;
  sortOrder: number;
};

export type BookingStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type BookingItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  resourceId: string;
  resourceName: string;
  customer: { name: string; email: string; phone: string };
  startAt: string;
  endAt: string;
  status: BookingStatus;
  source: 'public' | 'admin';
  notes: string;
};

export type BookingSettingsItem = {
  timezone: string;
  slotGranularityMinutes: number;
  minLeadTimeHours: number;
  maxAdvanceDays: number;
  autoConfirm: boolean;
  notifyEmail: string;
  cancellationCutoffHours: number;
  retentionDays: number;
  manageTokenTtlDays: number;
  weeklyHours: WeeklyHoursEntry[];
  exceptions: AvailabilityException[];
};

export type BookingsOverviewPayload = {
  todayCount: number;
  pendingCount: number;
  weekCount: number;
  upcoming: BookingItem[];
  services: BookingServiceItem[];
  resources: BookingResourceItem[];
};

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const STATUS_LABELS: Record<BookingStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No-show'
};

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export async function apiSend<T>(url: string, method: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export function formatBookingWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatPrice(pricePence: number | null) {
  if (pricePence === null || pricePence === undefined) return '';
  return `£${(pricePence / 100).toFixed(pricePence % 100 === 0 ? 0 : 2)}`;
}

/** Value for datetime-local inputs from an ISO string. */
export function toDateTimeLocalValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
