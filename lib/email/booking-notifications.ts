import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/booking-notifications.ts');

import { sendPostmarkEmail } from '@/lib/email/postmark';
import {
  buildBrandedEmailHtml,
  buildCtaButtonHtml,
  escapeHtml,
  resolveDefaultAppUrl,
  resolveLogoUrl,
  resolveSiteName
} from '@/lib/email-branding';
import type { BookingData } from '@/lib/booking/shared';

function formatBookingWhen(booking: BookingData, timezone: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(booking.startAt));
  } catch {
    return booking.startAt;
  }
}

function buildManageUrl(token: string) {
  const appUrl = resolveDefaultAppUrl();
  return `${appUrl}/booking/manage?token=${encodeURIComponent(token)}`;
}

function bookingSummaryRows(booking: BookingData, timezone: string) {
  const rows = [
    ['What', booking.serviceName],
    ['When', formatBookingWhen(booking, timezone)],
    booking.resourceName ? ['With', booking.resourceName] : null,
    ['Name', booking.customer.name]
  ].filter((row): row is string[] => row !== null);
  return rows
    .map(
      ([label, value]) =>
        `<p style="margin:4px 0;font-size:14px;color:#374151"><strong style="color:#111827">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
    )
    .join('');
}

function bookingSummaryText(booking: BookingData, timezone: string) {
  const lines = [
    `What: ${booking.serviceName}`,
    `When: ${formatBookingWhen(booking, timezone)}`,
    booking.resourceName ? `With: ${booking.resourceName}` : '',
    `Name: ${booking.customer.name}`
  ].filter(Boolean);
  return lines.join('\n');
}

type BookingEmailInput = {
  booking: BookingData;
  timezone: string;
  manageToken?: string;
};

function send(input: BookingEmailInput, options: { subject: string; heading: string; intro: string; outro?: string; tag: string }) {
  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const manageUrl = input.manageToken ? buildManageUrl(input.manageToken) : '';

  const bodyHtml = [
    `<p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 12px">${escapeHtml(options.intro)}</p>`,
    bookingSummaryRows(input.booking, input.timezone),
    manageUrl ? buildCtaButtonHtml(manageUrl, 'View, change or cancel your booking') : '',
    options.outro
      ? `<p style="font-size:13px;line-height:1.6;color:#6b7280;margin:12px 0 0">${escapeHtml(options.outro)}</p>`
      : ''
  ].join('');

  const textBody = [
    options.intro,
    '',
    bookingSummaryText(input.booking, input.timezone),
    manageUrl ? `\nView, change or cancel your booking: ${manageUrl}` : '',
    options.outro ? `\n${options.outro}` : ''
  ].join('\n');

  return sendPostmarkEmail({
    to: input.booking.customer.email,
    subject: options.subject,
    htmlBody: buildBrandedEmailHtml({
      previewText: options.subject,
      heading: options.heading,
      siteName,
      appUrl,
      logoUrl,
      bodyHtml
    }),
    textBody,
    tag: options.tag,
    metadata: { bookingId: input.booking.id }
  });
}

export function sendBookingConfirmedEmail(input: BookingEmailInput) {
  return send(input, {
    subject: `Booking confirmed — ${input.booking.serviceName}`,
    heading: 'Your booking is confirmed',
    intro: 'Thanks — your booking is confirmed. Here are the details:',
    outro: 'Need to change something? Use the link above to reschedule or cancel.',
    tag: 'booking-confirmed'
  });
}

export function sendBookingRequestReceivedEmail(input: BookingEmailInput) {
  return send(input, {
    subject: `Booking request received — ${input.booking.serviceName}`,
    heading: 'We have your booking request',
    intro: 'Thanks — we have received your booking request and will confirm it shortly. Here are the details:',
    outro: 'Need to change something? Use the link above to reschedule or cancel.',
    tag: 'booking-requested'
  });
}

export function sendBookingCancelledEmail(input: BookingEmailInput) {
  return send(input, {
    subject: `Booking cancelled — ${input.booking.serviceName}`,
    heading: 'Your booking has been cancelled',
    intro: 'Your booking has been cancelled. The details of the cancelled booking:',
    tag: 'booking-cancelled'
  });
}

export async function sendBookingAdminNotificationEmail(
  input: BookingEmailInput & { notifyEmail: string }
) {
  if (!input.notifyEmail) return { ok: true, messageId: '' };
  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const booking = input.booking;
  const subject = `New booking ${booking.status === 'requested' ? 'request' : ''} — ${booking.serviceName}`;
  const contactLine = [
    booking.customer.email,
    booking.customer.phone ? ` · ${booking.customer.phone}` : ''
  ].join('');
  const bodyHtml = [
    bookingSummaryRows(booking, input.timezone),
    `<p style="margin:4px 0;font-size:14px;color:#374151"><strong style="color:#111827">Contact:</strong> ${escapeHtml(contactLine)}</p>`,
    booking.notes
      ? `<p style="margin:4px 0;font-size:14px;color:#374151"><strong style="color:#111827">Notes:</strong> ${escapeHtml(booking.notes)}</p>`
      : '',
    buildCtaButtonHtml(`${appUrl}/edit/bookings`, 'Open the bookings dashboard')
  ].join('');
  return sendPostmarkEmail({
    to: input.notifyEmail,
    subject,
    htmlBody: buildBrandedEmailHtml({ previewText: subject, heading: subject, siteName, appUrl, logoUrl, bodyHtml }),
    textBody: `${subject}\n\n${bookingSummaryText(booking, input.timezone)}\nContact: ${contactLine}\n\nManage: ${appUrl}/edit/bookings`,
    tag: 'booking-admin-notification',
    metadata: { bookingId: booking.id }
  });
}
