import {
  BaseEmailLayout,
  EmailLink,
  EmailList,
  EmailListItem,
  EmailParagraph,
  EmailSignature
} from '@/components/email/base-email';

type WelcomeConfirmationEmailProps = {
  subject: string;
  firstName: string;
  roleName: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
};

export function WelcomeConfirmationEmail({
  subject,
  firstName,
  roleName,
  siteName,
  appUrl,
  logoUrl
}: WelcomeConfirmationEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading={`Welcome to ${siteName}`}
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>Hi {firstName},</EmailParagraph>
      <EmailParagraph>
        Thanks for setting up your password. Your account is now active, and you have access to the{' '}
        <strong>{siteName}</strong> website backend.
      </EmailParagraph>
      <EmailParagraph>
        This portal is where we manage the site&apos;s content. Depending on your {roleName} permissions, you can
        jump right in to:
      </EmailParagraph>
      <EmailList>
        <EmailListItem>
          <strong>Add News and Events:</strong> Draft and publish the latest articles, announcements, and
          chapter updates.
        </EmailListItem>
        <EmailListItem>
          <strong>Update Web Pages:</strong> Edit text and keep our core research initiatives current.
        </EmailListItem>
        <EmailListItem>
          <strong>Manage Media:</strong> Upload images and documents to support our pages.
        </EmailListItem>
      </EmailList>
      <EmailParagraph>
        You can log in to the admin dashboard anytime using this link: <EmailLink href={appUrl}>{appUrl}</EmailLink>
      </EmailParagraph>
      <EmailParagraph>
        If you run into any technical bugs or need help navigating the website editor, just reply to this email.
        We&apos;re here to help.
      </EmailParagraph>
      <EmailParagraph>Thanks for helping us maintain the site!</EmailParagraph>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}

