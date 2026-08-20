import { Text } from '@react-email/components';
import type { CSSProperties } from 'react';
import { BaseEmailLayout, EmailParagraph, EmailSmall } from '@/components/email/base-email';

type OtpCodeEmailProps = {
  subject: string;
  action: string;
  otp: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
};

export function OtpCodeEmail({ subject, action, otp, siteName, appUrl, logoUrl }: OtpCodeEmailProps) {
  return (
    <BaseEmailLayout
      previewText={subject}
      heading={subject}
      siteName={siteName}
      appUrl={appUrl}
      logoUrl={logoUrl}
    >
      <EmailParagraph>Use this one-time code to {action}:</EmailParagraph>
      <Text style={styles.code}>{otp}</Text>
      <EmailSmall>This code expires shortly. If you did not request this, you can ignore this email.</EmailSmall>
    </BaseEmailLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  code: {
    fontSize: '28px',
    letterSpacing: '6px',
    fontWeight: 700,
    color: '#111827',
    margin: '14px 0'
  }
};

