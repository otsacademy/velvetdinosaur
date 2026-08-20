import { render } from '@react-email/render';
import { ContactEnquiryEmail } from '@/components/email/contact-enquiry-email';
import { GoogleAccountStatusEmail } from '@/components/email/google-account-status-email';
import { InviteEmail } from '@/components/email/invite-email';
import { NewsletterCampaignEmail } from '@/components/email/newsletter-campaign-email';
import { NewsletterSubscribeConfirmationEmail } from '@/components/email/newsletter-subscribe-confirmation-email';
import { NewsletterUnsubscribeConfirmationEmail } from '@/components/email/newsletter-unsubscribe-confirmation-email';
import { OtpCodeEmail } from '@/components/email/otp-code-email';
import { ResetPasswordEmail } from '@/components/email/reset-password-email';
import { ReviewLinkEmail } from '@/components/email/review-link-email';
import { ReviewReminderEmail } from '@/components/email/review-reminder-email';
import { VerificationEmail } from '@/components/email/verification-email';
import { WaitlistSignupNotificationEmail } from '@/components/email/waitlist-signup-notification-email';
import { WelcomeConfirmationEmail } from '@/components/email/welcome-confirmation-email';
import {
  EVENT_REGISTRATION_EMAIL_PREVIEW_KEYS,
  getEventRegistrationEmailPreviewTemplates,
  isEventRegistrationEmailPreviewTemplateKey,
  renderEventRegistrationEmailPreviewHtml,
  buildEventRegistrationEmailPreviewText,
  type EventRegistrationEmailPreviewTemplateKey
} from '@/lib/email-preview-event-registration';

export type EmailPreviewTemplateKey =
  | 'invite'
  | 'verification'
  | 'reset-password'
  | 'otp'
  | 'welcome'
  | 'contact-enquiry'
  | 'newsletter-campaign'
  | 'newsletter-subscribe-confirmation'
  | 'newsletter-unsubscribe-confirmation'
  | 'waitlist-notification'
  | 'google-linked'
  | 'google-unlinked'
  | 'review-request'
  | 'review-reminder'
  | EventRegistrationEmailPreviewTemplateKey;

export type EmailPreviewTemplateMeta = {
  key: EmailPreviewTemplateKey;
  label: string;
  description: string;
  textBody: string;
};

const TEMPLATE_KEYS: EmailPreviewTemplateKey[] = [
  'invite',
  'verification',
  'reset-password',
  'otp',
  'welcome',
  'contact-enquiry',
  'newsletter-campaign',
  'newsletter-subscribe-confirmation',
  'newsletter-unsubscribe-confirmation',
  'waitlist-notification',
  'google-linked',
  'google-unlinked',
  'review-request',
  'review-reminder',
  ...EVENT_REGISTRATION_EMAIL_PREVIEW_KEYS
];

function getSample(appUrl: string) {
  const inviteUrl = `${appUrl}/sign-up?invite=sample-preview-token`;
  const verifyUrl = `${appUrl}/verify-email?token=sample-verification-token`;
  const resetUrl = `${appUrl}/reset-password?token=sample-reset-token`;
  const reviewUrl = `${appUrl}/review/preview-token`;
  const logoUrl = `${appUrl}/images/asap-logo.png`;
  const reviewDeadlineLabel = 'Fri, March 6, 2026, 04:00 PM';
  const reminderDeadlineLabel = 'Fri, March 6, 2026, 04:00 PM (2026-03-06 16:00 UTC)';

  return {
    appName: 'ASAP',
    appUrl,
    logoUrl,
    inviteUrl,
    verifyUrl,
    resetUrl,
    reviewUrl,
    reviewDeadlineLabel,
    reminderDeadlineLabel,
    greeting: 'Hello Sam,'
  };
}

export function isEmailPreviewTemplateKey(value: string): value is EmailPreviewTemplateKey {
  return TEMPLATE_KEYS.includes(value as EmailPreviewTemplateKey);
}

export function resolvePreviewAppUrl(requestUrl: string) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || '';
  if (configured.trim()) {
    return configured.replace(/\/+$/, '');
  }
  const url = new URL(requestUrl);
  return `${url.protocol}//${url.host}`;
}

export async function renderEmailPreviewHtml(key: EmailPreviewTemplateKey, appUrl: string) {
  const sample = getSample(appUrl);

  if (isEventRegistrationEmailPreviewTemplateKey(key)) {
    return renderEventRegistrationEmailPreviewHtml(key, appUrl);
  }

  if (key === 'invite') {
    return render(
      InviteEmail({
        firstName: 'Sam',
        email: 'sam@example.com',
        appName: sample.appName,
        appUrl: sample.appUrl,
        roleName: 'Editor',
        permissions: [
          'Share Research: Create and edit pages to make cutting-edge evidence accessible to the public.',
          'Showcase Global Impact: Upload media from our regional chapters across six continents.',
          'Drive the Narrative: Publish changes and write news articles that help shift the conversation around the causes of, and solutions to, global poverty.'
        ],
        inviteUrl: sample.inviteUrl,
        invitedByName: 'Admin Team',
        logoUrl: sample.logoUrl
      })
    );
  }

  if (key === 'verification') {
    return render(
      VerificationEmail({
        subject: `Verify your email for ${sample.appName}`,
        greeting: sample.greeting,
        verificationUrl: sample.verifyUrl,
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl
      })
    );
  }

  if (key === 'reset-password') {
    return render(
      ResetPasswordEmail({
        subject: `Reset your password for ${sample.appName}`,
        greeting: sample.greeting,
        resetUrl: sample.resetUrl,
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl
      })
    );
  }

  if (key === 'otp') {
    return render(
      OtpCodeEmail({
        subject: 'Your ASAP security code',
        action: 'sign in',
        otp: '482913',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl
      })
    );
  }

  if (key === 'welcome') {
    return render(
      WelcomeConfirmationEmail({
        subject: 'Your ASAP website account is ready, Sam',
        firstName: 'Sam',
        roleName: 'Editor',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl
      })
    );
  }

  if (key === 'contact-enquiry') {
    return render(
      ContactEnquiryEmail({
        name: 'Sam Example',
        email: 'sam@example.org',
        topic: 'Research collaboration',
        message:
          'Thank you for your work.\nI would like to discuss a potential project focused on global poverty metrics.',
        sentAt: '2026-02-28 14:30 UTC',
        appName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl
      })
    );
  }

  if (key === 'newsletter-campaign') {
    return render(
      NewsletterCampaignEmail({
        subject: 'ASAP Monthly Update',
        preheader: 'Highlights from chapters, events, and publications.',
        htmlBody:
          '<p>Hello Sam,</p><p>Thank you for supporting Academics Stand Against Poverty. Here are this month&apos;s updates:</p><ul><li>New research publications are now live.</li><li>Regional chapter events are open for registration.</li><li>Review invitations for upcoming content will be sent next week.</li></ul><p>Visit the website for full details.</p>',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl,
        unsubscribeUrl: `${sample.appUrl}/newsletter/unsubscribe?token=sample-token`
      })
    );
  }

  if (key === 'newsletter-subscribe-confirmation') {
    return render(
      NewsletterSubscribeConfirmationEmail({
        subject: `You are subscribed to ${sample.appName} updates`,
        firstName: 'Sam',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl,
        preferencesUrl: `${sample.appUrl}/connect#newsletter`,
        unsubscribeUrl: `${sample.appUrl}/newsletter/unsubscribe?token=sample-token`
      })
    );
  }

  if (key === 'newsletter-unsubscribe-confirmation') {
    return render(
      NewsletterUnsubscribeConfirmationEmail({
        subject: `You are unsubscribed from ${sample.appName} updates`,
        firstName: 'Sam',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl,
        resubscribeUrl: `${sample.appUrl}/connect#newsletter`
      })
    );
  }

  if (key === 'waitlist-notification') {
    return render(
      WaitlistSignupNotificationEmail({
        subject: `New waitlist signup for ${sample.appName}`,
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl,
        email: 'new-user@example.org',
        source: 'homepage-hero',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        createdAt: '2026-02-28T14:40:00.000Z'
      })
    );
  }

  if (key === 'google-linked') {
    return render(
      GoogleAccountStatusEmail({
        subject: 'Your Google account is linked to ASAP',
        firstName: 'Sam',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl,
        status: 'linked'
      })
    );
  }

  if (key === 'google-unlinked') {
    return render(
      GoogleAccountStatusEmail({
        subject: 'Your Google account is unlinked from ASAP',
        firstName: 'Sam',
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl,
        status: 'unlinked'
      })
    );
  }

  if (key === 'review-request') {
    return render(
      ReviewLinkEmail({
        subject: `Review Request: Please provide feedback for ${sample.appName}`,
        greeting: sample.greeting,
        deadlineLabel: sample.reviewDeadlineLabel,
        reviewUrl: sample.reviewUrl,
        siteName: sample.appName,
        appUrl: sample.appUrl,
        logoUrl: sample.logoUrl
      })
    );
  }

  return render(
    ReviewReminderEmail({
      subject: `Reminder: Your ${sample.appName} review link closes soon`,
      remaining: '1 day 4 hours',
      deadlineLabel: sample.reminderDeadlineLabel,
      reviewUrl: sample.reviewUrl,
      siteName: sample.appName,
      appUrl: sample.appUrl,
      logoUrl: sample.logoUrl
    })
  );
}

export function buildEmailPreviewText(key: EmailPreviewTemplateKey, appUrl: string) {
  const sample = getSample(appUrl);

  if (isEventRegistrationEmailPreviewTemplateKey(key)) {
    return buildEventRegistrationEmailPreviewText(key, appUrl);
  }

  if (key === 'invite') {
    return [
      'Hi Sam,',
      '',
      `We are delighted to welcome you to ${sample.appName}.`,
      '',
      'With your new role, you can create and edit content, publish updates, and contribute to chapter storytelling.',
      '',
      'Set up your password:',
      sample.inviteUrl,
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');
  }

  if (key === 'verification') {
    return [
      sample.greeting,
      '',
      'Please verify your email address by opening this link:',
      sample.verifyUrl,
      '',
      'If you did not request this, you can safely ignore this email.'
    ].join('\n');
  }

  if (key === 'reset-password') {
    return [
      sample.greeting,
      '',
      'You can reset your password using this link:',
      sample.resetUrl,
      '',
      'If you did not request this, ignore this email.'
    ].join('\n');
  }

  if (key === 'otp') {
    return ['Use this one-time code to sign in:', '', '482913', '', 'This code expires shortly.'].join('\n');
  }

  if (key === 'welcome') {
    return [
      'Hi Sam,',
      '',
      'Your account is now active and you can access the ASAP website backend.',
      `Sign in: ${sample.appUrl}`,
      '',
      'Best,',
      'The ASAP Global Team'
    ].join('\n');
  }

  if (key === 'contact-enquiry') {
    return [
      'You have received a new contact enquiry from the ASAP website.',
      '',
      'Name: Sam Example',
      'Email: sam@example.org',
      'Topic: Research collaboration',
      '',
      'Message:',
      'Thank you for your work.',
      'I would like to discuss a potential project focused on global poverty metrics.',
      '',
      'Received: 2026-02-28 14:30 UTC'
    ].join('\n');
  }

  if (key === 'newsletter-campaign') {
    return [
      'Hello Sam,',
      '',
      'Thank you for supporting ASAP. Here are this month\'s updates:',
      '- New research publications are now live.',
      '- Regional chapter events are open for registration.',
      '- Review invitations for upcoming content will be sent next week.',
      '',
      'Visit the website for full details.',
      '',
      `Unsubscribe: ${sample.appUrl}/newsletter/unsubscribe?token=sample-token`
    ].join('\n');
  }

  if (key === 'newsletter-subscribe-confirmation') {
    return [
      'Hi Sam,',
      '',
      'Thank you for subscribing to updates from ASAP.',
      'We are glad to keep you informed about research, events, and opportunities.',
      '',
      `If you prefer to stop receiving updates, you can unsubscribe here: ${sample.appUrl}/newsletter/unsubscribe?token=sample-token`
    ].join('\n');
  }

  if (key === 'newsletter-unsubscribe-confirmation') {
    return [
      'Hi Sam,',
      '',
      'We have processed your request and you are unsubscribed from newsletter updates from ASAP.',
      'We are sorry to see you go, and we appreciate your time with our community.',
      '',
      `If you change your mind, you can subscribe again from our newsletter page: ${sample.appUrl}/connect#newsletter`,
      'If this was not requested by you, please reply to this email so we can help right away.'
    ].join('\n');
  }

  if (key === 'waitlist-notification') {
    return [
      'A new user has joined the waitlist.',
      '',
      'Email: new-user@example.org',
      'Source: homepage-hero',
      'User agent: Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      'Time: 2026-02-28T14:40:00.000Z'
    ].join('\n');
  }

  if (key === 'google-linked') {
    return [
      'Hi Sam,',
      '',
      'Your Google account has been successfully linked to your ASAP profile.',
      'You can now use Log in with Google on the sign-in page.'
    ].join('\n');
  }

  if (key === 'google-unlinked') {
    return [
      'Hi Sam,',
      '',
      'Your Google account has been successfully unlinked from your ASAP profile.',
      'Use email/password to sign in moving forward.'
    ].join('\n');
  }

  if (key === 'review-request') {
    return [
      sample.greeting,
      '',
      'You have been invited to review website updates and share comments in review mode.',
      `Deadline: ${sample.reviewDeadlineLabel}`,
      `Review Link: ${sample.reviewUrl}`
    ].join('\n');
  }

  return [
    'Hello,',
    '',
    'This is a reminder that your review link closes soon.',
    `Time remaining: 1 day 4 hours`,
    `Review closes: ${sample.reminderDeadlineLabel}`,
    `Review Link: ${sample.reviewUrl}`
  ].join('\n');
}

export function getEmailPreviewTemplates(appUrl: string): EmailPreviewTemplateMeta[] {
  return [
    {
      key: 'invite',
      label: 'Invite',
      description: 'Admin invite email with role permissions and setup link.',
      textBody: buildEmailPreviewText('invite', appUrl)
    },
    {
      key: 'verification',
      label: 'Verification',
      description: 'Email verification flow sent during account setup.',
      textBody: buildEmailPreviewText('verification', appUrl)
    },
    {
      key: 'reset-password',
      label: 'Reset Password',
      description: 'Password reset request email.',
      textBody: buildEmailPreviewText('reset-password', appUrl)
    },
    {
      key: 'otp',
      label: 'OTP Code',
      description: 'One-time sign-in/security code email.',
      textBody: buildEmailPreviewText('otp', appUrl)
    },
    {
      key: 'welcome',
      label: 'Welcome',
      description: 'Post-invite account-ready confirmation email.',
      textBody: buildEmailPreviewText('welcome', appUrl)
    },
    {
      key: 'contact-enquiry',
      label: 'Contact Enquiry',
      description: 'Inbound contact form notification.',
      textBody: buildEmailPreviewText('contact-enquiry', appUrl)
    },
    {
      key: 'newsletter-campaign',
      label: 'Newsletter Campaign',
      description: 'Campaign content sent to users with explicit newsletter consent.',
      textBody: buildEmailPreviewText('newsletter-campaign', appUrl)
    },
    {
      key: 'newsletter-subscribe-confirmation',
      label: 'Newsletter Subscribe Confirmation',
      description: 'Confirmation sent after a user subscribes to newsletter updates.',
      textBody: buildEmailPreviewText('newsletter-subscribe-confirmation', appUrl)
    },
    {
      key: 'newsletter-unsubscribe-confirmation',
      label: 'Newsletter Unsubscribe Confirmation',
      description: 'Confirmation sent after a user unsubscribes from newsletter updates.',
      textBody: buildEmailPreviewText('newsletter-unsubscribe-confirmation', appUrl)
    },
    {
      key: 'waitlist-notification',
      label: 'Waitlist Notification',
      description: 'Internal alert for new waitlist signup.',
      textBody: buildEmailPreviewText('waitlist-notification', appUrl)
    },
    {
      key: 'google-linked',
      label: 'Google Linked',
      description: 'Account notification after Google link succeeds.',
      textBody: buildEmailPreviewText('google-linked', appUrl)
    },
    {
      key: 'google-unlinked',
      label: 'Google Unlinked',
      description: 'Account notification after Google unlink succeeds.',
      textBody: buildEmailPreviewText('google-unlinked', appUrl)
    },
    {
      key: 'review-request',
      label: 'Review Request',
      description: 'Draft page review invitation email.',
      textBody: buildEmailPreviewText('review-request', appUrl)
    },
    {
      key: 'review-reminder',
      label: 'Review Reminder',
      description: 'Reminder email sent before review deadline.',
      textBody: buildEmailPreviewText('review-reminder', appUrl)
    },
    ...getEventRegistrationEmailPreviewTemplates(appUrl)
  ];
}
