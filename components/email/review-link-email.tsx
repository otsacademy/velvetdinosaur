import {
  BaseEmailLayout,
  EmailCtaButton,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type ReviewLinkEmailProps = {
  subject: string;
  greeting: string;
  startsLabel?: string;
  deadlineLabel: string;
  reviewUrl: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
};

export function ReviewLinkEmail({
  subject,
  greeting,
  startsLabel,
  deadlineLabel,
  reviewUrl,
  siteName,
  appUrl,
  logoUrl
}: ReviewLinkEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="Review Request"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>{greeting}</EmailParagraph>
      <EmailParagraph>
        You have been invited to review website updates for <strong>Academics Stand Against Poverty</strong>. Please
        add your comments directly in review mode so we can improve both content and user experience.
      </EmailParagraph>
      <EmailParagraph>Please review the draft and submit your feedback before the deadline.</EmailParagraph>
      {startsLabel ? (
        <EmailParagraph>
          <strong>Review opens:</strong> {startsLabel}
        </EmailParagraph>
      ) : null}
      <EmailParagraph>
        <strong>Deadline:</strong> {deadlineLabel}
      </EmailParagraph>
      <EmailCtaButton href={reviewUrl} label="Open review link" />
      <EmailParagraph>
        <strong>Review Link:</strong> <EmailLink href={reviewUrl}>{reviewUrl}</EmailLink>
      </EmailParagraph>
      <EmailSmall>
        <em>Note: This link will expire automatically at the deadline above.</em>
      </EmailSmall>
      <EmailParagraph>Thank you for your time and expertise.</EmailParagraph>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}
