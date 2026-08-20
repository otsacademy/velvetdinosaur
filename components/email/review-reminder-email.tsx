import {
  BaseEmailLayout,
  EmailCtaButton,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type ReviewReminderEmailProps = {
  subject: string;
  remaining: string;
  deadlineLabel: string;
  reviewUrl: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
};

export function ReviewReminderEmail({
  subject,
  remaining,
  deadlineLabel,
  reviewUrl,
  siteName,
  appUrl,
  logoUrl
}: ReviewReminderEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="Review Reminder"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>Hello,</EmailParagraph>
      <EmailParagraph>
        This is a quick reminder that your invitation to review a draft page for{' '}
        <strong>Academics Stand Against Poverty</strong> is closing soon.
      </EmailParagraph>
      <EmailParagraph>
        <strong>Time remaining:</strong> {remaining}
      </EmailParagraph>
      <EmailParagraph>
        <strong>Review closes:</strong> {deadlineLabel}
      </EmailParagraph>
      <EmailCtaButton href={reviewUrl} label="Open review link" />
      <EmailParagraph>
        <strong>Review Link:</strong> <EmailLink href={reviewUrl}>{reviewUrl}</EmailLink>
      </EmailParagraph>
      <EmailSmall>
        <em>
          Please note: After the deadline passes, commenting and status updates will be automatically locked unless
          reopened by an admin.
        </em>
      </EmailSmall>
      <EmailParagraph>Thank you again for your help.</EmailParagraph>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}

