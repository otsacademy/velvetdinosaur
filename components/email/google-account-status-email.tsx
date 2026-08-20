import { BaseEmailLayout, EmailParagraph, EmailSignature, EmailSmall } from '@/components/email/base-email';

type GoogleAccountStatusEmailProps = {
  subject: string;
  firstName: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  status: 'linked' | 'unlinked';
};

export function GoogleAccountStatusEmail({
  subject,
  firstName,
  siteName,
  appUrl,
  logoUrl,
  status
}: GoogleAccountStatusEmailProps) {
  const isLinked = status === 'linked';

  return (
    <BaseEmailLayout
      previewText={subject}
      heading={subject}
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>Hi {firstName},</EmailParagraph>

      {isLinked ? (
        <>
          <EmailParagraph>
            Your Google account has been successfully linked to your <strong>Academics Stand Against Poverty</strong>{' '}
            profile.
          </EmailParagraph>
          <EmailParagraph>
            Going forward, you can simply use the <strong>Log in with Google</strong> button on the sign-in page for
            faster access to the platform.
          </EmailParagraph>
          <EmailParagraph>
            If you ever need to manage or remove this connection, you can unlink your Google account at any time from
            the <strong>Accounts page</strong> in your dashboard.
          </EmailParagraph>
          <EmailSmall>
            <em>
              If you did not authorize this change, please let us know immediately by replying to this email so we can
              secure your account.
            </em>
          </EmailSmall>
        </>
      ) : (
        <>
          <EmailParagraph>
            Your Google account has been successfully unlinked from your <strong>Academics Stand Against Poverty</strong>{' '}
            profile.
          </EmailParagraph>
          <EmailParagraph>
            You will no longer be able to use the <strong>Log in with Google</strong> button. Going forward, please
            use your registered email address and password to sign in to the platform.
          </EmailParagraph>
          <EmailParagraph>
            If you ever want to reconnect your account, you can do so at any time from the <strong>Accounts page</strong>{' '}
            in your dashboard.
          </EmailParagraph>
          <EmailSmall>
            <em>If you did not authorize this change, please reply to this email immediately so we can secure your account.</em>
          </EmailSmall>
        </>
      )}

      <EmailSignature siteName={siteName} />
    </BaseEmailLayout>
  );
}

