import {
  BaseEmailLayout,
  EmailCtaButton,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type EventRegistrationVerificationEmailProps = {
  subject: string;
  firstName?: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  eventTitle: string;
  eventDateLabel: string;
  eventLocation: string;
  confirmUrl: string;
  expiresInHours: number;
};

export function EventRegistrationVerificationEmail({
  subject,
  firstName,
  siteName,
  appUrl,
  logoUrl,
  eventTitle,
  eventDateLabel,
  eventLocation,
  confirmUrl,
  expiresInHours
}: EventRegistrationVerificationEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="Confirm your event registration"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>{firstName ? `Hi ${firstName},` : 'Hello,'}</EmailParagraph>
      <EmailParagraph>
        Please confirm your place for <strong>{eventTitle}</strong>.
      </EmailParagraph>
      <EmailParagraph>
        <strong>When:</strong> {eventDateLabel}
        <br />
        <strong>Where:</strong> {eventLocation}
      </EmailParagraph>
      <EmailCtaButton href={confirmUrl} label="Confirm participation" />
      <EmailSmall>
        This confirmation link expires in approximately {Math.max(1, expiresInHours)} hour
        {Math.max(1, expiresInHours) === 1 ? '' : 's'}.
      </EmailSmall>
      <EmailSmall>
        If the button does not work, open this link directly: <EmailLink href={confirmUrl}>{confirmUrl}</EmailLink>
      </EmailSmall>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}
