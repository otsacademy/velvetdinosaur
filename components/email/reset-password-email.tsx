import {
  BaseEmailLayout,
  EmailCtaButton,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type ResetPasswordEmailProps = {
  subject: string;
  greeting: string;
  resetUrl: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
};

export function ResetPasswordEmail({
  subject,
  greeting,
  resetUrl,
  siteName,
  appUrl,
  logoUrl
}: ResetPasswordEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading={subject}
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>{greeting}</EmailParagraph>
      <EmailParagraph>
        We received a request to reset the password for your <strong>{siteName}</strong> account.
        You can securely reset your password using the link below:
      </EmailParagraph>
      <EmailCtaButton href={resetUrl} label="Reset your password" />
      <EmailSmall>
        If the button does not work, copy and paste this link into your browser:
        <br />
        <EmailLink href={resetUrl}>{resetUrl}</EmailLink>
      </EmailSmall>
      <EmailSmall>
        <em>
          If you did not request this change, you can safely ignore this email and your existing password will remain
          unchanged.
        </em>
      </EmailSmall>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}

