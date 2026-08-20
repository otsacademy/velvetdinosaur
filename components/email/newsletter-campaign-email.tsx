import { Section } from '@react-email/components';
import { BaseEmailLayout, EmailLink, EmailParagraph, EmailSmall } from '@/components/email/base-email';

type NewsletterCampaignEmailProps = {
  subject: string;
  preheader?: string;
  htmlBody: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  unsubscribeUrl: string;
};

export function NewsletterCampaignEmail({
  subject,
  preheader,
  htmlBody,
  siteName,
  appUrl,
  logoUrl,
  unsubscribeUrl
}: NewsletterCampaignEmailProps) {
  return (
    <BaseEmailLayout previewText={preheader || subject} heading={subject} siteName={siteName} appUrl={appUrl} logoUrl={logoUrl}>
      {preheader ? <EmailSmall>{preheader}</EmailSmall> : null}
      <Section dangerouslySetInnerHTML={{ __html: htmlBody }} />
      <EmailParagraph>
        You are receiving this email because you opted in to updates. Unsubscribe at any time:{' '}
        <EmailLink href={unsubscribeUrl}>Unsubscribe</EmailLink>
      </EmailParagraph>
    </BaseEmailLayout>
  );
}
