import {
  BaseEmailLayout,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type NewsletterSubscribeConfirmationEmailProps = {
  subject: string;
  firstName?: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  preferencesUrl?: string;
  unsubscribeUrl: string;
};

export function NewsletterSubscribeConfirmationEmail({
  subject,
  firstName,
  siteName,
  appUrl,
  logoUrl,
  unsubscribeUrl
}: NewsletterSubscribeConfirmationEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="Thanks for subscribing"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>{firstName ? `Hi ${firstName},` : 'Hello,'}</EmailParagraph>
      <EmailParagraph>
        Thank you for subscribing to updates from <strong>{siteName}</strong>. We are glad to keep you informed.
      </EmailParagraph>
      <EmailParagraph>
        You will receive occasional messages about new research, upcoming events, and opportunities to take part in our
        work.
      </EmailParagraph>
      <EmailSmall>
        If you ever prefer to stop receiving these updates, you can unsubscribe here:{' '}
        <EmailLink href={unsubscribeUrl}>{unsubscribeUrl}</EmailLink>
      </EmailSmall>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}
