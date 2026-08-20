import { type EmailPreviewTemplateKey } from '@/lib/email-preview';

export type SystemEmailTemplateKey = EmailPreviewTemplateKey;

export type SystemEmailTemplateDefinition = {
  key: SystemEmailTemplateKey;
  label: string;
  description: string;
  tokens: string[];
  requiredTokens: string[];
  sampleValues: Record<string, string>;
};

export type SystemEmailTemplateEditorState = SystemEmailTemplateDefinition & {
  initialHtml: string;
  initialText: string;
  defaultHtml: string;
  defaultText: string;
  updatedAt: string | null;
};

export const TEMPLATE_ORDER: SystemEmailTemplateKey[] = [
  'invite',
  'verification',
  'reset-password',
  'otp',
  'welcome',
  'contact-enquiry',
  'newsletter-campaign',
  'newsletter-subscribe-confirmation',
  'newsletter-unsubscribe-confirmation',
  'event-registration-verification',
  'event-registration-confirmation',
  'event-registration-update',
  'event-registration-joining-instructions',
  'waitlist-notification',
  'google-linked',
  'google-unlinked',
  'review-request',
  'review-reminder'
];

const TEMPLATE_DEFINITIONS: Record<SystemEmailTemplateKey, Omit<SystemEmailTemplateDefinition, 'key'>> = {
  invite: {
    label: 'Invite',
    description: 'Admin invite email with role permissions and setup link.',
    tokens: [
      '{{firstName}}',
      '{{email}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{roleName}}',
      '{{inviteUrl}}',
      '{{invitedByName}}',
      '{{logoUrl}}',
      '{{permissionOne}}',
      '{{permissionTwo}}',
      '{{permissionThree}}'
    ],
    requiredTokens: ['{{inviteUrl}}', '{{roleName}}', '{{siteName}}'],
    sampleValues: {
      '{{firstName}}': 'Sam',
      '{{email}}': 'sam@example.com',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{roleName}}': 'Editor',
      '{{inviteUrl}}': 'https://example.org/sign-up?invite=sample-preview-token',
      '{{invitedByName}}': 'Admin Team',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png',
      '{{permissionOne}}':
        'Share Research: Create and edit pages to make cutting-edge evidence accessible to the public.',
      '{{permissionTwo}}': 'Showcase Global Impact: Upload media from global chapters.',
      '{{permissionThree}}': 'Drive the Narrative: Publish updates that advance anti-poverty work.'
    }
  },
  verification: {
    label: 'Verification',
    description: 'Email verification flow sent during account setup.',
    tokens: [
      '{{subject}}',
      '{{greeting}}',
      '{{verificationLink}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}'
    ],
    requiredTokens: ['{{verificationLink}}', '{{subject}}'],
    sampleValues: {
      '{{subject}}': 'Verify your email for ASAP',
      '{{greeting}}': 'Hello Sam,',
      '{{verificationLink}}': 'https://example.org/verify-email?token=sample-verification-token',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  },
  'reset-password': {
    label: 'Reset Password',
    description: 'Password reset request email.',
    tokens: ['{{subject}}', '{{greeting}}', '{{resetLink}}', '{{siteName}}', '{{appUrl}}', '{{logoUrl}}'],
    requiredTokens: ['{{resetLink}}', '{{subject}}'],
    sampleValues: {
      '{{subject}}': 'Reset your password for ASAP',
      '{{greeting}}': 'Hello Sam,',
      '{{resetLink}}': 'https://example.org/reset-password?token=sample-reset-token',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  },
  otp: {
    label: 'OTP Code',
    description: 'One-time sign-in/security code email.',
    tokens: ['{{subject}}', '{{action}}', '{{otpCode}}', '{{siteName}}', '{{appUrl}}', '{{logoUrl}}'],
    requiredTokens: ['{{otpCode}}', '{{action}}'],
    sampleValues: {
      '{{subject}}': 'Your ASAP security code',
      '{{action}}': 'sign in',
      '{{otpCode}}': '482913',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  },
  welcome: {
    label: 'Welcome',
    description: 'Post-invite account-ready confirmation email.',
    tokens: [
      '{{subject}}',
      '{{firstName}}',
      '{{roleName}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}'
    ],
    requiredTokens: ['{{firstName}}', '{{roleName}}', '{{siteName}}'],
    sampleValues: {
      '{{subject}}': 'Your ASAP website account is ready, Sam',
      '{{firstName}}': 'Sam',
      '{{roleName}}': 'Editor',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  },
  'contact-enquiry': {
    label: 'Contact Enquiry',
    description: 'Inbound contact form notification.',
    tokens: [
      '{{name}}',
      '{{email}}',
      '{{topic}}',
      '{{message}}',
      '{{sentAt}}',
      '{{appName}}',
      '{{appUrl}}',
      '{{logoUrl}}'
    ],
    requiredTokens: ['{{email}}', '{{message}}', '{{sentAt}}'],
    sampleValues: {
      '{{name}}': 'Sam Example',
      '{{email}}': 'sam@example.org',
      '{{topic}}': 'Research collaboration',
      '{{message}}': 'Thank you for your work. I would like to discuss a potential project.',
      '{{sentAt}}': '2026-02-28 14:30 UTC',
      '{{appName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  },
  'newsletter-campaign': {
    label: 'Newsletter Campaign',
    description:
      'Default composer template for consented newsletter campaigns. Supports dynamic blocks: {{newsHighlights}}, {{eventHighlights}}, and slug targeting via {{newsHighlights:slug-a,slug-b}}.',
    tokens: [
      '{{subject}}',
      '{{preheader}}',
      '{{firstName}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{newsHighlights}}',
      '{{eventHighlights}}',
      '{{unsubscribeUrl}}'
    ],
    requiredTokens: ['{{firstName}}', '{{unsubscribeUrl}}'],
    sampleValues: {
      '{{subject}}': 'ASAP Monthly Update',
      '{{preheader}}': 'Highlights from chapters, events, and publications.',
      '{{firstName}}': 'Sam',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{newsHighlights}}': 'Automatically rendered from latest published news.',
      '{{eventHighlights}}': 'Automatically rendered from upcoming published events.',
      '{{unsubscribeUrl}}': 'https://example.org/newsletter/unsubscribe?token=sample-token'
    }
  },
  'newsletter-subscribe-confirmation': {
    label: 'Newsletter Subscribe Confirmation',
    description: 'Confirmation sent to a user after saving newsletter consent.',
    tokens: [
      '{{subject}}',
      '{{firstName}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}',
      '{{unsubscribeUrl}}'
    ],
    requiredTokens: ['{{firstName}}', '{{unsubscribeUrl}}'],
    sampleValues: {
      '{{subject}}': 'You are subscribed to ASAP updates',
      '{{firstName}}': 'Sam',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png',
      '{{unsubscribeUrl}}': 'https://example.org/newsletter/unsubscribe?token=sample-token'
    }
  },
  'newsletter-unsubscribe-confirmation': {
    label: 'Newsletter Unsubscribe Confirmation',
    description: 'Confirmation sent to a user after newsletter unsubscribe.',
    tokens: [
      '{{subject}}',
      '{{firstName}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}',
      '{{resubscribeUrl}}'
    ],
    requiredTokens: ['{{firstName}}', '{{resubscribeUrl}}'],
    sampleValues: {
      '{{subject}}': 'You are unsubscribed from ASAP updates',
      '{{firstName}}': 'Sam',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png',
      '{{resubscribeUrl}}': 'https://example.org/connect#newsletter'
    }
  },
  'event-registration-verification': {
    label: 'Event Registration Verification',
    description: 'Double opt-in message sent after someone registers for a local event.',
    tokens: [
      '{{subject}}',
      '{{firstName}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}',
      '{{eventTitle}}',
      '{{eventDate}}',
      '{{eventLocation}}',
      '{{confirmUrl}}'
    ],
    requiredTokens: ['{{eventTitle}}', '{{confirmUrl}}'],
    sampleValues: {
      '{{subject}}': 'Please confirm your registration for Global Justice Summit 2026',
      '{{firstName}}': 'Sam',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png',
      '{{eventTitle}}': 'Global Justice Summit 2026',
      '{{eventDate}}': 'Thu, April 23, 2026, 15:00 UTC',
      '{{eventLocation}}': 'Online / Zoom',
      '{{confirmUrl}}': 'https://example.org/events/registration/confirm?token=sample-event-token'
    }
  },
  'event-registration-confirmation': {
    label: 'Event Registration Confirmation',
    description: 'Confirmation sent after a registrant confirms participation for a local event.',
    tokens: [
      '{{subject}}',
      '{{firstName}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}',
      '{{eventTitle}}',
      '{{eventDate}}',
      '{{eventLocation}}',
      '{{eventUrl}}'
    ],
    requiredTokens: ['{{eventTitle}}', '{{eventUrl}}'],
    sampleValues: {
      '{{subject}}': 'Your place is confirmed for Global Justice Summit 2026',
      '{{firstName}}': 'Sam',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png',
      '{{eventTitle}}': 'Global Justice Summit 2026',
      '{{eventDate}}': 'Thu, April 23, 2026, 15:00 UTC',
      '{{eventLocation}}': 'Online / Zoom',
      '{{eventUrl}}': 'https://example.org/events/global-justice-summit-2026'
    }
  },
  'event-registration-update': {
    label: 'Event Registration Update',
    description: 'Default template used for event-specific updates sent to confirmed participants.',
    tokens: [
      '{{subject}}',
      '{{preheader}}',
      '{{firstName}}',
      '{{fullName}}',
      '{{email}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}',
      '{{eventTitle}}',
      '{{eventDate}}',
      '{{eventLocation}}',
      '{{eventUrl}}',
      '{{joiningInstructions}}',
      '{{customMessage}}'
    ],
    requiredTokens: ['{{firstName}}', '{{eventTitle}}', '{{eventUrl}}'],
    sampleValues: {
      '{{subject}}': 'Important update for Global Justice Summit 2026',
      '{{preheader}}': 'A quick update for confirmed participants.',
      '{{firstName}}': 'Sam',
      '{{fullName}}': 'Sam Example',
      '{{email}}': 'sam@example.org',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png',
      '{{eventTitle}}': 'Global Justice Summit 2026',
      '{{eventDate}}': 'Thu, April 23, 2026, 15:00 UTC',
      '{{eventLocation}}': 'Online / Zoom',
      '{{eventUrl}}': 'https://example.org/events/global-justice-summit-2026',
      '{{joiningInstructions}}': 'Join Zoom: https://example.zoom.us/j/123456789',
      '{{customMessage}}': 'The chair will now open with a short remarks session before the first panel.'
    }
  },
  'event-registration-joining-instructions': {
    label: 'Event Joining Instructions',
    description: 'Default template for final joining details sent to confirmed event participants.',
    tokens: [
      '{{subject}}',
      '{{preheader}}',
      '{{firstName}}',
      '{{fullName}}',
      '{{email}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}',
      '{{eventTitle}}',
      '{{eventDate}}',
      '{{eventLocation}}',
      '{{eventUrl}}',
      '{{joiningInstructions}}'
    ],
    requiredTokens: ['{{firstName}}', '{{eventTitle}}', '{{joiningInstructions}}'],
    sampleValues: {
      '{{subject}}': 'Joining instructions for Global Justice Summit 2026',
      '{{preheader}}': 'Everything you need to join the event.',
      '{{firstName}}': 'Sam',
      '{{fullName}}': 'Sam Example',
      '{{email}}': 'sam@example.org',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png',
      '{{eventTitle}}': 'Global Justice Summit 2026',
      '{{eventDate}}': 'Thu, April 23, 2026, 15:00 UTC',
      '{{eventLocation}}': 'Online / Zoom',
      '{{eventUrl}}': 'https://example.org/events/global-justice-summit-2026',
      '{{joiningInstructions}}':
        'Join Zoom: https://example.zoom.us/j/123456789. Please join 10 minutes early and keep your confirmation email to hand.'
    }
  },
  'waitlist-notification': {
    label: 'Waitlist Notification',
    description: 'Internal alert for new waitlist signup.',
    tokens: [
      '{{subject}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}',
      '{{email}}',
      '{{source}}',
      '{{userAgent}}',
      '{{createdAt}}'
    ],
    requiredTokens: ['{{email}}', '{{createdAt}}'],
    sampleValues: {
      '{{subject}}': 'New waitlist signup for ASAP',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png',
      '{{email}}': 'new-user@example.org',
      '{{source}}': 'homepage-hero',
      '{{userAgent}}': 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      '{{createdAt}}': '2026-02-28T14:40:00.000Z'
    }
  },
  'google-linked': {
    label: 'Google Linked',
    description: 'Account notification after Google link succeeds.',
    tokens: ['{{subject}}', '{{firstName}}', '{{siteName}}', '{{appUrl}}', '{{logoUrl}}'],
    requiredTokens: ['{{firstName}}', '{{subject}}'],
    sampleValues: {
      '{{subject}}': 'Your Google account is linked to ASAP',
      '{{firstName}}': 'Sam',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  },
  'google-unlinked': {
    label: 'Google Unlinked',
    description: 'Account notification after Google unlink succeeds.',
    tokens: ['{{subject}}', '{{firstName}}', '{{siteName}}', '{{appUrl}}', '{{logoUrl}}'],
    requiredTokens: ['{{firstName}}', '{{subject}}'],
    sampleValues: {
      '{{subject}}': 'Your Google account is unlinked from ASAP',
      '{{firstName}}': 'Sam',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  },
  'review-request': {
    label: 'Review Request',
    description: 'Draft page review invitation email.',
    tokens: [
      '{{subject}}',
      '{{greeting}}',
      '{{reviewStart}}',
      '{{deadline}}',
      '{{reviewLink}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}'
    ],
    requiredTokens: ['{{deadline}}', '{{reviewLink}}'],
    sampleValues: {
      '{{subject}}': 'Review Request: Please provide feedback for ASAP',
      '{{greeting}}': 'Hello Sam,',
      '{{reviewStart}}': 'Thu, March 5, 2026, 09:00 AM',
      '{{deadline}}': 'Fri, March 6, 2026, 04:00 PM',
      '{{reviewLink}}': 'https://example.org/review/preview-token',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  },
  'review-reminder': {
    label: 'Review Reminder',
    description: 'Reminder email sent before review deadline.',
    tokens: [
      '{{subject}}',
      '{{remaining}}',
      '{{deadline}}',
      '{{reviewLink}}',
      '{{siteName}}',
      '{{appUrl}}',
      '{{logoUrl}}'
    ],
    requiredTokens: ['{{remaining}}', '{{deadline}}', '{{reviewLink}}'],
    sampleValues: {
      '{{subject}}': 'Reminder: Your ASAP review link closes soon',
      '{{remaining}}': '1 day 4 hours',
      '{{deadline}}': 'Fri, March 6, 2026, 04:00 PM (2026-03-06 16:00 UTC)',
      '{{reviewLink}}': 'https://example.org/review/preview-token',
      '{{siteName}}': 'ASAP',
      '{{appUrl}}': 'https://example.org',
      '{{logoUrl}}': 'https://example.org/images/asap-logo.png'
    }
  }
};

export function getSystemEmailTemplateDefinition(key: SystemEmailTemplateKey): SystemEmailTemplateDefinition {
  const definition = TEMPLATE_DEFINITIONS[key];
  return {
    key,
    label: definition.label,
    description: definition.description,
    tokens: [...definition.tokens],
    requiredTokens: [...definition.requiredTokens],
    sampleValues: { ...definition.sampleValues }
  };
}

export function getSystemEmailTemplateDefinitions() {
  return TEMPLATE_ORDER.map((key) => getSystemEmailTemplateDefinition(key));
}
