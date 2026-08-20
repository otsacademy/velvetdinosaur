import {
  BaseEmailLayout,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type NewsletterUnsubscribeConfirmationEmailProps = {
  subject: string;
  firstName: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  resubscribeUrl: string;
};

export function NewsletterUnsubscribeConfirmationEmail({
  subject,
  firstName,
  siteName,
  appUrl,
  logoUrl,
  resubscribeUrl
}: NewsletterUnsubscribeConfirmationEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="You are unsubscribed"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>Hi {firstName},</EmailParagraph>
      <EmailParagraph>
        We have processed your request and you are now unsubscribed from newsletter updates from{' '}
        <strong>{siteName}</strong>.
      </EmailParagraph>
      <EmailParagraph>
        We are sorry to see you go, and we appreciate the time you spent with our community.
      </EmailParagraph>
      <EmailParagraph>
        If you change your mind, you can subscribe again from our newsletter page:{' '}
        <EmailLink href={resubscribeUrl}>{resubscribeUrl}</EmailLink>
      </EmailParagraph>
      <EmailSmall>If this was not requested by you, please reply to this email so we can help right away.</EmailSmall>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}
