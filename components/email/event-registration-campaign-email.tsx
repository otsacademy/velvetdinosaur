import { Section } from '@react-email/components';
import { BaseEmailLayout, EmailParagraph, EmailSmall } from '@/components/email/base-email';

type EventRegistrationCampaignEmailProps = {
  subject: string;
  preheader?: string;
  htmlBody: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  eventTitle: string;
  eventDateLabel: string;
  eventLocation: string;
};

export function EventRegistrationCampaignEmail({
  subject,
  preheader,
  htmlBody,
  siteName,
  appUrl,
  logoUrl,
  eventTitle,
  eventDateLabel,
  eventLocation
}: EventRegistrationCampaignEmailProps) {
  return (
    <BaseEmailLayout previewText={preheader || subject} heading={subject} siteName={siteName} appUrl={appUrl} logoUrl={logoUrl}>
      {preheader ? <EmailSmall>{preheader}</EmailSmall> : null}
      <EmailParagraph>
        <strong>{eventTitle}</strong>
        <br />
        {eventDateLabel}
        <br />
        {eventLocation}
      </EmailParagraph>
      <Section>
        <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
      </Section>
    </BaseEmailLayout>
  );
}
