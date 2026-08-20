import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/email-text-builders.ts');

export function buildInviteTextBody(params: {
  firstName: string;
  invitedByName: string;
  siteName: string;
  roleName: string;
  permissions: string[];
  inviteUrl: string;
  recipientEmail: string;
  appUrl: string;
}) {
  const lines = [
    `Hi ${params.firstName},`,
    '',
    `We are delighted to welcome you to ${params.siteName}.`,
    '',
    `Our mission to bridge rigorous scholarship with practical reform and challenge structural barriers has never been more vital. To help us amplify this work across our global network, ${params.invitedByName} has invited you to join our digital platform in the ${params.roleName} role.`,
    ''
  ];

  if (params.permissions.length > 0) {
    lines.push("With your new role, you'll be able to:");
    for (const permission of params.permissions) {
      lines.push(`- ${permission}`);
    }
    lines.push('');
  }

  lines.push('Ready to get started?');
  lines.push('Please verify your account and set your password by copying and pasting this link into your browser:');
  lines.push(params.inviteUrl);
  lines.push('');
  lines.push(
    'Thank you for joining our efforts to reform the systemic factors that sustain poverty. We look forward to collaborating with you!'
  );
  lines.push('');
  lines.push('In solidarity,');
  lines.push('The ASAP Global Team');
  lines.push(params.siteName);
  lines.push('');
  lines.push(
    `This invitation was sent to ${params.recipientEmail}. If you were not expecting this, you can safely ignore this email.`
  );
  lines.push('');
  lines.push(`(c) ${new Date().getFullYear()} ${params.siteName} - ${params.appUrl || ''}`.trim());
  return lines.join('\n');
}

export function buildWelcomeTextBody(params: {
  firstName: string;
  roleName: string;
  siteName: string;
  appUrl: string;
}) {
  const lines = [
    `Hi ${params.firstName},`,
    '',
    `Thanks for setting up your password. Your account is now active, and you have access to the Academics Stand Against Poverty website backend.`,
    '',
    `This portal is where we manage the site's content. Depending on your ${params.roleName} permissions, you can jump right in to:`,
    '',
    '- Add News and Events: Draft and publish the latest ASAP articles, announcements, and global chapter updates.',
    '- Update Web Pages: Edit text and keep our core research initiatives current.',
    '- Manage Media: Upload images and documents to support our pages.',
    '',
    `You can log in to the admin dashboard anytime using this link: ${params.appUrl}`,
    '',
    "If you run into any technical bugs or need help navigating the website editor, just reply to this email. We're here to help.",
    '',
    'Thanks for helping us maintain the site!',
    '',
    'Best,',
    'The ASAP Global Team',
    params.siteName
  ];
  return lines.join('\n');
}
