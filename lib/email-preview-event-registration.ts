import { render } from '@react-email/render';
import { EventRegistrationCampaignEmail } from '@/components/email/event-registration-campaign-email';
import { EventRegistrationConfirmationEmail } from '@/components/email/event-registration-confirmation-email';
import { EventRegistrationVerificationEmail } from '@/components/email/event-registration-verification-email';

export const EVENT_REGISTRATION_EMAIL_PREVIEW_KEYS = [
  'event-registration-verification',
  'event-registration-confirmation',
  'event-registration-update',
  'event-registration-joining-instructions'
] as const;

export type EventRegistrationEmailPreviewTemplateKey =
  (typeof EVENT_REGISTRATION_EMAIL_PREVIEW_KEYS)[number];

type EventRegistrationPreviewMeta = {
  key: EventRegistrationEmailPreviewTemplateKey;
  label: string;
  description: string;
  textBody: string;
};

type EventRegistrationSample = {
  appName: string;
  appUrl: string;
  logoUrl: string;
  eventTitle: string;
  eventUrl: string;
  confirmUrl: string;
  dateLabel: string;
  location: string;
  joiningInstructions: string;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function getSample(appUrl: string): EventRegistrationSample {
  const baseUrl = normalizeBaseUrl(appUrl);
  const eventSlug = 'global-justice-summit-2026';
  return {
    appName: 'ASAP',
    appUrl: baseUrl,
    logoUrl: `${baseUrl}/images/asap-logo.png`,
    eventTitle: 'Global Justice Summit 2026',
    eventUrl: `${baseUrl}/events/${eventSlug}`,
    confirmUrl: `${baseUrl}/events/registration/confirm?token=sample-event-token`,
    dateLabel: 'Thu, April 23, 2026, 15:00 UTC',
    location: 'Online / Zoom',
    joiningInstructions:
      'Join Zoom: https://example.zoom.us/j/123456789. Please join 10 minutes early and keep your confirmation email to hand.'
  };
}

export function isEventRegistrationEmailPreviewTemplateKey(
  value: string
): value is EventRegistrationEmailPreviewTemplateKey {
  return EVENT_REGISTRATION_EMAIL_PREVIEW_KEYS.includes(
    value as EventRegistrationEmailPreviewTemplateKey
  );
}

export async function renderEventRegistrationEmailPreviewHtml(
  key: EventRegistrationEmailPreviewTemplateKey,
  appUrl: string
) {
  const sample = getSample(appUrl);

  if (key === 'event-registration-verification') {
    return render(
      EventRegistrationVerificationEmail({
        subject: `Please confirm your registration for ${sample.eventTitle}`,
        firstName: 'Sam',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl,
        eventTitle: sample.eventTitle,
        eventDateLabel: sample.dateLabel,
        eventLocation: sample.location,
        confirmUrl: sample.confirmUrl,
        expiresInHours: 24
      })
    );
  }

  if (key === 'event-registration-confirmation') {
    return render(
      EventRegistrationConfirmationEmail({
        subject: `Your place is confirmed for ${sample.eventTitle}`,
        firstName: 'Sam',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl,
        eventTitle: sample.eventTitle,
        eventDateLabel: sample.dateLabel,
        eventLocation: sample.location,
        eventUrl: sample.eventUrl
      })
    );
  }

  return render(
    EventRegistrationCampaignEmail({
      subject:
        key === 'event-registration-joining-instructions'
          ? `Joining instructions for ${sample.eventTitle}`
          : `Important update for ${sample.eventTitle}`,
      preheader:
        key === 'event-registration-joining-instructions'
          ? 'Everything you need to join the event.'
          : 'A quick update for confirmed participants.',
      htmlBody:
        key === 'event-registration-joining-instructions'
          ? `<p>Hi Sam,</p><p>Here are the joining instructions for <strong>${sample.eventTitle}</strong>.</p><p>${sample.joiningInstructions}</p><p>Latest details: <a href="${sample.eventUrl}">${sample.eventUrl}</a></p>`
          : `<p>Hi Sam,</p><p>We wanted to share an update about <strong>${sample.eventTitle}</strong>.</p><p>The start time has moved forward by 15 minutes and the chair will now open with a short remarks session.</p><p>Latest details: <a href="${sample.eventUrl}">${sample.eventUrl}</a></p>`,
      siteName: sample.appName,
      appUrl: sample.appUrl,
      logoUrl: sample.logoUrl,
      eventTitle: sample.eventTitle,
      eventDateLabel: sample.dateLabel,
      eventLocation: sample.location
    })
  );
}

export function buildEventRegistrationEmailPreviewText(
  key: EventRegistrationEmailPreviewTemplateKey,
  appUrl: string
) {
  const sample = getSample(appUrl);

  if (key === 'event-registration-verification') {
    return [
      'Hi Sam,',
      '',
      `Please confirm your place for ${sample.eventTitle}.`,
      `When: ${sample.dateLabel}`,
      `Where: ${sample.location}`,
      '',
      `Confirm here: ${sample.confirmUrl}`,
      '',
      'This confirmation link expires in approximately 24 hours.',
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');
  }

  if (key === 'event-registration-confirmation') {
    return [
      'Hi Sam,',
      '',
      `Thank you for confirming your participation in ${sample.eventTitle}.`,
      `When: ${sample.dateLabel}`,
      `Where: ${sample.location}`,
      '',
      `View the event details: ${sample.eventUrl}`,
      '',
      'We will send any event-specific updates to this email address.',
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');
  }

  if (key === 'event-registration-joining-instructions') {
    return [
      'Hi Sam,',
      '',
      `Here are the joining instructions for ${sample.eventTitle}.`,
      '',
      sample.joiningInstructions,
      '',
      `Latest event details: ${sample.eventUrl}`,
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');
  }

  return [
    'Hi Sam,',
    '',
    `We wanted to share an update about ${sample.eventTitle}.`,
    '',
    'The start time has moved forward by 15 minutes and the chair will now open with a short remarks session.',
    '',
    `Latest event details: ${sample.eventUrl}`,
    '',
    'Best,',
    'The ASAP Global Team'
  ].join('\n');
}

export function getEventRegistrationEmailPreviewTemplates(appUrl: string): EventRegistrationPreviewMeta[] {
  return [
    {
      key: 'event-registration-verification',
      label: 'Event Registration Verification',
      description: 'Double opt-in email sent after someone requests a place on a local-registration event.',
      textBody: buildEventRegistrationEmailPreviewText('event-registration-verification', appUrl)
    },
    {
      key: 'event-registration-confirmation',
      label: 'Event Registration Confirmation',
      description: 'Confirmation sent after a registrant clicks the event participation confirmation link.',
      textBody: buildEventRegistrationEmailPreviewText('event-registration-confirmation', appUrl)
    },
    {
      key: 'event-registration-update',
      label: 'Event Registration Update',
      description: 'Default campaign template for event-specific updates sent to confirmed participants.',
      textBody: buildEventRegistrationEmailPreviewText('event-registration-update', appUrl)
    },
    {
      key: 'event-registration-joining-instructions',
      label: 'Event Joining Instructions',
      description: 'Default campaign template used to send Zoom, Meet, or final joining details to confirmed participants.',
      textBody: buildEventRegistrationEmailPreviewText('event-registration-joining-instructions', appUrl)
    }
  ];
}
