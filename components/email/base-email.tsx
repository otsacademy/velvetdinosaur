import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';

import { TRADING_NAME_STATEMENT } from '@/lib/legal-identity';

type BaseEmailLayoutProps = {
  previewText: string;
  heading: string;
  siteName: string;
  appUrl?: string;
  logoUrl: string;
  children: ReactNode;
};

type EmailTextProps = {
  children: ReactNode;
};

type EmailCtaButtonProps = {
  href: string;
  label: string;
};

type EmailLinkProps = {
  href: string;
  children: ReactNode;
};

type EmailSignatureProps = {
  siteName: string;
};

export function BaseEmailLayout({
  previewText,
  heading,
  siteName,
  appUrl = '',
  logoUrl,
  children
}: BaseEmailLayoutProps) {
  const hasAppUrl = appUrl.trim().length > 0;
  const logoNode = <Img src={logoUrl} width="90" alt={`${siteName} logo`} style={styles.logo} />;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.outer}>
          <Section style={styles.card}>
            <Section style={styles.header}>
              {hasAppUrl ? (
                <Link href={appUrl} style={styles.link}>
                  {logoNode}
                </Link>
              ) : (
                logoNode
              )}
            </Section>

            <Text style={styles.heading}>{heading}</Text>

            {children}

            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              <em>
                (c) {new Date().getFullYear()} {siteName}
                {hasAppUrl ? (
                  <>
                    {' '}
                    -{' '}
                    <Link href={appUrl} style={styles.link}>
                      {appUrl}
                    </Link>
                  </>
                ) : null}
              </em>
            </Text>
            <Text style={styles.footerLegal}>{TRADING_NAME_STATEMENT}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailParagraph({ children }: EmailTextProps) {
  return <Text style={styles.text}>{children}</Text>;
}

export function EmailSmall({ children }: EmailTextProps) {
  return <Text style={styles.small}>{children}</Text>;
}

export function EmailLink({ href, children }: EmailLinkProps) {
  return (
    <Link href={href} style={styles.link}>
      {children}
    </Link>
  );
}

export function EmailCtaButton({ href, label }: EmailCtaButtonProps) {
  return (
    <Section style={styles.ctaRow}>
      <Button href={href} style={styles.button}>
        {label}
      </Button>
    </Section>
  );
}

export function EmailList({ children }: EmailTextProps) {
  return <ul style={styles.list}>{children}</ul>;
}

export function EmailListItem({ children }: EmailTextProps) {
  return <li style={styles.listItem}>{children}</li>;
}

export function EmailSignature({ siteName }: EmailSignatureProps) {
  return (
    <Text style={styles.signature}>
      Best,
      <br />
      <strong>The {siteName} team</strong>
    </Text>
  );
}

const styles: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    backgroundColor: '#f6f7fb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '24px 0'
  },
  outer: {
    backgroundColor: '#f6f7fb',
    padding: '0 12px',
    maxWidth: '560px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '28px'
  },
  header: {
    textAlign: 'left',
    marginBottom: '12px'
  },
  logo: {
    display: 'block'
  },
  heading: {
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: 700,
    margin: '16px 0 8px',
    color: '#111827'
  },
  text: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#111827',
    margin: '10px 0'
  },
  small: {
    fontSize: '12px',
    lineHeight: '18px',
    color: '#4b5563',
    margin: '10px 0'
  },
  link: {
    color: '#111827',
    textDecoration: 'underline',
    wordBreak: 'break-word'
  },
  ctaRow: {
    margin: '18px 0 16px',
    textAlign: 'left'
  },
  button: {
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    padding: '12px 16px',
    borderRadius: '10px',
    textDecoration: 'none',
    display: 'inline-block'
  },
  list: {
    marginTop: '6px',
    marginBottom: '12px',
    paddingLeft: '22px'
  },
  listItem: {
    fontSize: '14px',
    lineHeight: '22px',
    margin: '8px 0',
    color: '#111827'
  },
  signature: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#111827',
    marginTop: '8px'
  },
  hr: {
    borderColor: '#e5e7eb',
    margin: '18px 0'
  },
  footer: {
    fontSize: '12px',
    lineHeight: '18px',
    color: '#6b7280',
    marginTop: '12px'
  },
  footerLegal: {
    fontSize: '11px',
    lineHeight: '16px',
    color: '#9ca3af',
    marginTop: '6px'
  }
};

export const emailStyles = styles;
