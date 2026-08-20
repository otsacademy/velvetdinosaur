import {
  BaseEmailLayout,
  EmailCtaButton,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type NewsletterSubscriptionVerificationEmailProps = {
  subject: string;
  firstName?: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  confirmUrl: string;
  expiresInHours: number;
};

export function NewsletterSubscriptionVerificationEmail({
  subject,
  firstName,
  siteName,
  appUrl,
  logoUrl,
  confirmUrl,
  expiresInHours
}: NewsletterSubscriptionVerificationEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="Confirm your subscription"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>{firstName ? `Hi ${firstName},` : 'Hello,'}</EmailParagraph>
      <EmailParagraph>
        Please confirm your email address to start receiving updates from <strong>{siteName}</strong>.
      </EmailParagraph>
      <EmailCtaButton href={confirmUrl} label="Confirm subscription" />
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
