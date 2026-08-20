import { BaseEmailLayout, EmailParagraph } from '@/components/email/base-email';

type WaitlistSignupNotificationEmailProps = {
  subject: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  email: string;
  source: string;
  userAgent: string;
  createdAt: string;
};

export function WaitlistSignupNotificationEmail({
  subject,
  siteName,
  appUrl,
  logoUrl,
  email,
  source,
  userAgent,
  createdAt
}: WaitlistSignupNotificationEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="New waitlist signup"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>
        A new user has joined the waitlist for the <strong>Academics Stand Against Poverty</strong> platform.
      </EmailParagraph>
      <EmailParagraph>
        <strong>Email:</strong> {email}
      </EmailParagraph>
      <EmailParagraph>
        <strong>Source:</strong> {source}
      </EmailParagraph>
      <EmailParagraph>
        <strong>User agent:</strong> {userAgent}
      </EmailParagraph>
      <EmailParagraph>
        <strong>Time:</strong> {createdAt}
      </EmailParagraph>
    </BaseEmailLayout>
  );
}

