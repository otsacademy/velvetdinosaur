import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/system-email-template-defaults.ts');

import { render } from '@react-email/render';
import { ContactEnquiryEmail } from '@/components/email/contact-enquiry-email';
import { EventRegistrationCampaignEmail } from '@/components/email/event-registration-campaign-email';
import { EventRegistrationConfirmationEmail } from '@/components/email/event-registration-confirmation-email';
import { EventRegistrationVerificationEmail } from '@/components/email/event-registration-verification-email';
import { GoogleAccountStatusEmail } from '@/components/email/google-account-status-email';
import { InviteEmail } from '@/components/email/invite-email';
import { NewsletterSubscribeConfirmationEmail } from '@/components/email/newsletter-subscribe-confirmation-email';
import { NewsletterUnsubscribeConfirmationEmail } from '@/components/email/newsletter-unsubscribe-confirmation-email';
import { OtpCodeEmail } from '@/components/email/otp-code-email';
import { ResetPasswordEmail } from '@/components/email/reset-password-email';
import { ReviewLinkEmail } from '@/components/email/review-link-email';
import { ReviewReminderEmail } from '@/components/email/review-reminder-email';
import { VerificationEmail } from '@/components/email/verification-email';
import { WaitlistSignupNotificationEmail } from '@/components/email/waitlist-signup-notification-email';
import { WelcomeConfirmationEmail } from '@/components/email/welcome-confirmation-email';
import { buildDefaultEventCampaignTemplateContent } from '@/lib/event-registration/default-campaign-template';
import { buildDefaultNewsletterCampaignTemplateContent } from '@/lib/newsletter/default-campaign-template';
import { type SystemEmailTemplateKey } from '@/lib/system-email-template-definitions';

export async function buildDefaultSystemEmailTemplateContent(key: SystemEmailTemplateKey) {
  if (key === 'invite') {
    const html = await render(
      InviteEmail({
        firstName: '{{firstName}}',
        email: '{{email}}',
        appName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        roleName: '{{roleName}}',
        permissions: ['{{permissionOne}}', '{{permissionTwo}}', '{{permissionThree}}'],
        inviteUrl: '{{inviteUrl}}',
        invitedByName: '{{invitedByName}}',
        logoUrl: '{{logoUrl}}'
      })
    );

    const text = [
      'Hi {{firstName}},',
      '',
      'We are delighted to welcome you to {{siteName}}.',
      '',
      'With your new role, you can create and edit content, publish updates, and contribute to chapter storytelling.',
      '',
      '- {{permissionOne}}',
      '- {{permissionTwo}}',
      '- {{permissionThree}}',
      '',
      'Set up your password:',
      '{{inviteUrl}}',
      '',
      'Best,',
      '{{invitedByName}}'
    ].join('\n');

    return { html, text };
  }

  if (key === 'verification') {
    const html = await render(
      VerificationEmail({
        subject: '{{subject}}',
        greeting: '{{greeting}}',
        verificationUrl: '{{verificationLink}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}'
      })
    );
    const text = [
      '{{greeting}}',
      '',
      'Please verify your email address by opening this link:',
      '{{verificationLink}}',
      '',
      'If you did not request this, you can safely ignore this email.'
    ].join('\n');
    return { html, text };
  }

  if (key === 'reset-password') {
    const html = await render(
      ResetPasswordEmail({
        subject: '{{subject}}',
        greeting: '{{greeting}}',
        resetUrl: '{{resetLink}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}'
      })
    );
    const text = [
      '{{greeting}}',
      '',
      'You can reset your password using this link:',
      '{{resetLink}}',
      '',
      'If you did not request this, ignore this email.'
    ].join('\n');
    return { html, text };
  }

  if (key === 'otp') {
    const html = await render(
      OtpCodeEmail({
        subject: '{{subject}}',
        action: '{{action}}',
        otp: '{{otpCode}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}'
      })
    );
    const text = ['Use this one-time code to {{action}}:', '', '{{otpCode}}', '', 'This code expires shortly.'].join(
      '\n'
    );
    return { html, text };
  }

  if (key === 'welcome') {
    const html = await render(
      WelcomeConfirmationEmail({
        subject: '{{subject}}',
        firstName: '{{firstName}}',
        roleName: '{{roleName}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}'
      })
    );
    const text = [
      'Hi {{firstName}},',
      '',
      'Your account is now active and you can access the ASAP website backend.',
      'Sign in: {{appUrl}}',
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');
    return { html, text };
  }

  if (key === 'contact-enquiry') {
    const html = await render(
      ContactEnquiryEmail({
        name: '{{name}}',
        email: '{{email}}',
        topic: '{{topic}}',
        message: '{{message}}',
        sentAt: '{{sentAt}}',
        appName: '{{appName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}'
      })
    );

    const text = [
      'You have received a new contact enquiry from the Academics Stand Against Poverty website.',
      '',
      'Name: {{name}}',
      'Email: {{email}}',
      'Topic: {{topic}}',
      '',
      'Message:',
      '{{message}}',
      '',
      'Received: {{sentAt}}',
      '',
      'Reply directly to this email to respond to the sender.'
    ].join('\n');

    return { html, text };
  }

  if (key === 'newsletter-campaign') {
    const defaults = buildDefaultNewsletterCampaignTemplateContent();
    return { html: defaults.htmlBody, text: defaults.textBody };
  }

  if (key === 'newsletter-subscribe-confirmation') {
    const html = await render(
      NewsletterSubscribeConfirmationEmail({
        subject: '{{subject}}',
        firstName: '{{firstName}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        preferencesUrl: '{{preferencesUrl}}',
        unsubscribeUrl: '{{unsubscribeUrl}}'
      })
    );

    const text = [
      'Hi {{firstName}},',
      '',
      'Thank you for subscribing to updates from {{siteName}}.',
      'We are glad to keep you informed about research, events, and opportunities.',
      '',
      'If you prefer to stop receiving updates, you can unsubscribe here: {{unsubscribeUrl}}',
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');

    return { html, text };
  }

  if (key === 'newsletter-unsubscribe-confirmation') {
    const html = await render(
      NewsletterUnsubscribeConfirmationEmail({
        subject: '{{subject}}',
        firstName: '{{firstName}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        resubscribeUrl: '{{resubscribeUrl}}'
      })
    );

    const text = [
      'Hi {{firstName}},',
      '',
      'We have processed your request and you are unsubscribed from newsletter updates from {{siteName}}.',
      'We are sorry to see you go, and we appreciate your time with our community.',
      '',
      'If you change your mind, you can subscribe again from our newsletter page: {{resubscribeUrl}}',
      'If this was not requested by you, please reply to this email so we can help right away.',
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');

    return { html, text };
  }

  if (key === 'event-registration-verification') {
    const html = await render(
      EventRegistrationVerificationEmail({
        subject: '{{subject}}',
        firstName: '{{firstName}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        eventTitle: '{{eventTitle}}',
        eventDateLabel: '{{eventDate}}',
        eventLocation: '{{eventLocation}}',
        confirmUrl: '{{confirmUrl}}',
        expiresInHours: 24
      })
    );

    const text = [
      'Hi {{firstName}},',
      '',
      'Please confirm your place for {{eventTitle}}.',
      'When: {{eventDate}}',
      'Where: {{eventLocation}}',
      '',
      'Confirm here: {{confirmUrl}}',
      '',
      'This confirmation link expires in approximately 24 hours.',
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');

    return { html, text };
  }

  if (key === 'event-registration-confirmation') {
    const html = await render(
      EventRegistrationConfirmationEmail({
        subject: '{{subject}}',
        firstName: '{{firstName}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        eventTitle: '{{eventTitle}}',
        eventDateLabel: '{{eventDate}}',
        eventLocation: '{{eventLocation}}',
        eventUrl: '{{eventUrl}}'
      })
    );

    const text = [
      'Hi {{firstName}},',
      '',
      'Thank you for confirming your participation in {{eventTitle}}.',
      'When: {{eventDate}}',
      'Where: {{eventLocation}}',
      '',
      'View the event details: {{eventUrl}}',
      '',
      'We will send any event-specific updates to this email address.',
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');

    return { html, text };
  }

  if (key === 'event-registration-update') {
    const defaults = buildDefaultEventCampaignTemplateContent('update');
    const html = await render(
      EventRegistrationCampaignEmail({
        subject: '{{subject}}',
        preheader: '{{preheader}}',
        htmlBody: defaults.htmlBody,
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        eventTitle: '{{eventTitle}}',
        eventDateLabel: '{{eventDate}}',
        eventLocation: '{{eventLocation}}'
      })
    );
    return { html, text: defaults.textBody };
  }

  if (key === 'event-registration-joining-instructions') {
    const defaults = buildDefaultEventCampaignTemplateContent('joining-instructions');
    const html = await render(
      EventRegistrationCampaignEmail({
        subject: '{{subject}}',
        preheader: '{{preheader}}',
        htmlBody: defaults.htmlBody,
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        eventTitle: '{{eventTitle}}',
        eventDateLabel: '{{eventDate}}',
        eventLocation: '{{eventLocation}}'
      })
    );
    return { html, text: defaults.textBody };
  }

  if (key === 'waitlist-notification') {
    const html = await render(
      WaitlistSignupNotificationEmail({
        subject: '{{subject}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        email: '{{email}}',
        source: '{{source}}',
        userAgent: '{{userAgent}}',
        createdAt: '{{createdAt}}'
      })
    );

    const text = [
      'A new user has joined the waitlist.',
      '',
      'Email: {{email}}',
      'Source: {{source}}',
      'User agent: {{userAgent}}',
      'Time: {{createdAt}}'
    ].join('\n');

    return { html, text };
  }

  if (key === 'google-linked') {
    const html = await render(
      GoogleAccountStatusEmail({
        subject: '{{subject}}',
        firstName: '{{firstName}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        status: 'linked'
      })
    );

    const text = [
      'Hi {{firstName}},',
      '',
      'Your Google account has been successfully linked to your ASAP profile.',
      'You can now use Log in with Google on the sign-in page.'
    ].join('\n');

    return { html, text };
  }

  if (key === 'google-unlinked') {
    const html = await render(
      GoogleAccountStatusEmail({
        subject: '{{subject}}',
        firstName: '{{firstName}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}',
        status: 'unlinked'
      })
    );

    const text = [
      'Hi {{firstName}},',
      '',
      'Your Google account has been successfully unlinked from your ASAP profile.',
      'Use email/password to sign in moving forward.'
    ].join('\n');

    return { html, text };
  }

  if (key === 'review-request') {
    const html = await render(
      ReviewLinkEmail({
        subject: '{{subject}}',
        greeting: '{{greeting}}',
        startsLabel: '{{reviewStart}}',
        deadlineLabel: '{{deadline}}',
        reviewUrl: '{{reviewLink}}',
        siteName: '{{siteName}}',
        appUrl: '{{appUrl}}',
        logoUrl: '{{logoUrl}}'
      })
    );

    const text = [
      '{{greeting}}',
      '',
      'You have been invited to review website updates. Please share your comments in review mode.',
      'Review opens: {{reviewStart}}',
      'Deadline: {{deadline}}',
      'Review Link: {{reviewLink}}'
    ].join('\n');

    return { html, text };
  }

  const html = await render(
    ReviewReminderEmail({
      subject: '{{subject}}',
      remaining: '{{remaining}}',
      deadlineLabel: '{{deadline}}',
      reviewUrl: '{{reviewLink}}',
      siteName: '{{siteName}}',
      appUrl: '{{appUrl}}',
      logoUrl: '{{logoUrl}}'
    })
  );

  const text = [
    'Hello,',
    '',
    'This is a reminder that your review link closes soon.',
    'Time remaining: {{remaining}}',
    'Review closes: {{deadline}}',
    'Review Link: {{reviewLink}}'
  ].join('\n');

  return { html, text };
}
