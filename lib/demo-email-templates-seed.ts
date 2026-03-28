export type DemoEmailTemplate = {
  key: string;
  label: string;
  description: string;
  tokens: string[];
  requiredTokens: string[];
  sampleValues: Record<string, string>;
  initialHtml: string;
  initialText: string;
  defaultHtml: string;
  defaultText: string;
  updatedAt: string | null;
};

function joinHtml(lines: string[]) {
  return lines.join('');
}

function joinText(lines: string[]) {
  return lines.join('\n');
}

export function createDemoEmailTemplates(): DemoEmailTemplate[] {
  const sharedValues = {
    '{{siteName}}': 'Harbour & Pine Studio',
    '{{appUrl}}': 'https://harbourandpine.example',
    '{{logoUrl}}': 'https://velvetdinosaur.com/logo.webp',
    '{{firstName}}': 'Amelia',
    '{{name}}': 'Amelia Hart',
    '{{email}}': 'amelia@harbourandpine.example',
    '{{message}}': 'We would love the launch site and booking pages to feel calmer and more premium.',
    '{{topic}}': 'Website redesign',
    '{{sentAt}}': '23 March 2026, 09:30',
    '{{inviteUrl}}': 'https://harbourandpine.example/invite/demo-link',
    '{{reviewLink}}': 'https://harbourandpine.example/review/homepage-refresh',
    '{{verificationLink}}': 'https://harbourandpine.example/verify/demo-token',
    '{{resetLink}}': 'https://harbourandpine.example/reset/demo-token',
    '{{subject}}': 'Preview the latest draft',
    '{{preheader}}': 'A short look at the latest update from the studio team.',
    '{{deadline}}': 'Friday, 29 March at 16:00',
    '{{remaining}}': '3 days remaining',
    '{{invitedByName}}': 'Iris Coleman',
    '{{roleName}}': 'Studio editor'
  };

  const inviteDefaultHtml = joinHtml([
    '<p>Hello {{firstName}},</p>',
    '<p>{{invitedByName}} has invited you to join {{siteName}} as a {{roleName}}.</p>',
    '<p><a href="{{inviteUrl}}">Accept your invitation</a></p>',
    '<p>This link will remain active until {{deadline}}.</p>'
  ]);
  const inviteDefaultText = joinText([
    'Hello {{firstName}},',
    '',
    '{{invitedByName}} has invited you to join {{siteName}} as a {{roleName}}.',
    'Accept your invitation: {{inviteUrl}}',
    'This link will remain active until {{deadline}}.'
  ]);

  const reviewDefaultHtml = joinHtml([
    '<p>Hello {{firstName}},</p>',
    '<p>A fresh draft is ready for review on {{siteName}}.</p>',
    '<p><a href="{{reviewLink}}">Open the review link</a></p>',
    '<p>Please leave notes before {{deadline}}.</p>'
  ]);
  const reviewDefaultText = joinText([
    'Hello {{firstName}},',
    '',
    'A fresh draft is ready for review on {{siteName}}.',
    'Open the review link: {{reviewLink}}',
    'Please leave notes before {{deadline}}.'
  ]);

  const verificationDefaultHtml = joinHtml([
    '<p>Hello {{firstName}},</p>',
    '<p>Please confirm your email address to finish setting up {{siteName}}.</p>',
    '<p><a href="{{verificationLink}}">Verify your email</a></p>'
  ]);
  const verificationDefaultText = joinText([
    'Hello {{firstName}},',
    '',
    'Please confirm your email address to finish setting up {{siteName}}.',
    'Verify your email: {{verificationLink}}'
  ]);

  const contactDefaultHtml = joinHtml([
    '<p>New contact message from {{name}} ({{email}}).</p>',
    '<p>Topic: {{topic}}</p>',
    '<p>Sent: {{sentAt}}</p>',
    '<hr/>',
    '<p>{{message}}</p>'
  ]);
  const contactDefaultText = joinText([
    'New contact message from {{name}} ({{email}}).',
    `Topic: {{topic}}`,
    `Sent: {{sentAt}}`,
    '',
    '{{message}}'
  ]);

  return [
    {
      key: 'invite',
      label: 'Team Invitation',
      description: 'Invite a collaborator into the workspace with a clear acceptance link and deadline.',
      tokens: ['{{firstName}}', '{{invitedByName}}', '{{siteName}}', '{{roleName}}', '{{inviteUrl}}', '{{deadline}}'],
      requiredTokens: ['{{firstName}}', '{{inviteUrl}}', '{{deadline}}'],
      sampleValues: sharedValues,
      defaultHtml: inviteDefaultHtml,
      defaultText: inviteDefaultText,
      initialHtml: joinHtml([
        '<p>Hello {{firstName}},</p>',
        '<p>{{invitedByName}} has invited you to join {{siteName}} as a {{roleName}}.</p>',
        '<p><a href="{{inviteUrl}}">Accept your invitation</a></p>',
        '<p>Please join before {{deadline}} so we can keep the launch schedule tidy.</p>'
      ]),
      initialText: joinText([
        'Hello {{firstName}},',
        '',
        '{{invitedByName}} has invited you to join {{siteName}} as a {{roleName}}.',
        'Accept your invitation: {{inviteUrl}}',
        'Please join before {{deadline}} so we can keep the launch schedule tidy.'
      ]),
      updatedAt: '2026-03-20T14:12:00.000Z'
    },
    {
      key: 'review-request',
      label: 'Review Request',
      description: 'Send an expiring review link to a client or collaborator for draft feedback.',
      tokens: ['{{firstName}}', '{{siteName}}', '{{reviewLink}}', '{{deadline}}', '{{remaining}}'],
      requiredTokens: ['{{reviewLink}}', '{{deadline}}'],
      sampleValues: sharedValues,
      defaultHtml: reviewDefaultHtml,
      defaultText: reviewDefaultText,
      initialHtml: joinHtml([
        '<p>Hello {{firstName}},</p>',
        '<p>A fresh draft is ready for review on {{siteName}}.</p>',
        '<p><a href="{{reviewLink}}">Open the review link</a></p>',
        '<p>Please leave notes before {{deadline}}. {{remaining}}.</p>'
      ]),
      initialText: joinText([
        'Hello {{firstName}},',
        '',
        'A fresh draft is ready for review on {{siteName}}.',
        'Open the review link: {{reviewLink}}',
        'Please leave notes before {{deadline}}. {{remaining}}.'
      ]),
      updatedAt: '2026-03-22T09:05:00.000Z'
    },
    {
      key: 'verification',
      label: 'Email Verification',
      description: 'Confirm a recipient email address before they can use the workspace.',
      tokens: ['{{firstName}}', '{{siteName}}', '{{verificationLink}}', '{{appUrl}}'],
      requiredTokens: ['{{verificationLink}}'],
      sampleValues: sharedValues,
      defaultHtml: verificationDefaultHtml,
      defaultText: verificationDefaultText,
      initialHtml: verificationDefaultHtml,
      initialText: verificationDefaultText,
      updatedAt: null
    },
    {
      key: 'contact',
      label: 'Contact Alert',
      description: 'Forward a structured contact enquiry into the studio inbox with the original message preserved.',
      tokens: ['{{name}}', '{{email}}', '{{topic}}', '{{message}}', '{{sentAt}}'],
      requiredTokens: ['{{name}}', '{{email}}', '{{message}}'],
      sampleValues: sharedValues,
      defaultHtml: contactDefaultHtml,
      defaultText: contactDefaultText,
      initialHtml: joinHtml([
        '<p><strong>New contact message</strong> from {{name}} ({{email}}).</p>',
        '<p>Topic: {{topic}}</p>',
        '<p>Sent: {{sentAt}}</p>',
        '<hr/>',
        '<p>{{message}}</p>'
      ]),
      initialText: contactDefaultText,
      updatedAt: '2026-03-18T11:40:00.000Z'
    }
  ];
}
