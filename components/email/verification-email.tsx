import {
  BaseEmailLayout,
  EmailCtaButton,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type VerificationEmailProps = {
  subject: string;
  greeting: string;
  verificationUrl: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
};

export function VerificationEmail({
  subject,
  greeting,
  verificationUrl,
  siteName,
  appUrl,
  logoUrl
}: VerificationEmailProps) {
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
        To complete your setup and access the <strong>{siteName}</strong> platform, please
        verify your email address by clicking the link below:
      </EmailParagraph>
      <EmailCtaButton href={verificationUrl} label="Verify your email" />
      <EmailSmall>
        If the button does not work, copy and paste this link into your browser:
        <br />
        <EmailLink href={verificationUrl}>{verificationUrl}</EmailLink>
      </EmailSmall>
      <EmailSmall>
        <em>If you did not request this, you can safely ignore this email.</em>
      </EmailSmall>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}
