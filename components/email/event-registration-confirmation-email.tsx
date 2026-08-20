import {
  BaseEmailLayout,
  EmailCtaButton,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type EventRegistrationConfirmationEmailProps = {
  subject: string;
  firstName?: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  eventTitle: string;
  eventDateLabel: string;
  eventLocation: string;
  eventUrl: string;
};

export function EventRegistrationConfirmationEmail({
  subject,
  firstName,
  siteName,
  appUrl,
  logoUrl,
  eventTitle,
  eventDateLabel,
  eventLocation,
  eventUrl
}: EventRegistrationConfirmationEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="Your place is confirmed"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>{firstName ? `Hi ${firstName},` : 'Hello,'}</EmailParagraph>
      <EmailParagraph>
        Thank you for confirming your participation in <strong>{eventTitle}</strong>.
      </EmailParagraph>
      <EmailParagraph>
        <strong>When:</strong> {eventDateLabel}
        <br />
        <strong>Where:</strong> {eventLocation}
      </EmailParagraph>
      <EmailCtaButton href={eventUrl} label="View event details" />
      <EmailSmall>We will send any event-specific updates to this email address.</EmailSmall>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}
