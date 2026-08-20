import {
  BaseEmailLayout,
  EmailCtaButton,
  EmailLink,
  EmailParagraph,
  EmailSignature,
  EmailSmall
} from '@/components/email/base-email';

type SupportTicketSystemUpdateEmailProps = {
  subject: string;
  greeting: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  ticketRef: string;
  ticketSubject: string;
  messageText: string;
  ticketUrl: string;
};

export function SupportTicketSystemUpdateEmail({
  subject,
  greeting,
  siteName,
  appUrl,
  logoUrl,
  ticketRef,
  ticketSubject,
  messageText,
  ticketUrl
}: SupportTicketSystemUpdateEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading="Your support ticket has a new update"
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>{greeting}</EmailParagraph>
      <EmailParagraph>
        Great news, we have a fresh update from <strong>Velvet Dinosaur Support</strong> on your support request.
      </EmailParagraph>
      <EmailParagraph>
        <strong>Ticket:</strong> {ticketRef}
        <br />
        <strong>Subject:</strong> {ticketSubject}
      </EmailParagraph>
      <EmailParagraph>
        <strong>Latest message:</strong>
      </EmailParagraph>
      <EmailParagraph>
        <span style={{ whiteSpace: 'pre-wrap' }}>{messageText}</span>
      </EmailParagraph>
      <EmailCtaButton href={ticketUrl} label="Open this ticket" />
      <EmailParagraph>
        <strong>Direct link:</strong> <EmailLink href={ticketUrl}>{ticketUrl}</EmailLink>
      </EmailParagraph>
      <EmailSmall>
        This notification was sent to administrators only so your support team can follow up quickly.
      </EmailSmall>
      <EmailParagraph>Thanks for keeping everything moving.</EmailParagraph>
      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}
