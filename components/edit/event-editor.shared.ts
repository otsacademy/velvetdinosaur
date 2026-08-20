import { type EventLocationType, type EventRegistrationMode } from '@/lib/events';

export function toDateTimeInput(value?: string | Date | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function parseDateTimeInput(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toTimeInputValue(value?: Date | null) {
  if (!value) return '09:00';
  const hours = `${value.getHours()}`.padStart(2, '0');
  const minutes = `${value.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function mergeDateAndTime(date: Date, timeValue: string) {
  const next = new Date(date);
  const [rawHours = '09', rawMinutes = '00'] = timeValue.split(':');
  const hours = Number.parseInt(rawHours, 10);
  const minutes = Number.parseInt(rawMinutes, 10);
  next.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return next;
}

export function normalizeTagsInput(tags: string[]) {
  return tags.join(', ');
}

export function locationTypeLabel(value: EventLocationType) {
  if (value === 'in-person') return 'In-person';
  if (value === 'virtual') return 'Virtual';
  return 'Hybrid';
}

export function normalizeInitialHeroImage(value?: string | null) {
  const normalized = value?.trim() || '';
  if (!normalized || normalized === '/images/placeholder.svg') return '';
  return normalized;
}

export function registrationModeLabel(value: EventRegistrationMode) {
  if (value === 'external') return 'External registration link';
  if (value === 'local') return 'Local RSVP with email confirmation';
  return 'No registration';
}
